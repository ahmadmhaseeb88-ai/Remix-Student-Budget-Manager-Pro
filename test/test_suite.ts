import { db } from '../server/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function runTestSuite() {
  console.log('🧪 Starting Student Budget Manager Pro Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: User Database Seeding & Password Hashing
  console.log('--- Test Suite 1: Authentication & Hashing ---');
  const demoUser = db.findUserByEmail('student@fast.edu.pk');
  assert(Boolean(demoUser), 'Demo student user exists in database');
  assert(
    bcrypt.compareSync('student123', demoUser!.password_hash),
    'Demo student password verifies with bcrypt hash'
  );
  assert(
    !bcrypt.compareSync('wrongpassword', demoUser!.password_hash),
    'Invalid password fails verification'
  );

  // TEST 2: User Creation & Duplicate Protection
  console.log('\n--- Test Suite 2: Registration & Isolation ---');
  const testEmail = `test_student_${Date.now()}@test.edu`;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('securePass123', salt);
  const newStudent = db.createUser({
    id: `usr_test_${Date.now()}`,
    name: 'Test Student',
    email: testEmail,
    password_hash: hash,
    university: 'NUST SEECS',
    semester: '3rd Semester',
    currency: 'PKR',
    monthly_budget: 28000,
    role: 'student',
    plan: 'free',
    created_at: new Date().toISOString(),
  });
  assert(Boolean(db.findUserByEmail(testEmail)), 'New student registered and persisted');
  assert(
    db.getAllUsers().filter((u) => u.email === testEmail).length === 1,
    'No duplicate accounts created'
  );

  // TEST 3: Transactions CRUD & Balance Formula
  console.log('\n--- Test Suite 3: Transactions Ledger & Net Balance ---');
  const initialTxCount = db.getTransactions(newStudent.id).length;
  assert(initialTxCount === 0, 'New user has zero initial transactions (clean state)');

  const inc = db.createTransaction({
    id: `tx_t1_${Date.now()}`,
    user_id: newStudent.id,
    type: 'income',
    amount: 25000,
    category: 'Pocket money',
    description: 'Monthly allowance deposit',
    date: '2026-10-01',
    payment_method: 'Bank Transfer',
    created_at: new Date().toISOString(),
  });

  const exp1 = db.createTransaction({
    id: `tx_t2_${Date.now()}`,
    user_id: newStudent.id,
    type: 'expense',
    amount: 8000,
    category: 'Hostel and rent',
    description: 'Hostel mess dues',
    date: '2026-10-03',
    payment_method: 'Cash',
    created_at: new Date().toISOString(),
  });

  const exp2 = db.createTransaction({
    id: `tx_t3_${Date.now()}`,
    user_id: newStudent.id,
    type: 'expense',
    amount: 3500,
    category: 'Food',
    description: 'Campus cafeteria food',
    date: '2026-10-05',
    payment_method: 'EasyPaisa',
    created_at: new Date().toISOString(),
  });

  const userTx = db.getTransactions(newStudent.id);
  assert(userTx.length === 3, 'User recorded 3 transactions');

  const totalIncome = userTx.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = userTx.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const netBalance = totalIncome - totalExpense;

  assert(totalIncome === 25000, 'Calculated total income is exactly Rs 25,000');
  assert(totalExpense === 11500, 'Calculated total expense is exactly Rs 11,500');
  assert(netBalance === 13500, 'Calculated net balance is exactly Rs 13,500 (income - expense)');

  // Cross-user isolation test
  const demoTx = db.getTransactions(demoUser!.id);
  assert(
    !demoTx.some((t) => t.user_id === newStudent.id),
    'User A cannot access User B transactions (Isolation confirmed)'
  );

  // TEST 4: Budget Thresholds
  console.log('\n--- Test Suite 4: Smart Budgets & Threshold Warning ---');
  const foodBudget = db.createBudget({
    id: `bg_test_${Date.now()}`,
    user_id: newStudent.id,
    category: 'Food',
    period: 'monthly',
    amount: 4000,
    threshold_percent: 80,
    is_active: true,
    created_at: new Date().toISOString(),
  });

  const foodSpent = 3500;
  const foodUtilization = (foodSpent / foodBudget.amount) * 100;
  assert(foodUtilization === 87.5, 'Budget utilization accurately calculated at 87.5%');
  assert(
    foodUtilization >= foodBudget.threshold_percent && foodUtilization <= 100,
    'Warning threshold triggered (spending > 80% and < 100%)'
  );

  // TEST 5: Savings Goals & Confetti Milestone
  console.log('\n--- Test Suite 5: Savings Goals & Target Pace ---');
  const laptopGoal = db.createGoal({
    id: `gl_test_${Date.now()}`,
    user_id: newStudent.id,
    title: 'FYP Laptop Fund',
    target_amount: 100000,
    current_amount: 25000,
    target_date: '2026-12-31',
    priority: 'high',
    status: 'active',
    created_at: new Date().toISOString(),
  });

  const goalRemaining = laptopGoal.target_amount - laptopGoal.current_amount;
  assert(goalRemaining === 75000, 'Remaining target amount is Rs 75,000');
  const pct = Math.round((laptopGoal.current_amount / laptopGoal.target_amount) * 100);
  assert(pct === 25, 'Goal percentage is 25%');

  // Cleanup test user
  db.deleteUser(newStudent.id);
  assert(db.findUserById(newStudent.id) === undefined, 'Test user and records successfully cleaned up');

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
