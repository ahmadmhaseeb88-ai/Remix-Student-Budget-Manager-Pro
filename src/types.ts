export interface User {
  id: string;
  name: string;
  email: string;
  student_id?: string;
  university: string;
  semester: string;
  currency: string;
  monthly_budget: number;
  financial_goals?: string;
  role: 'student' | 'admin';
  plan: 'free' | 'premium' | 'pro';
  plan_expires_at?: string;
  phone_number?: string;
  sms_webhook_token?: string;
  last_active_at?: string;
  created_at: string;
}

export interface UsageStats {
  totalUsers: number;
  activeNow: number;
  activeToday: number;
  newToday: number;
  totalTransactions: number;
  totalFamilyHubs: number;
}

export interface SmsLog {
  id: string;
  user_id: string;
  sender_number?: string;
  raw_text: string;
  parsed_type: 'expense' | 'income' | 'budget' | 'goal' | 'unknown';
  parsed_amount: number;
  parsed_category: string;
  parsed_description: string;
  payment_method: string;
  status: 'processed' | 'needs_review' | 'error';
  transaction_id?: string;
  budget_id?: string;
  goal_id?: string;
  ai_parsed?: boolean;
  notes?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: 'Cash' | 'EasyPaisa' | 'JazzCash' | 'Bank Transfer' | 'Debit Card' | 'Other';
  merchant?: string;
  tags?: string[];
  receipt_id?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  period: 'monthly' | 'weekly' | 'semester' | 'custom';
  amount: number;
  threshold_percent: number;
  is_active: boolean;
  spent?: number;
  remaining?: number;
  percentage?: number;
  isExceeded?: boolean;
  isWarning?: boolean;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  status: 'active' | 'completed' | 'paused';
  percentage?: number;
  remaining?: number;
  daysRemaining?: number;
  suggestedWeeklySavings?: number;
  suggestedMonthlySavings?: number;
  isOverdue?: boolean;
  created_at: string;
}

export interface BillReminder {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  due_date: string;
  recurring_frequency: 'none' | 'monthly' | 'semester' | 'annual';
  is_paid: boolean;
  last_paid_at?: string;
  reminder_days_before: number;
  created_at: string;
}

export interface SemesterPlan {
  id: string;
  user_id: string;
  semester_name: string;
  start_date: string;
  end_date: string;
  expected_monthly_allowance: number;
  scholarship_salary: number;
  tuition_exam_fee: number;
  hostel_rent: number;
  food_transport_est: number;
  books_materials: number;
  other_expenses: number;
  notes?: string;
  durationDays?: number;
  totalWeeks?: number;
  totalMonths?: number;
  totalIncome?: number;
  totalExpenses?: number;
  surplusOrDeficit?: number;
  weeklySpendingAllowance?: number;
  potentialSavings?: number;
  burnRatePerDay?: number;
  created_at: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  file_name: string;
  file_data_base64: string;
  mime_type: string;
  file_size: number;
  merchant?: string;
  total_amount?: number;
  date?: string;
  category?: string;
  line_items?: Array<{ name: string; amount: number }>;
  status: 'processed' | 'pending';
  created_at: string;
}

export interface CoachInsight {
  summary: string;
  spendingPatterns: string[];
  frugalityTips: string[];
  savingsStrategies: string[];
  forecast: {
    estimatedMonthEndExpense: number;
    projectedSurplusOrDeficit: number;
    riskLevel: 'safe' | 'caution' | 'danger';
    advice: string;
  };
  categoryObservations: Array<{
    category: string;
    observation: string;
    recommendedAction: string;
  }>;
  isAiGenerated: boolean;
}

export interface DashboardSummary {
  currency: string;
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthlyBudget: number;
  remainingBudget: number;
  budgetUtilization: number;
  budgetThreshold: number;
  totalSavedSoFar: number;
  totalSavingsTarget: number;
  savingsProgressPercent: number;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  dailySpending: Array<{ day: number; expense: number; income: number }>;
  recentTransactions: Transaction[];
  upcomingBills: BillReminder[];
  activeGoalsCount: number;
  plan: 'free' | 'premium' | 'pro';
}

export interface SubscriptionPlan {
  id: 'free' | 'premium' | 'pro';
  name: string;
  tagline: string;
  price_pkr: number;
  billing_period: string;
  popular?: boolean;
  features: string[];
  limitations?: string[];
}

export type FamilyRelation = 'Owner' | 'Spouse' | 'Parent' | 'Child' | 'Sibling' | 'Other';
export type FamilyRole = 'admin' | 'contributor' | 'viewer';

export interface FamilyGroup {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  shared_monthly_budget: number;
  currency: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id?: string;
  name: string;
  email?: string;
  relation: FamilyRelation;
  role: FamilyRole;
  spending_limit: number;
  status: 'active' | 'invited';
  avatar_color: string;
  joined_at: string;
  spent_this_month?: number;
  contributed_this_month?: number;
}

export interface FamilyTransaction {
  id: string;
  family_id: string;
  member_id: string;
  member_name: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  payment_method: string;
  split_equally?: boolean;
  created_at: string;
}

export interface FamilySharedGoal {
  id: string;
  family_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  contributors: Array<{ member_id: string; member_name: string; amount: number }>;
  created_at: string;
}

export interface FamilyHubResponse {
  family: FamilyGroup | null;
  members: FamilyMember[];
  transactions: FamilyTransaction[];
  goals: FamilySharedGoal[];
  summary: {
    totalPoolIncome: number;
    totalSharedExpense: number;
    netFamilySavings: number;
    remainingBudget: number;
    budgetUtilization: number;
  };
}
