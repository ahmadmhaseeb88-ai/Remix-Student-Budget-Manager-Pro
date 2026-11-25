import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  db,
  User,
  Transaction,
  Budget,
  SavingsGoal,
  BillReminder,
  SemesterPlan,
  Receipt,
  SubscriptionRecord,
  SmsLog,
  FamilyGroup,
  FamilyMember,
  FamilyTransaction,
  FamilySharedGoal,
} from './db.js';
import { AuthenticatedRequest, requireAuth, requireAdmin, generateToken } from './authMiddleware.js';
import { analyzeStudentFinances, parseVoiceExpense, parseReceiptOCR, parseSmsExpense, chatFinancialAdvisor } from './gemini.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE ROUTES
// ==========================================

// Register
apiRouter.post('/auth/register', (req, res) => {
  const {
    name,
    email,
    password,
    confirm_password,
    student_id,
    university,
    semester,
    currency,
    monthly_budget,
    financial_goals,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  if (confirm_password && password !== confirm_password) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password_hash,
    student_id: student_id ? String(student_id).trim() : undefined,
    university: university ? String(university).trim() : 'University',
    semester: semester ? String(semester).trim() : '1st Semester',
    currency: currency || 'PKR',
    monthly_budget: Number(monthly_budget) > 0 ? Number(monthly_budget) : 30000,
    financial_goals: financial_goals ? String(financial_goals).trim() : undefined,
    role: 'student',
    plan: 'free',
    created_at: new Date().toISOString(),
  };

  db.createUser(newUser);

  // Initialize a default overall budget for the student
  db.createBudget({
    id: `bg_${Date.now()}`,
    user_id: newUser.id,
    category: 'Overall',
    period: 'monthly',
    amount: newUser.monthly_budget,
    threshold_percent: 85,
    is_active: true,
    created_at: new Date().toISOString(),
  });

  const token = generateToken(newUser);
  const { password_hash: _, ...safeUser } = newUser;
  return res.status(201).json({ token, user: safeUser, message: 'Registration successful!' });
});

// Login
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email address or password.' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email address or password.' });
  }

  const token = generateToken(user);
  const { password_hash: _, ...safeUser } = user;
  return res.json({ token, user: safeUser, message: 'Welcome back!' });
});

// Get current user profile
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { password_hash: _, ...safeUser } = req.user!;
  return res.json({ user: safeUser });
});

// Update profile
apiRouter.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, university, semester, currency, monthly_budget, student_id, financial_goals } = req.body;
  const updates: Partial<User> = {};

  if (name) updates.name = String(name).trim();
  if (university) updates.university = String(university).trim();
  if (semester) updates.semester = String(semester).trim();
  if (currency) updates.currency = String(currency).trim();
  if (monthly_budget !== undefined) updates.monthly_budget = Number(monthly_budget);
  if (student_id !== undefined) updates.student_id = String(student_id).trim();
  if (financial_goals !== undefined) updates.financial_goals = String(financial_goals).trim();

  const updated = db.updateUser(req.user!.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password_hash: _, ...safeUser } = updated;
  return res.json({ user: safeUser, message: 'Profile updated successfully.' });
});

// Change password
apiRouter.put('/auth/password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  if (confirm_password && new_password !== confirm_password) {
    return res.status(400).json({ error: 'New passwords do not match.' });
  }

  const valid = bcrypt.compareSync(current_password, req.user!.password_hash);
  if (!valid) {
    return res.status(400).json({ error: 'Incorrect current password.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(new_password, salt);
  db.updateUser(req.user!.id, { password_hash });

  return res.json({ message: 'Password changed successfully.' });
});

// Forgot password
apiRouter.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter your account email.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    // Return generic message for security
    return res.json({
      message: 'If an account exists with this email, password reset instructions have been generated.',
    });
  }

  // Simulated token for development
  return res.json({
    message: `A password reset link has been dispatched to ${email}. (Development note: for quick testing, use password 'student123' for the demo account or register a fresh account).`,
  });
});

// Delete account
apiRouter.delete('/auth/account', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Please enter your password to confirm account deletion.' });
  }

  const valid = bcrypt.compareSync(password, req.user!.password_hash);
  if (!valid) {
    return res.status(400).json({ error: 'Invalid password. Cannot delete account.' });
  }

  db.deleteUser(req.user!.id);
  return res.json({ message: 'Account and all associated records permanently removed.' });
});

// ==========================================
// 2. DASHBOARD SUMMARY ROUTE
// ==========================================

apiRouter.get('/dashboard/summary', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const allTx = db.getTransactions(userId);
  const budgets = db.getBudgets(userId);
  const goals = db.getGoals(userId);
  const bills = db.getBills(userId);

  const monthParam = req.query.month as string;
  let targetYear: number;
  let targetMonth: number;

  if (monthParam && monthParam.includes('-')) {
    const parts = monthParam.split('-');
    targetYear = parseInt(parts[0], 10);
    targetMonth = parseInt(parts[1], 10) - 1;
  } else {
    const now = new Date();
    targetYear = now.getFullYear();
    targetMonth = now.getMonth();
  }

  // Total balance calculation:
  // All recorded income minus all recorded expenses to date
  let totalAllTimeIncome = 0;
  let totalAllTimeExpense = 0;

  for (const t of allTx) {
    if (t.type === 'income') totalAllTimeIncome += t.amount;
    else if (t.type === 'expense') totalAllTimeExpense += t.amount;
  }

  const totalBalance = totalAllTimeIncome - totalAllTimeExpense;

  // Monthly filtered transactions (parse YYYY-MM-DD directly to avoid UTC timezone shift)
  const monthPrefix = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
  const monthTx = allTx.filter((t) => {
    if (typeof t.date === 'string' && /^\d{4}-\d{2}/.test(t.date)) {
      return t.date.startsWith(monthPrefix);
    }
    const d = new Date(t.date);
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  });

  const monthIncome = monthTx
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthExpense = monthTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  // Overall monthly budget
  const overallBudget = budgets.find((b) => b.category === 'Overall') || {
    amount: req.user!.monthly_budget || 30000,
    threshold_percent: 85,
  };

  const remainingBudget = Math.max(0, overallBudget.amount - monthExpense);
  const budgetUtilization = overallBudget.amount > 0 ? Math.round((monthExpense / overallBudget.amount) * 100) : 0;

  // Savings progress
  const totalSavingsTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalSavedSoFar = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const savingsProgressPercent = totalSavingsTarget > 0 ? Math.round((totalSavedSoFar / totalSavingsTarget) * 100) : 0;

  // Category breakdown for current month
  const categoryMap: Record<string, number> = {};
  for (const t of monthTx.filter((x) => x.type === 'expense')) {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  }

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: monthExpense > 0 ? Math.round((amount / monthExpense) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Daily spending timeline
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const dailySpending: Array<{ day: number; expense: number; income: number }> = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTransactions = monthTx.filter((t) => t.date === dayStr);
    const dayExpense = dayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const dayIncome = dayTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    dailySpending.push({ day: d, expense: dayExpense, income: dayIncome });
  }

  // Upcoming unpaid bills
  const upcomingBills = bills
    .filter((b) => !b.is_paid)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4);

  return res.json({
    currency: req.user!.currency || 'PKR',
    totalBalance,
    monthIncome,
    monthExpense,
    monthlyBudget: overallBudget.amount,
    remainingBudget,
    budgetUtilization,
    budgetThreshold: overallBudget.threshold_percent,
    totalSavedSoFar,
    totalSavingsTarget,
    savingsProgressPercent,
    categoryBreakdown,
    dailySpending,
    recentTransactions: allTx.slice(0, 6),
    upcomingBills,
    activeGoalsCount: goals.filter((g) => g.status === 'active').length,
    plan: req.user!.plan,
  });
});

// ==========================================
// 3. TRANSACTIONS CRUD & IMPORT/EXPORT
// ==========================================

// Get transactions with search, filter, pagination
apiRouter.get('/transactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  let items = db.getTransactions(userId);

  const { type, category, startDate, endDate, search, payment_method, sort, page = '1', limit = '15' } = req.query;

  if (type && typeof type === 'string' && type !== 'all') {
    items = items.filter((t) => t.type === type);
  }

  if (category && typeof category === 'string' && category !== 'all') {
    items = items.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }

  if (payment_method && typeof payment_method === 'string' && payment_method !== 'all') {
    items = items.filter((t) => t.payment_method === payment_method);
  }

  if (startDate && typeof startDate === 'string') {
    items = items.filter((t) => t.date >= startDate);
  }

  if (endDate && typeof endDate === 'string') {
    items = items.filter((t) => t.date <= endDate);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    items = items.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.merchant && t.merchant.toLowerCase().includes(q))
    );
  }

  if (sort === 'amount_desc') {
    items.sort((a, b) => b.amount - a.amount);
  } else if (sort === 'amount_asc') {
    items.sort((a, b) => a.amount - b.amount);
  } else if (sort === 'date_asc') {
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    // default date desc
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const pageNum = Math.max(1, parseInt(String(page), 10));
  const pageLimit = Math.max(1, parseInt(String(limit), 10));
  const total = items.length;
  const totalPages = Math.ceil(total / pageLimit);
  const paginated = items.slice((pageNum - 1) * pageLimit, pageNum * pageLimit);

  return res.json({
    data: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: pageLimit,
      totalPages,
    },
  });
});

// Create transaction
apiRouter.post('/transactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { type, amount, category, description, date, payment_method, merchant, tags, receipt_id } = req.body;

  if (!type || !amount || !category || !description) {
    return res.status(400).json({ error: 'Type, amount, category, and description are required.' });
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  const newTx: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    user_id: req.user!.id,
    type: type === 'income' ? 'income' : type === 'transfer' ? 'transfer' : 'expense',
    amount: parsedAmount,
    category: String(category).trim(),
    description: String(description).trim(),
    date: date ? String(date).trim() : new Date().toISOString().split('T')[0],
    payment_method: payment_method || 'Cash',
    merchant: merchant ? String(merchant).trim() : undefined,
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((s) => s.trim()) : undefined,
    receipt_id: receipt_id || undefined,
    created_at: new Date().toISOString(),
  };

  const created = db.createTransaction(newTx);
  return res.status(201).json({ data: created, message: 'Transaction recorded successfully.' });
});

// Update transaction
apiRouter.put('/transactions/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { type, amount, category, description, date, payment_method, merchant, tags } = req.body;

  const existing = db.getTransactionById(id, req.user!.id);
  if (!existing) {
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  const updates: Partial<Transaction> = {};
  if (type) updates.type = type;
  if (amount !== undefined) {
    const parsed = Number(amount);
    if (isNaN(parsed) || parsed <= 0) return res.status(400).json({ error: 'Amount must be a positive number.' });
    updates.amount = parsed;
  }
  if (category) updates.category = String(category).trim();
  if (description) updates.description = String(description).trim();
  if (date) updates.date = String(date).trim();
  if (payment_method) updates.payment_method = payment_method;
  if (merchant !== undefined) updates.merchant = String(merchant).trim();
  if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : String(tags).split(',').map((s) => s.trim());

  const updated = db.updateTransaction(id, req.user!.id, updates);
  return res.json({ data: updated, message: 'Transaction updated successfully.' });
});

// Delete transaction
apiRouter.delete('/transactions/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteTransaction(id, req.user!.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Transaction not found or access denied.' });
  }
  return res.json({ message: 'Transaction deleted.' });
});

// Bulk Import CSV transactions
apiRouter.post('/transactions/import-csv', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Please provide an array of transaction rows.' });
  }

  let importedCount = 0;
  for (const row of rows) {
    if (row.amount && row.category && row.description) {
      const parsedAmount = Math.abs(Number(row.amount));
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        db.createTransaction({
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          user_id: req.user!.id,
          type: row.type === 'income' ? 'income' : 'expense',
          amount: parsedAmount,
          category: String(row.category).trim(),
          description: String(row.description).trim(),
          date: row.date || new Date().toISOString().split('T')[0],
          payment_method: row.payment_method || 'Cash',
          merchant: row.merchant || undefined,
          created_at: new Date().toISOString(),
        });
        importedCount++;
      }
    }
  }

  return res.json({ count: importedCount, message: `Successfully imported ${importedCount} transactions.` });
});

// Export CSV transactions
apiRouter.get('/transactions/export-csv', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const items = db.getTransactions(req.user!.id);
  const headers = ['ID', 'Date', 'Type', 'Amount', 'Currency', 'Category', 'Description', 'Payment Method', 'Merchant'];
  const rows = items.map((t) => [
    t.id,
    t.date,
    t.type,
    t.amount.toFixed(2),
    req.user!.currency || 'PKR',
    `"${t.category.replace(/"/g, '""')}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    t.payment_method,
    `"${(t.merchant || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="student_budget_transactions_${new Date().toISOString().split('T')[0]}.csv"`);
  return res.send(csvContent);
});

// ==========================================
// 4. SMART BUDGET MANAGEMENT
// ==========================================

apiRouter.get('/budgets', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const budgets = db.getBudgets(req.user!.id);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get current month expense transactions (parse YYYY-MM-DD safely)
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthExpenses = db
    .getTransactions(req.user!.id)
    .filter((t) => {
      if (t.type !== 'expense') return false;
      if (typeof t.date === 'string' && /^\d{4}-\d{2}/.test(t.date)) {
        return t.date.startsWith(currentMonthPrefix);
      }
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

  // Calculate spent amount per budget
  const enriched = budgets.map((b) => {
    let spent = 0;
    if (b.category === 'Overall') {
      spent = monthExpenses.reduce((acc, t) => acc + t.amount, 0);
    } else {
      spent = monthExpenses
        .filter((t) => t.category.toLowerCase() === b.category.toLowerCase())
        .reduce((acc, t) => acc + t.amount, 0);
    }

    const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    const isExceeded = spent > b.amount;
    const isWarning = percentage >= b.threshold_percent && !isExceeded;

    return {
      ...b,
      spent,
      remaining: Math.max(0, b.amount - spent),
      percentage,
      isExceeded,
      isWarning,
    };
  });

  return res.json({ data: enriched });
});

apiRouter.post('/budgets', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { category, period, amount, threshold_percent } = req.body;
  if (!category || !amount) {
    return res.status(400).json({ error: 'Category and amount are required.' });
  }

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero.' });
  }

  const budget: Budget = {
    id: `bg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    user_id: req.user!.id,
    category: String(category).trim(),
    period: period || 'monthly',
    amount: parsedAmount,
    threshold_percent: Number(threshold_percent) || 80,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const created = db.createBudget(budget);
  return res.status(201).json({ data: created, message: 'Budget limit configured.' });
});

apiRouter.put('/budgets/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount, threshold_percent, is_active } = req.body;

  const updates: Partial<Budget> = {};
  if (amount !== undefined) {
    const parsed = Number(amount);
    if (parsed <= 0) return res.status(400).json({ error: 'Amount must be positive.' });
    updates.amount = parsed;
  }
  if (threshold_percent !== undefined) updates.threshold_percent = Number(threshold_percent);
  if (is_active !== undefined) updates.is_active = Boolean(is_active);

  const updated = db.updateBudget(id, req.user!.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Budget not found.' });
  }

  return res.json({ data: updated, message: 'Budget updated successfully.' });
});

apiRouter.delete('/budgets/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteBudget(id, req.user!.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Budget not found.' });
  }
  return res.json({ message: 'Budget limit removed.' });
});

// ==========================================
// 5. SAVINGS GOAL STUDIO
// ==========================================

apiRouter.get('/goals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const goals = db.getGoals(req.user!.id);
  const now = new Date();

  const enriched = goals.map((g) => {
    const percentage = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
    const remaining = Math.max(0, g.target_amount - g.current_amount);

    // Calculate recommended weekly / monthly savings pace
    const targetDate = new Date(g.target_date);
    const diffDays = Math.max(1, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const diffWeeks = Math.max(1, Math.ceil(diffDays / 7));
    const diffMonths = Math.max(1, Math.ceil(diffDays / 30));

    const suggestedWeeklySavings = remaining > 0 ? Math.round(remaining / diffWeeks) : 0;
    const suggestedMonthlySavings = remaining > 0 ? Math.round(remaining / diffMonths) : 0;
    const isOverdue = targetDate.getTime() < now.getTime() && g.current_amount < g.target_amount;

    return {
      ...g,
      percentage,
      remaining,
      daysRemaining: diffDays,
      suggestedWeeklySavings,
      suggestedMonthlySavings,
      isOverdue,
    };
  });

  return res.json({ data: enriched });
});

apiRouter.post('/goals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, target_amount, current_amount, target_date, priority, notes } = req.body;

  if (!title || !target_amount || !target_date) {
    return res.status(400).json({ error: 'Title, target amount, and target date are required.' });
  }

  const parsedTarget = Number(target_amount);
  if (isNaN(parsedTarget) || parsedTarget <= 0) {
    return res.status(400).json({ error: 'Target amount must be a positive number.' });
  }

  const newGoal: SavingsGoal = {
    id: `gl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    user_id: req.user!.id,
    title: String(title).trim(),
    target_amount: parsedTarget,
    current_amount: Number(current_amount) || 0,
    target_date: String(target_date).trim(),
    priority: priority || 'medium',
    notes: notes ? String(notes).trim() : undefined,
    status: (Number(current_amount) || 0) >= parsedTarget ? 'completed' : 'active',
    created_at: new Date().toISOString(),
  };

  const created = db.createGoal(newGoal);
  return res.status(201).json({ data: created, message: 'Savings goal created!' });
});

apiRouter.put('/goals/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, target_amount, current_amount, target_date, priority, notes, status } = req.body;

  const updates: Partial<SavingsGoal> = {};
  if (title) updates.title = String(title).trim();
  if (target_amount !== undefined) updates.target_amount = Number(target_amount);
  if (current_amount !== undefined) updates.current_amount = Number(current_amount);
  if (target_date) updates.target_date = String(target_date).trim();
  if (priority) updates.priority = priority;
  if (notes !== undefined) updates.notes = String(notes).trim();
  if (status) updates.status = status;

  const updated = db.updateGoal(id, req.user!.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Goal not found.' });
  }

  return res.json({ data: updated, message: 'Goal updated successfully.' });
});

// Deposit / Contribute into a goal
apiRouter.post('/goals/:id/deposit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount, deduct_from_balance } = req.body;

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Deposit amount must be a positive number.' });
  }

  const goal = db.getGoals(req.user!.id).find((g) => g.id === id);
  if (!goal) {
    return res.status(404).json({ error: 'Savings goal not found.' });
  }

  const newCurrent = goal.current_amount + parsedAmount;
  const newStatus = newCurrent >= goal.target_amount ? 'completed' : goal.status;

  const updated = db.updateGoal(id, req.user!.id, {
    current_amount: newCurrent,
    status: newStatus,
  });

  // If user requested to record this as an expense to deduct from available monthly cash
  if (deduct_from_balance) {
    db.createTransaction({
      id: `tx_${Date.now()}`,
      user_id: req.user!.id,
      type: 'expense',
      amount: parsedAmount,
      category: 'Other',
      description: `Savings Goal Deposit: ${goal.title}`,
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      created_at: new Date().toISOString(),
    });
  }

  return res.json({
    data: updated,
    isCompleted: newCurrent >= goal.target_amount,
    message: newCurrent >= goal.target_amount ? `🎉 Congratulations! You reached your goal "${goal.title}"!` : `Added deposit of ${parsedAmount} to ${goal.title}.`,
  });
});

apiRouter.delete('/goals/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteGoal(id, req.user!.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Goal not found.' });
  }
  return res.json({ message: 'Savings goal removed.' });
});

// ==========================================
// 6. BILLS & PAYMENT REMINDERS
// ==========================================

apiRouter.get('/bills', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const bills = db.getBills(req.user!.id);
  return res.json({ data: bills });
});

apiRouter.post('/bills', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { title, amount, category, due_date, recurring_frequency, reminder_days_before } = req.body;
  if (!title || !amount || !due_date) {
    return res.status(400).json({ error: 'Title, amount, and due date are required.' });
  }

  const newBill: BillReminder = {
    id: `bl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    user_id: req.user!.id,
    title: String(title).trim(),
    amount: Number(amount),
    category: category || 'Bills',
    due_date: String(due_date).trim(),
    recurring_frequency: recurring_frequency || 'none',
    is_paid: false,
    reminder_days_before: Number(reminder_days_before) || 3,
    created_at: new Date().toISOString(),
  };

  const created = db.createBill(newBill);
  return res.status(201).json({ data: created, message: 'Bill reminder created.' });
});

apiRouter.put('/bills/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, amount, category, due_date, recurring_frequency, is_paid } = req.body;

  const updates: Partial<BillReminder> = {};
  if (title) updates.title = String(title).trim();
  if (amount !== undefined) updates.amount = Number(amount);
  if (category) updates.category = String(category).trim();
  if (due_date) updates.due_date = String(due_date).trim();
  if (recurring_frequency) updates.recurring_frequency = recurring_frequency;
  if (is_paid !== undefined) updates.is_paid = Boolean(is_paid);

  const updated = db.updateBill(id, req.user!.id, updates);
  if (!updated) return res.status(404).json({ error: 'Bill not found.' });

  return res.json({ data: updated, message: 'Bill updated.' });
});

// Mark bill as paid & optionally log transaction
apiRouter.post('/bills/:id/pay', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { record_as_expense, payment_method } = req.body;

  const bill = db.getBills(req.user!.id).find((b) => b.id === id);
  if (!bill) {
    return res.status(404).json({ error: 'Bill reminder not found.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const updated = db.updateBill(id, req.user!.id, {
    is_paid: true,
    last_paid_at: today,
  });

  if (record_as_expense) {
    db.createTransaction({
      id: `tx_${Date.now()}`,
      user_id: req.user!.id,
      type: 'expense',
      amount: bill.amount,
      category: bill.category,
      description: `Bill Payment: ${bill.title}`,
      date: today,
      payment_method: payment_method || 'Cash',
      created_at: new Date().toISOString(),
    });
  }

  return res.json({ data: updated, message: `Bill "${bill.title}" marked as paid!` });
});

apiRouter.delete('/bills/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteBill(id, req.user!.id);
  if (!deleted) return res.status(404).json({ error: 'Bill not found.' });
  return res.json({ message: 'Bill reminder removed.' });
});

// ==========================================
// 7. SEMESTER SURVIVAL PLANNER
// ==========================================

apiRouter.get('/semester-plans', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const plans = db.getSemesterPlans(req.user!.id);

  const enriched = plans.map((p) => {
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const totalWeeks = Math.max(1, Math.round(diffDays / 7));
    const totalMonths = Math.max(1, Math.round(diffDays / 30));

    const totalIncome = p.expected_monthly_allowance * totalMonths + p.scholarship_salary;
    const totalExpenses =
      p.tuition_exam_fee +
      p.hostel_rent +
      p.food_transport_est +
      p.books_materials +
      p.other_expenses;

    const surplusOrDeficit = totalIncome - totalExpenses;
    const weeklySpendingAllowance = totalWeeks > 0 ? Math.round((totalIncome - p.tuition_exam_fee - p.hostel_rent) / totalWeeks) : 0;
    const potentialSavings = Math.max(0, surplusOrDeficit);

    return {
      ...p,
      durationDays: diffDays,
      totalWeeks,
      totalMonths,
      totalIncome,
      totalExpenses,
      surplusOrDeficit,
      weeklySpendingAllowance,
      potentialSavings,
      burnRatePerDay: Math.round(totalExpenses / diffDays),
    };
  });

  return res.json({ data: enriched });
});

apiRouter.post('/semester-plans', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const {
    semester_name,
    start_date,
    end_date,
    expected_monthly_allowance,
    scholarship_salary,
    tuition_exam_fee,
    hostel_rent,
    food_transport_est,
    books_materials,
    other_expenses,
    notes,
  } = req.body;

  if (!semester_name || !start_date || !end_date) {
    return res.status(400).json({ error: 'Semester name, start date, and end date are required.' });
  }

  const newPlan: SemesterPlan = {
    id: `sp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    user_id: req.user!.id,
    semester_name: String(semester_name).trim(),
    start_date: String(start_date).trim(),
    end_date: String(end_date).trim(),
    expected_monthly_allowance: Number(expected_monthly_allowance) || 0,
    scholarship_salary: Number(scholarship_salary) || 0,
    tuition_exam_fee: Number(tuition_exam_fee) || 0,
    hostel_rent: Number(hostel_rent) || 0,
    food_transport_est: Number(food_transport_est) || 0,
    books_materials: Number(books_materials) || 0,
    other_expenses: Number(other_expenses) || 0,
    notes: notes ? String(notes).trim() : undefined,
    created_at: new Date().toISOString(),
  };

  const created = db.saveSemesterPlan(newPlan);
  return res.status(201).json({ data: created, message: 'Semester Survival Plan saved!' });
});

apiRouter.put('/semester-plans/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getSemesterPlans(req.user!.id).find((s) => s.id === id);
  if (!existing) return res.status(404).json({ error: 'Semester plan not found.' });

  const updatedPlan: SemesterPlan = {
    ...existing,
    ...req.body,
    id,
    user_id: req.user!.id,
  };

  db.saveSemesterPlan(updatedPlan);
  return res.json({ data: updatedPlan, message: 'Semester plan updated successfully.' });
});

apiRouter.delete('/semester-plans/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteSemesterPlan(id, req.user!.id);
  if (!deleted) return res.status(404).json({ error: 'Semester plan not found.' });
  return res.json({ message: 'Semester plan deleted.' });
});

// ==========================================
// 8. CAMSCANNER RECEIPT SCANNER & OCR
// ==========================================

apiRouter.get('/receipts', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const receipts = db.getReceipts(req.user!.id);
  return res.json({ data: receipts });
});

apiRouter.post('/receipts/process', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { file_name, file_data_base64, mime_type, file_size } = req.body;

  if (!file_data_base64) {
    return res.status(400).json({ error: 'Receipt image data is required.' });
  }

  // Run OCR analysis via Gemini
  const ocrResult = await parseReceiptOCR(
    file_data_base64.replace(/^data:image\/[a-z]+;base64,/, ''),
    mime_type || 'image/jpeg'
  );

  const receipt: Receipt = {
    id: `rc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    user_id: req.user!.id,
    file_name: file_name || `receipt_${Date.now()}.jpg`,
    file_data_base64,
    mime_type: mime_type || 'image/jpeg',
    file_size: file_size || file_data_base64.length,
    merchant: ocrResult.merchant,
    total_amount: ocrResult.total_amount,
    date: ocrResult.date,
    category: ocrResult.category,
    line_items: ocrResult.line_items,
    status: 'processed',
    created_at: new Date().toISOString(),
  };

  const saved = db.saveReceipt(receipt);

  return res.json({
    data: saved,
    ocr: ocrResult,
    message: 'Receipt document scanned and digitized successfully.',
  });
});

apiRouter.delete('/receipts/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteReceipt(id, req.user!.id);
  if (!deleted) return res.status(404).json({ error: 'Receipt not found.' });
  return res.json({ message: 'Receipt deleted.' });
});

// ==========================================
// 9. SMART STUDENT MONEY COACH AI & VOICE
// ==========================================

const handleCoachInsights = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const transactions = db.getTransactions(user.id);
  const budgets = db.getBudgets(user.id);
  const goals = db.getGoals(user.id);

  try {
    const analysis = await analyzeStudentFinances(user, transactions, budgets, goals);
    return res.json({ data: analysis });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate financial advice: ' + err.message });
  }
};

apiRouter.get('/ai/coach', requireAuth, handleCoachInsights);
apiRouter.get('/coach', requireAuth, handleCoachInsights);

apiRouter.post('/ai/voice-parse', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { transcript } = req.body;
  if (!transcript || typeof transcript !== 'string') {
    return res.status(400).json({ error: 'Voice transcript string is required.' });
  }

  const parsed = await parseVoiceExpense(transcript, req.user!.currency || 'PKR');
  return res.json({ data: parsed });
});

apiRouter.post('/ai/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required.' });
  }

  try {
    const user = req.user!;
    const transactions = db.getTransactions(user.id);
    const budgets = db.getBudgets(user.id);
    const goals = db.getGoals(user.id);

    const reply = await chatFinancialAdvisor(
      user,
      message,
      Array.isArray(history) ? history : [],
      transactions,
      budgets,
      goals
    );

    return res.json({ reply });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process AI chat: ' + err.message });
  }
});

// ==========================================
// 10. SUBSCRIPTIONS & MONETIZATION
// ==========================================

const PLANS_CONFIG = [
  {
    id: 'free',
    name: 'Free Starter',
    tagline: 'Essential personal & business tracking',
    price_pkr: 0,
    billing_period: 'forever',
    features: [
      'Basic income and expense tracking',
      '1 Monthly overall budget limit',
      'Recent transactions list',
      'Basic dashboard overview',
      'Manual expense entry',
    ],
    limitations: [
      'No AI Financial Advisor insights',
      'Single savings goal only',
      'No receipt OCR scanner',
      'No PDF / CSV financial statements',
    ],
  },
  {
    id: 'premium',
    name: 'PaisaTrack Premium',
    tagline: 'Most Popular for Individuals & Freelancers',
    price_pkr: 525,
    billing_period: 'monthly',
    popular: true,
    features: [
      'Everything in Free',
      'AI Financial Advisor (Gemini 2.5 Flash insights & forecast)',
      'Multiple category budgets & threshold warnings',
      'Up to 5 active savings goals with pace calculator',
      'CamScanner receipt scanner with auto OCR',
      'Family Sharing Hub (up to 4 family members)',
      'Target & Goals Planner tool',
      'CSV & PDF statement export',
      'Voice-based quick transaction entry',
    ],
  },
  {
    id: 'pro',
    name: 'PaisaTrack Pro VIP',
    tagline: 'Unlimited Power for Businesses & Power Users',
    price_pkr: 775,
    billing_period: 'monthly',
    features: [
      'Everything in Premium',
      'Unlimited Family Sharing members, shared vaults & split budgets',
      'Unlimited AI Financial Advisor queries & real-time chat',
      'Unlimited savings goals & custom milestone trackers',
      'Unlimited CamScanner multi-page PDF generation',
      'Mobile SMS auto-sync & bank alert logger',
      'Advanced scenario stress testing for cashflow planner',
      'VIP Priority verified account badge',
    ],
  },
];

apiRouter.get('/subscriptions/plans', (_req, res) => {
  return res.json({ plans: PLANS_CONFIG });
});

apiRouter.get('/subscriptions/current', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const history = db.getSubscriptions(user.id);
  const currentPlan = PLANS_CONFIG.find((p) => p.id === user.plan) || PLANS_CONFIG[0];

  return res.json({
    currentPlan,
    planId: user.plan,
    expiresAt: user.plan_expires_at,
    history,
  });
});

// Payment Adapter Simulation (JazzCash, EasyPaisa, Debit Card)
apiRouter.post('/subscriptions/upgrade', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { plan_id, payment_method, mobile_or_card_no } = req.body;

  const targetPlan = PLANS_CONFIG.find((p) => p.id === plan_id);
  if (!targetPlan || targetPlan.id === 'free') {
    return res.status(400).json({ error: 'Please select a valid paid plan (Premium or Pro).' });
  }

  if (!payment_method) {
    return res.status(400).json({ error: 'Payment method is required (EasyPaisa, JazzCash, Card).' });
  }

  // Create simulated transaction reference
  const refCode = `${payment_method.toUpperCase().slice(0, 2)}-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 1);

  const subRecord: SubscriptionRecord = {
    id: `sub_${Date.now()}`,
    user_id: req.user!.id,
    plan: targetPlan.id as 'premium' | 'pro',
    amount_pkr: targetPlan.price_pkr,
    billing_cycle: 'monthly',
    status: 'active',
    payment_method: `${payment_method} (${mobile_or_card_no || 'Verified'})`,
    reference_no: refCode,
    created_at: new Date().toISOString(),
    expires_at: expires.toISOString(),
  };

  db.recordSubscription(subRecord);

  return res.json({
    success: true,
    subscription: subRecord,
    message: `Payment of Rs ${targetPlan.price_pkr} confirmed via ${payment_method}! Your account is now upgraded to ${targetPlan.name}.`,
  });
});

// ==========================================
// 11. SECURE ADMIN ROUTE
// ==========================================

apiRouter.get('/admin/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getSystemStats();
  const allUsers = db.getAllUsers().map((u) => {
    const { password_hash: _, ...safe } = u;
    return safe;
  });

  return res.json({
    stats,
    users: allUsers,
    system: {
      node_version: process.version,
      platform: process.platform,
      database: 'Relational Store / MySQL XAMPP Ready',
      status: 'Healthy & Operational',
    },
  });
});

// ==========================================
// 12. MOBILE SMS EXPENSE & BUDGET INBOUND SYNC
// ==========================================

function resolveUserForSms(req: any): User | undefined {
  if (req.user) return req.user;

  // Check header or query or body token
  const token =
    req.query?.token ||
    req.body?.token ||
    req.body?.secret ||
    req.headers?.['x-sms-secret'] ||
    req.headers?.['x-api-key'];

  if (token && typeof token === 'string') {
    const user = db.findUserBySmsToken(token.trim());
    if (user) return user;
  }

  // Check sender phone number
  const sender =
    req.body?.sender ||
    req.body?.from ||
    req.body?.phone ||
    req.body?.sender_number ||
    req.query?.from ||
    req.query?.sender;

  if (sender && typeof sender === 'string') {
    const user = db.findUserByPhone(sender);
    if (user) return user;
  }

  // Fallback to active demo student
  return db.findUserById('usr_demo_101');
}

async function handleInboundSms(req: any, res: Response) {
  const targetUser = resolveUserForSms(req);
  if (!targetUser) {
    return res.status(401).json({
      error: 'Unauthorized SMS. Please provide a valid webhook token (?token=...) or register your phone number.',
    });
  }

  const rawMessage =
    req.body?.message ||
    req.body?.body ||
    req.body?.text ||
    req.body?.content ||
    req.body?.sms ||
    req.query?.message ||
    req.query?.text;

  if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
    return res.status(400).json({
      error: 'Message content is required. Send { message: "Paid Rs 450 biryani" } or ?message=...',
    });
  }

  const senderNumber =
    req.body?.sender ||
    req.body?.from ||
    req.body?.phone ||
    req.body?.sender_number ||
    req.query?.from ||
    req.query?.sender ||
    targetUser.phone_number ||
    'Mobile SMS';

  try {
    const parsed = await parseSmsExpense(rawMessage, targetUser.currency || 'PKR', targetUser);
    let createdTx: Transaction | undefined;
    let createdBudget: Budget | undefined;
    let updatedGoal: SavingsGoal | undefined;
    let actionMessage = '';

    if (parsed.action === 'expense' || parsed.action === 'income') {
      createdTx = {
        id: `tx_sms_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        user_id: targetUser.id,
        type: parsed.action,
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: new Date().toISOString().split('T')[0],
        payment_method: parsed.payment_method,
        merchant: parsed.merchant,
        tags: ['Mobile SMS', parsed.payment_method],
        created_at: new Date().toISOString(),
      };
      db.createTransaction(createdTx);
      actionMessage = `ایس ایم ایس کامیابی سے محفوظ ہو گیا: ${targetUser.currency} ${parsed.amount} برائے "${parsed.description}" (${parsed.category})`;
    } else if (parsed.action === 'budget') {
      const category = parsed.budgetTargetCategory || parsed.category || 'Overall';
      const existing = db.getBudgets(targetUser.id).find((b) => b.category.toLowerCase() === category.toLowerCase());
      if (existing) {
        existing.amount = parsed.amount;
        db.updateBudget(existing.id, targetUser.id, { amount: parsed.amount });
        createdBudget = existing;
      } else {
        createdBudget = {
          id: `bg_sms_${Date.now()}`,
          user_id: targetUser.id,
          category,
          period: 'monthly',
          amount: parsed.amount,
          threshold_percent: 80,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        db.createBudget(createdBudget);
      }
      actionMessage = `بجٹ کامیابی سے سیو ہو گیا: ${category} کیلئے ${targetUser.currency} ${parsed.amount}`;
    } else if (parsed.action === 'goal') {
      const goals = db.getGoals(targetUser.id);
      const matchGoal =
        goals.find((g) => parsed.goalTargetTitle && g.title.toLowerCase().includes(parsed.goalTargetTitle.toLowerCase())) ||
        goals.find((g) => g.status === 'active') ||
        goals[0];

      if (matchGoal) {
        const updated = db.depositToGoal(matchGoal.id, targetUser.id, parsed.amount);
        updatedGoal = updated?.goal;
        actionMessage = `سیونگ گول میں ${targetUser.currency} ${parsed.amount} جمع ہو گئے: "${matchGoal.title}"`;
      } else {
        const newGoal: SavingsGoal = {
          id: `gl_sms_${Date.now()}`,
          user_id: targetUser.id,
          title: parsed.goalTargetTitle || 'Student Savings Goal',
          target_amount: parsed.amount * 5,
          current_amount: parsed.amount,
          target_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          priority: 'medium',
          status: 'active',
          created_at: new Date().toISOString(),
        };
        db.createGoal(newGoal);
        updatedGoal = newGoal;
        actionMessage = `نیا سیونگ گول بنایا گیا اور ${targetUser.currency} ${parsed.amount} جمع ہو گئے`;
      }
    }

    const log: SmsLog = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      user_id: targetUser.id,
      sender_number: String(senderNumber),
      raw_text: rawMessage,
      parsed_type: parsed.action,
      parsed_amount: parsed.amount,
      parsed_category: parsed.category,
      parsed_description: parsed.description,
      payment_method: parsed.payment_method,
      status: 'processed',
      transaction_id: createdTx?.id,
      budget_id: createdBudget?.id,
      goal_id: updatedGoal?.id,
      ai_parsed: parsed.isAiParsed,
      notes: parsed.notes,
      created_at: new Date().toISOString(),
    };
    db.saveSmsLog(log);

    return res.json({
      success: true,
      message: actionMessage,
      parsed,
      log,
      transaction: createdTx,
      budget: createdBudget,
      goal: updatedGoal,
    });
  } catch (err: any) {
    console.error('Error processing SMS webhook:', err);
    return res.status(500).json({ error: 'Failed to process mobile SMS: ' + err.message });
  }
}

// Inbound webhook routes
apiRouter.post('/sms/inbound', handleInboundSms);
apiRouter.get('/sms/inbound', handleInboundSms);
apiRouter.post('/sms/webhook', handleInboundSms);

// Simulate / manual SMS paste (Authenticated user)
apiRouter.post('/sms/simulate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { message, sender } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required.' });
  }
  req.body.message = message;
  req.body.sender = sender || req.user!.phone_number;
  return handleInboundSms(req, res);
});

// Get user SMS logs
apiRouter.get('/sms/logs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getSmsLogs(req.user!.id);
  return res.json({ data: logs });
});

// Delete an SMS log
apiRouter.delete('/sms/logs/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteSmsLog(id, req.user!.id);
  if (!deleted) return res.status(404).json({ error: 'SMS log entry not found.' });
  return res.json({ message: 'SMS log deleted.' });
});

// Get SMS webhook config and phone number
apiRouter.get('/sms/config', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    phone_number: user.phone_number || '',
    sms_webhook_token: user.sms_webhook_token || 'student_sms_sec_9941',
  });
});

// Update SMS webhook config
apiRouter.put('/sms/config', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { phone_number, regenerate_token } = req.body;
  const newToken = regenerate_token
    ? `sms_sec_${Math.random().toString(36).substr(2, 8)}`
    : undefined;

  const updated = db.updateUserSmsConfig(req.user!.id, phone_number, newToken);
  return res.json({
    user: updated,
    phone_number: updated?.phone_number,
    sms_webhook_token: updated?.sms_webhook_token,
    message: 'SMS Configuration updated successfully.',
  });
});

// ==========================================
// 13. FAMILY SHARING & HOUSEHOLD HUB ROUTES
// ==========================================

function buildFamilyHubPayload(family: FamilyGroup) {
  const members = db.getFamilyMembers(family.id);
  const transactions = db.getFamilyTransactions(family.id);
  const goals = db.getFamilyGoals(family.id);

  const now = new Date();
  const curYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTx = transactions.filter((t) => t.date.startsWith(curYm));

  const totalPoolIncome = monthTx
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSharedExpense = monthTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const enrichedMembers = members.map((m) => {
    const spent = monthTx
      .filter((t) => t.member_id === m.id && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const contributed = monthTx
      .filter((t) => t.member_id === m.id && t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      ...m,
      spent_this_month: spent,
      contributed_this_month: contributed,
    };
  });

  const netFamilySavings = totalPoolIncome - totalSharedExpense;
  const remainingBudget = Math.max(0, family.shared_monthly_budget - totalSharedExpense);
  const budgetUtilization =
    family.shared_monthly_budget > 0
      ? Math.round((totalSharedExpense / family.shared_monthly_budget) * 100)
      : 0;

  return {
    family,
    members: enrichedMembers,
    transactions,
    goals,
    summary: {
      totalPoolIncome,
      totalSharedExpense,
      netFamilySavings,
      remainingBudget,
      budgetUtilization,
    },
  };
}

apiRouter.get('/family', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const family = db.getUserFamily(req.user!.id);
  if (!family) {
    return res.json({
      family: null,
      members: [],
      transactions: [],
      goals: [],
      summary: {
        totalPoolIncome: 0,
        totalSharedExpense: 0,
        netFamilySavings: 0,
        remainingBudget: 0,
        budgetUtilization: 0,
      },
    });
  }
  return res.json(buildFamilyHubPayload(family));
});

apiRouter.post('/family', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, shared_monthly_budget } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Family hub name is required.' });
  }

  const user = req.user!;
  const famId = `fam_${Date.now()}`;
  const inviteCode = `FAM-${Math.floor(1000 + Math.random() * 9000)}-PK`;

  const group: FamilyGroup = {
    id: famId,
    name: String(name).trim(),
    owner_id: user.id,
    invite_code: inviteCode,
    shared_monthly_budget: Number(shared_monthly_budget) > 0 ? Number(shared_monthly_budget) : 100000,
    currency: user.currency || 'PKR',
    created_at: new Date().toISOString(),
  };

  const ownerMember: FamilyMember = {
    id: `fmem_${Date.now()}`,
    family_id: famId,
    user_id: user.id,
    name: user.name,
    email: user.email,
    relation: 'Owner',
    role: 'admin',
    spending_limit: group.shared_monthly_budget,
    status: 'active',
    avatar_color: 'bg-indigo-600',
    joined_at: new Date().toISOString(),
  };

  db.createFamilyGroup(group, ownerMember);
  return res.status(201).json({
    ...buildFamilyHubPayload(group),
    message: 'Family Sharing Hub created successfully!',
  });
});

apiRouter.post('/family/join', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { invite_code } = req.body;
  if (!invite_code || !String(invite_code).trim()) {
    return res.status(400).json({ error: 'Please enter a valid family invite code.' });
  }

  const group = db.getFamilyByInviteCode(String(invite_code));
  if (!group) {
    return res.status(404).json({ error: 'No Family Hub found with that invite code.' });
  }

  const members = db.getFamilyMembers(group.id);
  const existing = members.find(
    (m) => m.user_id === req.user!.id || (m.email && m.email.toLowerCase() === req.user!.email.toLowerCase())
  );

  if (existing) {
    if (!existing.user_id || existing.status !== 'active') {
      db.updateFamilyMember(group.id, existing.id, { user_id: req.user!.id, status: 'active' });
    }
  } else {
    const colors = ['bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-sky-600'];
    const newMember: FamilyMember = {
      id: `fmem_${Date.now()}`,
      family_id: group.id,
      user_id: req.user!.id,
      name: req.user!.name,
      email: req.user!.email,
      relation: 'Other',
      role: 'contributor',
      spending_limit: Math.round(group.shared_monthly_budget * 0.25),
      status: 'active',
      avatar_color: colors[members.length % colors.length],
      joined_at: new Date().toISOString(),
    };
    db.addFamilyMember(newMember);
  }

  return res.json({
    ...buildFamilyHubPayload(group),
    message: `Joined ${group.name} successfully!`,
  });
});

apiRouter.put('/family', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const family = db.getUserFamily(req.user!.id);
  if (!family) return res.status(404).json({ error: 'Family hub not found.' });

  const { name, shared_monthly_budget, regenerate_code } = req.body;
  const updates: Partial<FamilyGroup> = {};
  if (name && String(name).trim()) updates.name = String(name).trim();
  if (shared_monthly_budget !== undefined && Number(shared_monthly_budget) > 0) {
    updates.shared_monthly_budget = Number(shared_monthly_budget);
  }
  if (regenerate_code) {
    updates.invite_code = `FAM-${Math.floor(1000 + Math.random() * 9000)}-PK`;
  }

  const updated = db.updateFamilyGroup(family.id, updates);
  return res.json({
    ...buildFamilyHubPayload(updated!),
    message: 'Family settings updated.',
  });
});

apiRouter.post('/family/members', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const family = db.getUserFamily(req.user!.id);
  if (!family) return res.status(404).json({ error: 'Create or join a Family Hub first.' });

  const { name, email, relation, role, spending_limit } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Member name is required.' });
  }

  const matchedUser = email ? db.findUserByEmail(String(email)) : undefined;
  const existingMembers = db.getFamilyMembers(family.id);
  const colors = ['bg-emerald-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600', 'bg-sky-600', 'bg-teal-600'];

  const member: FamilyMember = {
    id: `fmem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    family_id: family.id,
    user_id: matchedUser?.id,
    name: String(name).trim(),
    email: email ? String(email).trim().toLowerCase() : undefined,
    relation: relation || 'Other',
    role: role || 'contributor',
    spending_limit: Number(spending_limit) > 0 ? Number(spending_limit) : 20000,
    status: matchedUser ? 'active' : 'invited',
    avatar_color: colors[existingMembers.length % colors.length],
    joined_at: new Date().toISOString(),
  };

  db.addFamilyMember(member);
  return res.status(201).json({
    ...buildFamilyHubPayload(family),
    message: `${member.name} added to ${family.name}!`,
  });
});

apiRouter.put('/family/members/:memberId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const family = db.getUserFamily(req.user!.id);
  if (!family) return res.status(404).json({ error: 'Family hub not found.' });

  const { memberId } = req.params;
  const { role, spending_limit, relation, status } = req.body;
  const updates: Partial<FamilyMember> = {};
  if (role) updates.role = role;
  if (spending_limit !== undefined) updates.spending_limit = Math.max(0, Number(spending_limit));
  if (relation) updates.relation = relation;
  if (status) updates.status = status;

  const updated = db.updateFamilyMember(family.id, memberId, updates);
  if (!updated) return res.status(404).json({ error: 'Family member not found.' });

  return res.json({
    ...buildFamilyHubPayload(family),
    message: 'Member permissions updated.',
  });
});

apiRouter.delete('/family/members/:memberId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const family = db.getUserFamily(req.user!.id);
  if (!family) return res.status(404).json({ error: 'Family hub not found.' });

  const deleted = db.removeFamilyMember(family.id, req.params.memberId);
  if (!deleted) {
    return res.status(400).json({ error: 'Cannot remove owner or member not found.' });
  }

  return res.json({
    ...buildFamilyHubPayload(family),
    message: 'Family member removed.',
  });
});

apiRouter.post('/family/transactions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const family = db.getUserFamily(req.user!.id);
  if (!family) return res.status(404).json({ error: 'Family hub not found.' });

  const { member_id, type, amount, category, description, date, payment_method, split_equally, sync_to_personal } =
    req.body;

  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero.' });
  }

  const members = db.getFamilyMembers(family.id);
  const member =
    members.find((m) => m.id === member_id) ||
    members.find((m) => m.user_id === req.user!.id) ||
    members[0];

  const txDate = date ? String(date).trim() : new Date().toISOString().split('T')[0];

  const tx: FamilyTransaction = {
    id: `ftx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    family_id: family.id,
    member_id: member ? member.id : req.user!.id,
    member_name: member ? member.name : req.user!.name,
    type: type === 'income' ? 'income' : 'expense',
    amount: parsedAmount,
    category: category ? String(category).trim() : type === 'income' ? 'Household Pool' : 'Groceries & Mart',
    description: description ? String(description).trim() : 'Shared family transaction',
    date: txDate,
    payment_method: payment_method || 'Cash',
    split_equally: Boolean(split_equally),
    created_at: new Date().toISOString(),
  };

  db.addFamilyTransaction(tx);

  // Optional sync to personal ledger
  if (sync_to_personal) {
    db.createTransaction({
      id: `tx_fam_${Date.now()}`,
      user_id: req.user!.id,
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: `[Family: ${family.name}] ${tx.description}`,
      date: tx.date,
      payment_method: (tx.payment_method as any) || 'Cash',
      merchant: family.name,
      tags: ['Family Sharing'],
      created_at: new Date().toISOString(),
    });
  }

  return res.status(201).json({
    ...buildFamilyHubPayload(family),
    message: 'Shared family transaction recorded!',
  });
});

apiRouter.delete('/family/transactions/:txId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const family = db.getUserFamily(req.user!.id);
  if (!family) return res.status(404).json({ error: 'Family hub not found.' });

  const deleted = db.deleteFamilyTransaction(family.id, req.params.txId);
  if (!deleted) return res.status(404).json({ error: 'Transaction not found.' });

  return res.json({
    ...buildFamilyHubPayload(family),
    message: 'Family transaction deleted.',
  });
});

apiRouter.post('/family/goals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const family = db.getUserFamily(req.user!.id);
  if (!family) return res.status(404).json({ error: 'Family hub not found.' });

  const { title, target_amount, current_amount, target_date } = req.body;
  const parsedTarget = Number(target_amount);
  if (!title || isNaN(parsedTarget) || parsedTarget <= 0) {
    return res.status(400).json({ error: 'Goal title and positive target amount are required.' });
  }

  const members = db.getFamilyMembers(family.id);
  const selfMember = members.find((m) => m.user_id === req.user!.id) || members[0];
  const initialAmt = Math.max(0, Number(current_amount) || 0);

  const goal: FamilySharedGoal = {
    id: `fgl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    family_id: family.id,
    title: String(title).trim(),
    target_amount: parsedTarget,
    current_amount: initialAmt,
    target_date: target_date || `${new Date().getFullYear() + 1}-01-01`,
    contributors:
      initialAmt > 0 && selfMember
        ? [{ member_id: selfMember.id, member_name: selfMember.name, amount: initialAmt }]
        : [],
    created_at: new Date().toISOString(),
  };

  db.createFamilyGoal(goal);
  return res.status(201).json({
    ...buildFamilyHubPayload(family),
    message: 'Shared family goal created!',
  });
});

apiRouter.post('/family/goals/:goalId/contribute', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const family = db.getUserFamily(req.user!.id);
  if (!family) return res.status(404).json({ error: 'Family hub not found.' });

  const { amount, member_id } = req.body;
  const parsedAmount = Number(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'Contribution amount must be positive.' });
  }

  const members = db.getFamilyMembers(family.id);
  const member =
    members.find((m) => m.id === member_id) ||
    members.find((m) => m.user_id === req.user!.id) ||
    members[0];

  const updated = db.contributeFamilyGoal(
    family.id,
    req.params.goalId,
    member ? member.id : req.user!.id,
    member ? member.name : req.user!.name,
    parsedAmount
  );

  if (!updated) return res.status(404).json({ error: 'Shared goal not found.' });

  return res.json({
    ...buildFamilyHubPayload(family),
    message: `Added ${family.currency} ${parsedAmount.toLocaleString()} to "${updated.title}"!`,
  });
});

apiRouter.delete('/family/goals/:goalId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const family = db.getUserFamily(req.user!.id);
  if (!family) return res.status(404).json({ error: 'Family hub not found.' });

  const deleted = db.deleteFamilyGoal(family.id, req.params.goalId);
  if (!deleted) return res.status(404).json({ error: 'Shared goal not found.' });

  return res.json({
    ...buildFamilyHubPayload(family),
    message: 'Shared family goal removed.',
  });
});
