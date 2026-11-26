import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
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

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  payment_method: 'Cash' | 'EasyPaisa' | 'JazzCash' | 'Bank Transfer' | 'Debit Card' | 'Other';
  merchant?: string;
  tags?: string[];
  receipt_id?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string; // "Overall" or specific category
  period: 'monthly' | 'weekly' | 'semester' | 'custom';
  amount: number;
  threshold_percent: number; // e.g., 80
  is_active: boolean;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

export interface BillReminder {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  due_date: string; // YYYY-MM-DD
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

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan: 'free' | 'premium' | 'pro';
  amount_pkr: number;
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'expired' | 'cancelled';
  payment_method: string;
  reference_no: string;
  created_at: string;
  expires_at: string;
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
  relation: 'Owner' | 'Spouse' | 'Parent' | 'Child' | 'Sibling' | 'Other';
  role: 'admin' | 'contributor' | 'viewer';
  spending_limit: number;
  status: 'active' | 'invited';
  avatar_color: string;
  joined_at: string;
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

export interface DatabaseSchema {
  users: User[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  bills: BillReminder[];
  semester_plans: SemesterPlan[];
  receipts: Receipt[];
  subscriptions: SubscriptionRecord[];
  sms_logs: SmsLog[];
  family_groups: FamilyGroup[];
  family_members: FamilyMember[];
  family_transactions: FamilyTransaction[];
  family_goals: FamilySharedGoal[];
}

const __dbFilename = fileURLToPath(import.meta.url);
const __dbDirname = path.dirname(__dbFilename);
const CWD_DATA_DIR = path.resolve(process.cwd(), 'data');
const REL_DATA_DIR = path.resolve(__dbDirname, '..', 'data');
const BUNDLED_DATA_DIR = fs.existsSync(path.join(CWD_DATA_DIR, 'budget_pro_db.json'))
  ? CWD_DATA_DIR
  : REL_DATA_DIR;
const BUNDLED_DB_FILE = path.join(BUNDLED_DATA_DIR, 'budget_pro_db.json');

function resolveWritableDataDir(): string {
  if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) {
    return path.join(os.tmpdir(), 'paisatrack_data');
  }
  try {
    if (!fs.existsSync(BUNDLED_DATA_DIR)) {
      fs.mkdirSync(BUNDLED_DATA_DIR, { recursive: true });
    }
    fs.accessSync(BUNDLED_DATA_DIR, fs.constants.W_OK);
    return BUNDLED_DATA_DIR;
  } catch {
    return path.join(os.tmpdir(), 'paisatrack_data');
  }
}

const DATA_DIR = resolveWritableDataDir();
const DB_FILE = path.join(DATA_DIR, 'budget_pro_db.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    transactions: [],
    budgets: [],
    goals: [],
    bills: [],
    semester_plans: [],
    receipts: [],
    subscriptions: [],
    sms_logs: [],
    family_groups: [],
    family_members: [],
    family_transactions: [],
    family_goals: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (DATA_DIR !== BUNDLED_DATA_DIR && !fs.existsSync(DB_FILE) && fs.existsSync(BUNDLED_DB_FILE)) {
        fs.copyFileSync(BUNDLED_DB_FILE, DB_FILE);
      }
    } catch (err) {
      console.warn('Database directory setup warning:', err);
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.sms_logs) {
          this.data.sms_logs = [];
        }
        if (!this.data.family_groups) {
          this.data.family_groups = [];
        }
        if (!this.data.family_members) {
          this.data.family_members = [];
        }
        if (!this.data.family_transactions) {
          this.data.family_transactions = [];
        }
        if (!this.data.family_goals) {
          this.data.family_goals = [];
        }
        // Ensure demo user has sms fields if missing
        const demo = this.data.users?.find((u) => u.id === 'usr_demo_101');
        if (demo) {
          if (!demo.phone_number) demo.phone_number = '+923001234567';
          if (!demo.sms_webhook_token) demo.sms_webhook_token = 'student_sms_sec_9941';
        }

        // Ensure user Haseeb Ahmad exists with email ahmadmhaseeb88@gmail.com, password 11223344, and university Mir Chakar Khan Rind University
        const salt = bcrypt.genSaltSync(10);
        const haseebHash = bcrypt.hashSync('11223344', salt);
        let haseeb = this.data.users?.find(
          (u) =>
            u.email === 'ahmadmhaseeb88@gmail.com' ||
            u.email === 'haseeb@gmail.com' ||
            u.id === 'usr_haseeb_001'
        );
        if (!haseeb) {
          haseeb = {
            id: 'usr_haseeb_001',
            name: 'Haseeb Ahmad',
            email: 'ahmadmhaseeb88@gmail.com',
            password_hash: haseebHash,
            student_id: 'MCKRU-2024-88',
            university: 'Mir Chakar Khan Rind University',
            semester: '3rd Semester',
            currency: 'PKR',
            monthly_budget: 35000,
            financial_goals: 'Save for investments, business, and tech upgrades',
            role: 'student',
            plan: 'pro',
            plan_expires_at: '2027-12-31T23:59:59.000Z',
            phone_number: '+923001234567',
            sms_webhook_token: 'student_sms_sec_haseeb',
            created_at: new Date().toISOString(),
          };
          this.data.users.push(haseeb);

          const now = new Date();
          const curY = now.getFullYear();
          const curM = String(now.getMonth() + 1).padStart(2, '0');

          // Seed sample transactions for Haseeb Ahmad
          this.data.transactions.push(
            {
              id: 'tx_hsb_01',
              user_id: haseeb.id,
              type: 'income',
              amount: 30000,
              category: 'Pocket Money',
              description: 'Monthly student allowance from family',
              date: `${curY}-${curM}-01`,
              payment_method: 'Bank Transfer',
              merchant: 'Family Allowance',
              created_at: new Date(`${curY}-${curM}-01T09:00:00Z`).toISOString(),
            },
            {
              id: 'tx_hsb_02',
              user_id: haseeb.id,
              type: 'expense',
              amount: 6000,
              category: 'Hostel and rent',
              description: 'Hostel room & mess payment',
              date: `${curY}-${curM}-03`,
              payment_method: 'Cash',
              merchant: 'MCKRU Hostel Warden',
              created_at: new Date(`${curY}-${curM}-03T11:00:00Z`).toISOString(),
            },
            {
              id: 'tx_hsb_03',
              user_id: haseeb.id,
              type: 'expense',
              amount: 1800,
              category: 'Food',
              description: 'University cafeteria lunch & tea',
              date: `${curY}-${curM}-06`,
              payment_method: 'EasyPaisa',
              merchant: 'University Canteen',
              created_at: new Date(`${curY}-${curM}-06T13:30:00Z`).toISOString(),
            },
            {
              id: 'tx_hsb_04',
              user_id: haseeb.id,
              type: 'expense',
              amount: 1200,
              category: 'Books and stationery',
              description: 'Semester notebooks and study notes photocopying',
              date: `${curY}-${curM}-08`,
              payment_method: 'Cash',
              merchant: 'Campus Book Store',
              created_at: new Date(`${curY}-${curM}-08T15:00:00Z`).toISOString(),
            }
          );

          // Seed default budgets for Haseeb Ahmad
          this.data.budgets.push(
            {
              id: 'bg_hsb_01',
              user_id: haseeb.id,
              category: 'Overall',
              period: 'monthly',
              amount: 35000,
              threshold_percent: 85,
              is_active: true,
              created_at: new Date().toISOString(),
            },
            {
              id: 'bg_hsb_02',
              user_id: haseeb.id,
              category: 'Food',
              period: 'monthly',
              amount: 10000,
              threshold_percent: 80,
              is_active: true,
              created_at: new Date().toISOString(),
            },
            {
              id: 'bg_hsb_03',
              user_id: haseeb.id,
              category: 'Hostel and rent',
              period: 'monthly',
              amount: 8000,
              threshold_percent: 85,
              is_active: true,
              created_at: new Date().toISOString(),
            }
          );

          // Seed savings goals for Haseeb Ahmad
          this.data.goals.push({
            id: 'gl_hsb_01',
            user_id: haseeb.id,
            title: 'Laptop Upgrade for University Coursework',
            target_amount: 85000,
            current_amount: 25000,
            target_date: `${curY}-12-30`,
            priority: 'high',
            status: 'active',
            notes: 'Mir Chakar Khan Rind University CS Lab simulations',
            created_at: new Date().toISOString(),
          });

          // Seed sample SMS logs for Haseeb Ahmad
          this.data.sms_logs.push({
            id: 'sms_hsb_01',
            user_id: haseeb.id,
            sender_number: '+923001234567',
            raw_text: 'Payment of Rs. 450 to University Canteen was successful on EasyPaisa',
            parsed_type: 'expense',
            parsed_amount: 450,
            parsed_category: 'Food',
            parsed_description: 'University Canteen (Food)',
            payment_method: 'EasyPaisa',
            status: 'processed',
            ai_parsed: true,
            created_at: new Date().toISOString(),
          });

          this.persist();
        } else {
          haseeb.email = 'ahmadmhaseeb88@gmail.com';
          haseeb.password_hash = haseebHash;
          haseeb.name = 'Haseeb Ahmad';
          haseeb.university = 'Mir Chakar Khan Rind University';
          if (!haseeb.student_id) haseeb.student_id = 'MCKRU-2024-88';
          if (!haseeb.sms_webhook_token) haseeb.sms_webhook_token = 'student_sms_sec_haseeb';
          if (!haseeb.phone_number) haseeb.phone_number = '+923001234567';

          // Ensure Haseeb has current-month demo transactions if none exist yet for current YYYY-MM
          const now = new Date();
          const curYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const hasCurMonthTx = this.data.transactions.some(
            (t) => t.user_id === haseeb!.id && t.date.startsWith(curYm)
          );
          if (!hasCurMonthTx && this.data.transactions.filter((t) => t.user_id === haseeb!.id).length <= 6) {
            this.data.transactions.push(
              {
                id: `tx_hsb_cur_01_${curYm}`,
                user_id: haseeb.id,
                type: 'income',
                amount: 65000,
                category: 'Salary',
                description: 'Monthly income & freelance payout',
                date: `${curYm}-01`,
                payment_method: 'Bank Transfer',
                merchant: 'Primary Income',
                created_at: new Date().toISOString(),
              },
              {
                id: `tx_hsb_cur_02_${curYm}`,
                user_id: haseeb.id,
                type: 'expense',
                amount: 12500,
                category: 'Hostel and rent',
                description: 'Monthly housing & utilities share',
                date: `${curYm}-04`,
                payment_method: 'Bank Transfer',
                merchant: 'Utilities & Rent',
                created_at: new Date().toISOString(),
              },
              {
                id: `tx_hsb_cur_03_${curYm}`,
                user_id: haseeb.id,
                type: 'expense',
                amount: 4800,
                category: 'Food',
                description: 'Groceries, tea & dining expenses',
                date: `${curYm}-09`,
                payment_method: 'EasyPaisa',
                merchant: 'City Mart & Cafe',
                created_at: new Date().toISOString(),
              },
              {
                id: `tx_hsb_cur_04_${curYm}`,
                user_id: haseeb.id,
                type: 'expense',
                amount: 2200,
                category: 'Internet and mobile',
                description: 'Fiber broadband & 4G mobile bundle',
                date: `${curYm}-12`,
                payment_method: 'JazzCash',
                merchant: 'PTCL & Jazz',
                created_at: new Date().toISOString(),
              }
            );
          }

          // Ensure Haseeb has a default Family Hub if not already in one
          this.ensureSeedFamilyForUser(haseeb);
          this.persist();
        }
      } catch (err) {
        console.error('Error reading database file, resetting to clean schema:', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('student123', salt);
    const haseebPasswordHash = bcrypt.hashSync('11223344', salt);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);

    const haseebUser: User = {
      id: 'usr_haseeb_001',
      name: 'Haseeb Ahmad',
      email: 'ahmadmhaseeb88@gmail.com',
      password_hash: haseebPasswordHash,
      student_id: 'MCKRU-2024-88',
      university: 'Mir Chakar Khan Rind University',
      semester: '3rd Semester',
      currency: 'PKR',
      monthly_budget: 35000,
      financial_goals: 'Save for semester fees and laptop upgrades',
      role: 'student',
      plan: 'pro',
      plan_expires_at: '2027-12-31T23:59:59.000Z',
      phone_number: '+923001234567',
      sms_webhook_token: 'student_sms_sec_haseeb',
      created_at: new Date().toISOString(),
    };

    const demoUser: User = {
      id: 'usr_demo_101',
      name: 'Hamza Khan',
      email: 'student@fast.edu.pk',
      password_hash: demoPasswordHash,
      student_id: 'BSCS-2023-42',
      university: 'FAST NUCES, Islamabad',
      semester: '5th Semester',
      currency: 'PKR',
      monthly_budget: 35000,
      financial_goals: 'Save for final year project hardware and laptop upgrade',
      role: 'student',
      plan: 'pro',
      plan_expires_at: '2027-12-31T23:59:59.000Z',
      phone_number: '+923001234567',
      sms_webhook_token: 'student_sms_sec_9941',
      created_at: new Date().toISOString(),
    };

    const adminUser: User = {
      id: 'usr_admin_001',
      name: 'System Administrator',
      email: 'admin@budgetpro.edu',
      password_hash: adminPasswordHash,
      university: 'Higher Education HQ',
      semester: 'Staff',
      currency: 'PKR',
      monthly_budget: 100000,
      role: 'admin',
      plan: 'pro',
      created_at: new Date().toISOString(),
    };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    const demoTransactions: Transaction[] = [
      {
        id: 'tx_01',
        user_id: demoUser.id,
        type: 'income',
        amount: 25000,
        category: 'Pocket Money',
        description: 'Monthly student allowance from family',
        date: `${currentYear}-${currentMonth}-01`,
        payment_method: 'Bank Transfer',
        merchant: 'Family Transfer',
        created_at: new Date(`${currentYear}-${currentMonth}-01T09:00:00Z`).toISOString(),
      },
      {
        id: 'tx_02',
        user_id: demoUser.id,
        type: 'income',
        amount: 15000,
        category: 'Freelancing',
        description: 'Frontend React UI project for client',
        date: `${currentYear}-${currentMonth}-05`,
        payment_method: 'EasyPaisa',
        merchant: 'Upwork Client',
        created_at: new Date(`${currentYear}-${currentMonth}-05T14:30:00Z`).toISOString(),
      },
      {
        id: 'tx_03',
        user_id: demoUser.id,
        type: 'expense',
        amount: 8500,
        category: 'Hostel and rent',
        description: 'Hostel shared room rent for this month',
        date: `${currentYear}-${currentMonth}-03`,
        payment_method: 'Cash',
        merchant: 'Hostel Warden',
        created_at: new Date(`${currentYear}-${currentMonth}-03T11:00:00Z`).toISOString(),
      },
      {
        id: 'tx_04',
        user_id: demoUser.id,
        type: 'expense',
        amount: 3200,
        category: 'Food',
        description: 'Campus cafeteria meals & hostel dinner mess',
        date: `${currentYear}-${currentMonth}-06`,
        payment_method: 'Cash',
        merchant: 'FAST Campus Cafe',
        created_at: new Date(`${currentYear}-${currentMonth}-06T13:15:00Z`).toISOString(),
      },
      {
        id: 'tx_05',
        user_id: demoUser.id,
        type: 'expense',
        amount: 2100,
        category: 'Transport',
        description: 'Metro bus card recharge & local commute rides',
        date: `${currentYear}-${currentMonth}-08`,
        payment_method: 'EasyPaisa',
        merchant: 'Metro Bus Card',
        created_at: new Date(`${currentYear}-${currentMonth}-08T08:45:00Z`).toISOString(),
      },
      {
        id: 'tx_06',
        user_id: demoUser.id,
        type: 'expense',
        amount: 1850,
        category: 'Books and stationery',
        description: 'Database Systems textbook & notebook prints',
        date: `${currentYear}-${currentMonth}-10`,
        payment_method: 'Cash',
        merchant: 'Al-Huda Book Bank',
        created_at: new Date(`${currentYear}-${currentMonth}-10T16:20:00Z`).toISOString(),
      },
      {
        id: 'tx_07',
        user_id: demoUser.id,
        type: 'expense',
        amount: 1450,
        category: 'Internet and mobile',
        description: 'Zong 4G monthly student data bundle',
        date: `${currentYear}-${currentMonth}-11`,
        payment_method: 'JazzCash',
        merchant: 'Zong Telecommunications',
        created_at: new Date(`${currentYear}-${currentMonth}-11T18:00:00Z`).toISOString(),
      },
    ];

    const demoBudgets: Budget[] = [
      {
        id: 'bg_01',
        user_id: demoUser.id,
        category: 'Overall',
        period: 'monthly',
        amount: 35000,
        threshold_percent: 85,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'bg_02',
        user_id: demoUser.id,
        category: 'Food',
        period: 'monthly',
        amount: 10000,
        threshold_percent: 80,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'bg_03',
        user_id: demoUser.id,
        category: 'Transport',
        period: 'monthly',
        amount: 4000,
        threshold_percent: 75,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'bg_04',
        user_id: demoUser.id,
        category: 'Books and stationery',
        period: 'monthly',
        amount: 3000,
        threshold_percent: 80,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];

    const demoGoals: SavingsGoal[] = [
      {
        id: 'gl_01',
        user_id: demoUser.id,
        title: 'M2 MacBook Pro / High-End Laptop for FYP',
        target_amount: 160000,
        current_amount: 45000,
        target_date: `${currentYear}-12-25`,
        priority: 'high',
        notes: 'Required for deep learning senior year project simulations',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'gl_02',
        user_id: demoUser.id,
        title: 'Cloud Certification Exam Voucher',
        target_amount: 25000,
        current_amount: 18000,
        target_date: `${currentYear}-${currentMonth}-30`,
        priority: 'medium',
        notes: 'AWS Certified Solutions Architect voucher with student discount',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'gl_03',
        user_id: demoUser.id,
        title: 'Semester Emergency Fund',
        target_amount: 20000,
        current_amount: 20000,
        target_date: `${currentYear}-09-01`,
        priority: 'high',
        notes: 'Emergency reserve for medical or urgent travel',
        status: 'completed',
        created_at: new Date().toISOString(),
      },
    ];

    const demoBills: BillReminder[] = [
      {
        id: 'bl_01',
        user_id: demoUser.id,
        title: 'Hostel Mess & Room Rent',
        amount: 8500,
        category: 'Hostel and rent',
        due_date: `${currentYear}-${currentMonth}-28`,
        recurring_frequency: 'monthly',
        is_paid: false,
        reminder_days_before: 3,
        created_at: new Date().toISOString(),
      },
      {
        id: 'bl_02',
        user_id: demoUser.id,
        title: 'University Midterm Exam Fee',
        amount: 3500,
        category: 'University fees',
        due_date: `${currentYear}-${currentMonth}-22`,
        recurring_frequency: 'semester',
        is_paid: false,
        reminder_days_before: 5,
        created_at: new Date().toISOString(),
      },
      {
        id: 'bl_03',
        user_id: demoUser.id,
        title: 'Hostel WiFi / Shared Fiber Fiberlink',
        amount: 1200,
        category: 'Internet and mobile',
        due_date: `${currentYear}-${currentMonth}-15`,
        recurring_frequency: 'monthly',
        is_paid: true,
        last_paid_at: `${currentYear}-${currentMonth}-14`,
        reminder_days_before: 2,
        created_at: new Date().toISOString(),
      },
    ];

    const demoSemesterPlan: SemesterPlan = {
      id: 'sp_01',
      user_id: demoUser.id,
      semester_name: 'Fall 2026 Semester',
      start_date: `${currentYear}-09-01`,
      end_date: `${currentYear + (now.getMonth() > 6 ? 1 : 0)}-01-31`,
      expected_monthly_allowance: 25000,
      scholarship_salary: 15000,
      tuition_exam_fee: 75000,
      hostel_rent: 42500,
      food_transport_est: 55000,
      books_materials: 12000,
      other_expenses: 8000,
      notes: 'Planning for 5 months duration. Aiming for 20% savings margin.',
      created_at: new Date().toISOString(),
    };

    const demoSubscription: SubscriptionRecord = {
      id: 'sub_01',
      user_id: demoUser.id,
      plan: 'pro',
      amount_pkr: 299,
      billing_cycle: 'monthly',
      status: 'active',
      payment_method: 'EasyPaisa',
      reference_no: 'EP-98234710',
      created_at: new Date().toISOString(),
      expires_at: '2027-12-31T23:59:59.000Z',
    };

    this.data = {
      users: [haseebUser, demoUser, adminUser],
      transactions: demoTransactions,
      budgets: demoBudgets,
      goals: demoGoals,
      bills: demoBills,
      semester_plans: [demoSemesterPlan],
      receipts: [],
      subscriptions: [demoSubscription],
      sms_logs: [],
      family_groups: [],
      family_members: [],
      family_transactions: [],
      family_goals: [],
    };

    this.ensureSeedFamilyForUser(haseebUser);
    this.persist();
  }

  private ensureSeedFamilyForUser(user: User) {
    const existingMember = this.data.family_members.find((m) => m.user_id === user.id);
    const existingOwner = this.data.family_groups.find((g) => g.owner_id === user.id);
    if (existingMember || existingOwner) return;

    const now = new Date();
    const curYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const famId = `fam_${user.id}`;

    this.data.family_groups.push({
      id: famId,
      name: `${user.name.split(' ')[0]} Family Hub`,
      owner_id: user.id,
      invite_code: 'FAM-8842-PK',
      shared_monthly_budget: 120000,
      currency: user.currency || 'PKR',
      created_at: new Date().toISOString(),
    });

    const ownerMemId = `fmem_${user.id}_1`;
    const parentMemId = `fmem_${user.id}_2`;
    const spouseMemId = `fmem_${user.id}_3`;
    const siblingMemId = `fmem_${user.id}_4`;

    this.data.family_members.push(
      {
        id: ownerMemId,
        family_id: famId,
        user_id: user.id,
        name: user.name,
        email: user.email,
        relation: 'Owner',
        role: 'admin',
        spending_limit: 45000,
        status: 'active',
        avatar_color: 'bg-indigo-600',
        joined_at: new Date().toISOString(),
      },
      {
        id: parentMemId,
        family_id: famId,
        name: 'Tariq Ahmad',
        email: 'tariq.family@gmail.com',
        relation: 'Parent',
        role: 'admin',
        spending_limit: 40000,
        status: 'active',
        avatar_color: 'bg-emerald-600',
        joined_at: new Date().toISOString(),
      },
      {
        id: spouseMemId,
        family_id: famId,
        name: 'Ayesha Ahmad',
        email: 'ayesha.family@gmail.com',
        relation: 'Spouse',
        role: 'contributor',
        spending_limit: 25000,
        status: 'active',
        avatar_color: 'bg-violet-600',
        joined_at: new Date().toISOString(),
      },
      {
        id: siblingMemId,
        family_id: famId,
        name: 'Bilal Ahmad',
        email: 'bilal.family@gmail.com',
        relation: 'Sibling',
        role: 'contributor',
        spending_limit: 15000,
        status: 'invited',
        avatar_color: 'bg-amber-600',
        joined_at: new Date().toISOString(),
      }
    );

    this.data.family_transactions.push(
      {
        id: `ftx_${user.id}_1`,
        family_id: famId,
        member_id: ownerMemId,
        member_name: user.name,
        type: 'income',
        amount: 60000,
        category: 'Household Pool',
        description: 'Monthly household contribution',
        date: `${curYm}-01`,
        payment_method: 'Bank Transfer',
        created_at: new Date().toISOString(),
      },
      {
        id: `ftx_${user.id}_2`,
        family_id: famId,
        member_id: parentMemId,
        member_name: 'Tariq Ahmad',
        type: 'income',
        amount: 55000,
        category: 'Household Pool',
        description: 'Family monthly reserve contribution',
        date: `${curYm}-02`,
        payment_method: 'Bank Transfer',
        created_at: new Date().toISOString(),
      },
      {
        id: `ftx_${user.id}_3`,
        family_id: famId,
        member_id: spouseMemId,
        member_name: 'Ayesha Ahmad',
        type: 'expense',
        amount: 18500,
        category: 'Groceries & Mart',
        description: 'Monthly household groceries & kitchen supplies',
        date: `${curYm}-05`,
        payment_method: 'Debit Card',
        split_equally: true,
        created_at: new Date().toISOString(),
      },
      {
        id: `ftx_${user.id}_4`,
        family_id: famId,
        member_id: ownerMemId,
        member_name: user.name,
        type: 'expense',
        amount: 14200,
        category: 'Bills & Utilities',
        description: 'Home electricity, gas & fiber internet bills',
        date: `${curYm}-10`,
        payment_method: 'EasyPaisa',
        split_equally: true,
        created_at: new Date().toISOString(),
      },
      {
        id: `ftx_${user.id}_5`,
        family_id: famId,
        member_id: siblingMemId,
        member_name: 'Bilal Ahmad',
        type: 'expense',
        amount: 6400,
        category: 'Transport & Fuel',
        description: 'Family vehicle fuel & maintenance',
        date: `${curYm}-14`,
        payment_method: 'Cash',
        created_at: new Date().toISOString(),
      }
    );

    this.data.family_goals.push(
      {
        id: `fgl_${user.id}_1`,
        family_id: famId,
        title: 'Family Emergency & Medical Reserve',
        target_amount: 300000,
        current_amount: 165000,
        target_date: `${now.getFullYear() + 1}-06-30`,
        contributors: [
          { member_id: ownerMemId, member_name: user.name, amount: 85000 },
          { member_id: parentMemId, member_name: 'Tariq Ahmad', amount: 60000 },
          { member_id: spouseMemId, member_name: 'Ayesha Ahmad', amount: 20000 },
        ],
        created_at: new Date().toISOString(),
      },
      {
        id: `fgl_${user.id}_2`,
        family_id: famId,
        title: 'Home Solar Backup System',
        target_amount: 250000,
        current_amount: 95000,
        target_date: `${now.getFullYear() + 1}-04-15`,
        contributors: [
          { member_id: parentMemId, member_name: 'Tariq Ahmad', amount: 55000 },
          { member_id: ownerMemId, member_name: user.name, amount: 40000 },
        ],
        created_at: new Date().toISOString(),
      }
    );
  }

  // User repository
  public findUserByEmail(email: string): User | undefined {
    const norm = String(email || '').toLowerCase().trim();
    if (!norm) return undefined;
    return this.data.users.find(
      (u) =>
        u.email.toLowerCase().trim() === norm ||
        (norm === 'ahmadmhaseeb88@gmail.com' && (u.email.toLowerCase().trim() === 'haseeb@gmail.com' || u.id === 'usr_haseeb_001')) ||
        (norm === 'haseeb@gmail.com' && (u.email.toLowerCase().trim() === 'ahmadmhaseeb88@gmail.com' || u.id === 'usr_haseeb_001'))
    );
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    return this.data.users[idx];
  }

  public touchUserActivity(id: string): void {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return;
    const prev = this.data.users[idx].last_active_at;
    const nowMs = Date.now();
    const prevMs = prev ? new Date(prev).getTime() : 0;
    if (!prev || isNaN(prevMs) || nowMs - prevMs >= 60 * 1000) {
      this.data.users[idx].last_active_at = new Date(nowMs).toISOString();
      this.persist();
    }
  }

  public deleteUser(id: string): boolean {
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.data.transactions = this.data.transactions.filter((t) => t.user_id !== id);
    this.data.budgets = this.data.budgets.filter((b) => b.user_id !== id);
    this.data.goals = this.data.goals.filter((g) => g.user_id !== id);
    this.data.bills = this.data.bills.filter((b) => b.user_id !== id);
    this.data.semester_plans = this.data.semester_plans.filter((s) => s.user_id !== id);
    this.data.receipts = this.data.receipts.filter((r) => r.user_id !== id);
    this.data.subscriptions = this.data.subscriptions.filter((s) => s.user_id !== id);
    this.persist();
    return true;
  }

  public getAllUsers(): User[] {
    return this.data.users;
  }

  // Transactions
  public getTransactions(userId: string): Transaction[] {
    return this.data.transactions
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getTransactionById(id: string, userId: string): Transaction | undefined {
    return this.data.transactions.find((t) => t.id === id && t.user_id === userId);
  }

  public createTransaction(tx: Transaction): Transaction {
    this.data.transactions.push(tx);
    this.persist();
    return tx;
  }

  public updateTransaction(id: string, userId: string, updates: Partial<Transaction>): Transaction | undefined {
    const idx = this.data.transactions.findIndex((t) => t.id === id && t.user_id === userId);
    if (idx === -1) return undefined;
    this.data.transactions[idx] = { ...this.data.transactions[idx], ...updates };
    this.persist();
    return this.data.transactions[idx];
  }

  public deleteTransaction(id: string, userId: string): boolean {
    const initialLen = this.data.transactions.length;
    this.data.transactions = this.data.transactions.filter((t) => !(t.id === id && t.user_id === userId));
    const deleted = this.data.transactions.length !== initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // Budgets
  public getBudgets(userId: string): Budget[] {
    return this.data.budgets.filter((b) => b.user_id === userId);
  }

  public createBudget(bg: Budget): Budget {
    // Check if category budget already exists for this user, if so update it
    const existingIdx = this.data.budgets.findIndex((b) => b.user_id === bg.user_id && b.category === bg.category);
    if (existingIdx !== -1) {
      this.data.budgets[existingIdx] = { ...this.data.budgets[existingIdx], ...bg, id: this.data.budgets[existingIdx].id };
      this.persist();
      return this.data.budgets[existingIdx];
    }
    this.data.budgets.push(bg);
    this.persist();
    return bg;
  }

  public updateBudget(id: string, userId: string, updates: Partial<Budget>): Budget | undefined {
    const idx = this.data.budgets.findIndex((b) => b.id === id && b.user_id === userId);
    if (idx === -1) return undefined;
    this.data.budgets[idx] = { ...this.data.budgets[idx], ...updates };
    this.persist();
    return this.data.budgets[idx];
  }

  public deleteBudget(id: string, userId: string): boolean {
    const initialLen = this.data.budgets.length;
    this.data.budgets = this.data.budgets.filter((b) => !(b.id === id && b.user_id === userId));
    const deleted = this.data.budgets.length !== initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // Savings Goals
  public getGoals(userId: string): SavingsGoal[] {
    return this.data.goals.filter((g) => g.user_id === userId);
  }

  public createGoal(goal: SavingsGoal): SavingsGoal {
    this.data.goals.push(goal);
    this.persist();
    return goal;
  }

  public updateGoal(id: string, userId: string, updates: Partial<SavingsGoal>): SavingsGoal | undefined {
    const idx = this.data.goals.findIndex((g) => g.id === id && g.user_id === userId);
    if (idx === -1) return undefined;
    this.data.goals[idx] = { ...this.data.goals[idx], ...updates };
    this.persist();
    return this.data.goals[idx];
  }

  public depositToGoal(id: string, userId: string, amount: number): { goal: SavingsGoal; isCompleted: boolean } | undefined {
    const goal = this.data.goals.find((g) => g.id === id && g.user_id === userId);
    if (!goal) return undefined;
    const newCurrent = goal.current_amount + amount;
    const newStatus = newCurrent >= goal.target_amount ? 'completed' : goal.status;
    const updated = this.updateGoal(id, userId, { current_amount: newCurrent, status: newStatus });
    if (!updated) return undefined;
    return { goal: updated, isCompleted: newCurrent >= goal.target_amount };
  }

  public deleteGoal(id: string, userId: string): boolean {
    const initialLen = this.data.goals.length;
    this.data.goals = this.data.goals.filter((g) => !(g.id === id && g.user_id === userId));
    const deleted = this.data.goals.length !== initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // Bills & Reminders
  public getBills(userId: string): BillReminder[] {
    return this.data.bills.filter((b) => b.user_id === userId);
  }

  public createBill(bill: BillReminder): BillReminder {
    this.data.bills.push(bill);
    this.persist();
    return bill;
  }

  public updateBill(id: string, userId: string, updates: Partial<BillReminder>): BillReminder | undefined {
    const idx = this.data.bills.findIndex((b) => b.id === id && b.user_id === userId);
    if (idx === -1) return undefined;
    this.data.bills[idx] = { ...this.data.bills[idx], ...updates };
    this.persist();
    return this.data.bills[idx];
  }

  public deleteBill(id: string, userId: string): boolean {
    const initialLen = this.data.bills.length;
    this.data.bills = this.data.bills.filter((b) => !(b.id === id && b.user_id === userId));
    const deleted = this.data.bills.length !== initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // Semester Plans
  public getSemesterPlans(userId: string): SemesterPlan[] {
    return this.data.semester_plans.filter((s) => s.user_id === userId);
  }

  public saveSemesterPlan(plan: SemesterPlan): SemesterPlan {
    const idx = this.data.semester_plans.findIndex((s) => s.id === plan.id && s.user_id === plan.user_id);
    if (idx !== -1) {
      this.data.semester_plans[idx] = plan;
    } else {
      this.data.semester_plans.push(plan);
    }
    this.persist();
    return plan;
  }

  public deleteSemesterPlan(id: string, userId: string): boolean {
    const initialLen = this.data.semester_plans.length;
    this.data.semester_plans = this.data.semester_plans.filter((s) => !(s.id === id && s.user_id === userId));
    const deleted = this.data.semester_plans.length !== initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // Receipts
  public getReceipts(userId: string): Receipt[] {
    return this.data.receipts
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getReceiptById(id: string, userId: string): Receipt | undefined {
    return this.data.receipts.find((r) => r.id === id && r.user_id === userId);
  }

  public saveReceipt(rc: Receipt): Receipt {
    this.data.receipts.push(rc);
    this.persist();
    return rc;
  }

  public deleteReceipt(id: string, userId: string): boolean {
    const initialLen = this.data.receipts.length;
    this.data.receipts = this.data.receipts.filter((r) => !(r.id === id && r.user_id === userId));
    const deleted = this.data.receipts.length !== initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // Subscriptions
  public getSubscriptions(userId: string): SubscriptionRecord[] {
    return this.data.subscriptions
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public recordSubscription(sub: SubscriptionRecord): SubscriptionRecord {
    this.data.subscriptions.push(sub);
    // Update user plan
    const user = this.findUserById(sub.user_id);
    if (user) {
      user.plan = sub.plan;
      user.plan_expires_at = sub.expires_at;
      this.updateUser(user.id, { plan: sub.plan, plan_expires_at: sub.expires_at });
    }
    this.persist();
    return sub;
  }

  // SMS Logs & Inbound Management
  public getSmsLogs(userId: string): SmsLog[] {
    if (!this.data.sms_logs) this.data.sms_logs = [];
    return this.data.sms_logs
      .filter((l) => l.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public saveSmsLog(log: SmsLog): SmsLog {
    if (!this.data.sms_logs) this.data.sms_logs = [];
    this.data.sms_logs.unshift(log);
    // Keep max 200 logs per database
    if (this.data.sms_logs.length > 200) {
      this.data.sms_logs = this.data.sms_logs.slice(0, 200);
    }
    this.persist();
    return log;
  }

  public deleteSmsLog(id: string, userId: string): boolean {
    if (!this.data.sms_logs) return false;
    const initialLen = this.data.sms_logs.length;
    this.data.sms_logs = this.data.sms_logs.filter((l) => !(l.id === id && l.user_id === userId));
    const deleted = this.data.sms_logs.length !== initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  public findUserBySmsToken(token: string): User | undefined {
    if (!token) return undefined;
    return this.data.users.find((u) => u.sms_webhook_token === token.trim());
  }

  public findUserByPhone(phone: string): User | undefined {
    if (!phone) return undefined;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    return this.data.users.find((u) => {
      if (!u.phone_number) return false;
      const uClean = u.phone_number.replace(/[^\d+]/g, '');
      return uClean === cleanPhone || (cleanPhone.length >= 7 && uClean.endsWith(cleanPhone.slice(-7)));
    });
  }

  public updateUserSmsConfig(userId: string, phone?: string, token?: string): User | undefined {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    if (phone !== undefined) user.phone_number = phone.trim();
    if (token !== undefined) user.sms_webhook_token = token.trim();
    this.persist();
    return user;
  }

  // ==========================================
  // FAMILY SHARING REPOSITORY
  // ==========================================
  public getUserFamily(userId: string): FamilyGroup | undefined {
    const member = this.data.family_members.find((m) => m.user_id === userId);
    if (member) {
      return this.data.family_groups.find((g) => g.id === member.family_id);
    }
    return this.data.family_groups.find((g) => g.owner_id === userId);
  }

  public getFamilyByInviteCode(code: string): FamilyGroup | undefined {
    const norm = code.trim().toUpperCase();
    return this.data.family_groups.find((g) => g.invite_code.toUpperCase() === norm);
  }

  public createFamilyGroup(group: FamilyGroup, ownerMember: FamilyMember): FamilyGroup {
    this.data.family_groups.push(group);
    this.data.family_members.push(ownerMember);
    this.persist();
    return group;
  }

  public updateFamilyGroup(id: string, updates: Partial<FamilyGroup>): FamilyGroup | undefined {
    const idx = this.data.family_groups.findIndex((g) => g.id === id);
    if (idx === -1) return undefined;
    this.data.family_groups[idx] = { ...this.data.family_groups[idx], ...updates };
    this.persist();
    return this.data.family_groups[idx];
  }

  public getFamilyMembers(familyId: string): FamilyMember[] {
    return this.data.family_members.filter((m) => m.family_id === familyId);
  }

  public addFamilyMember(member: FamilyMember): FamilyMember {
    this.data.family_members.push(member);
    this.persist();
    return member;
  }

  public updateFamilyMember(
    familyId: string,
    memberId: string,
    updates: Partial<FamilyMember>
  ): FamilyMember | undefined {
    const idx = this.data.family_members.findIndex((m) => m.id === memberId && m.family_id === familyId);
    if (idx === -1) return undefined;
    this.data.family_members[idx] = { ...this.data.family_members[idx], ...updates };
    this.persist();
    return this.data.family_members[idx];
  }

  public removeFamilyMember(familyId: string, memberId: string): boolean {
    const initialLen = this.data.family_members.length;
    this.data.family_members = this.data.family_members.filter(
      (m) => !(m.id === memberId && m.family_id === familyId && m.relation !== 'Owner')
    );
    const deleted = this.data.family_members.length !== initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  public getFamilyTransactions(familyId: string): FamilyTransaction[] {
    return this.data.family_transactions
      .filter((t) => t.family_id === familyId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public addFamilyTransaction(tx: FamilyTransaction): FamilyTransaction {
    this.data.family_transactions.push(tx);
    this.persist();
    return tx;
  }

  public deleteFamilyTransaction(familyId: string, txId: string): boolean {
    const initialLen = this.data.family_transactions.length;
    this.data.family_transactions = this.data.family_transactions.filter(
      (t) => !(t.id === txId && t.family_id === familyId)
    );
    const deleted = this.data.family_transactions.length !== initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  public getFamilyGoals(familyId: string): FamilySharedGoal[] {
    return this.data.family_goals.filter((g) => g.family_id === familyId);
  }

  public createFamilyGoal(goal: FamilySharedGoal): FamilySharedGoal {
    this.data.family_goals.push(goal);
    this.persist();
    return goal;
  }

  public contributeFamilyGoal(
    familyId: string,
    goalId: string,
    memberId: string,
    memberName: string,
    amount: number
  ): FamilySharedGoal | undefined {
    const goal = this.data.family_goals.find((g) => g.id === goalId && g.family_id === familyId);
    if (!goal) return undefined;
    goal.current_amount += amount;
    const existingContributor = goal.contributors.find((c) => c.member_id === memberId);
    if (existingContributor) {
      existingContributor.amount += amount;
    } else {
      goal.contributors.push({ member_id: memberId, member_name: memberName, amount });
    }
    this.persist();
    return goal;
  }

  public deleteFamilyGoal(familyId: string, goalId: string): boolean {
    const initialLen = this.data.family_goals.length;
    this.data.family_goals = this.data.family_goals.filter(
      (g) => !(g.id === goalId && g.family_id === familyId)
    );
    const deleted = this.data.family_goals.length !== initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  public getPublicUsageStats() {
    const now = Date.now();
    const fifteenMinAgo = now - 15 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const todayPrefix = new Date(now).toISOString().split('T')[0];

    let activeNow = 0;
    let activeToday = 0;
    let newToday = 0;

    for (const u of this.data.users) {
      const lastActiveMs = u.last_active_at ? new Date(u.last_active_at).getTime() : 0;
      if (lastActiveMs >= fifteenMinAgo) activeNow++;
      if (lastActiveMs >= oneDayAgo || (u.created_at && u.created_at.startsWith(todayPrefix))) {
        activeToday++;
      }
      if (u.created_at && u.created_at.startsWith(todayPrefix)) {
        newToday++;
      }
    }

    return {
      totalUsers: this.data.users.length,
      activeNow,
      activeToday,
      newToday,
      totalTransactions: this.data.transactions.length,
      totalFamilyHubs: this.data.family_groups.length,
    };
  }

  // System Stats for Admin
  public getSystemStats() {
    const usage = this.getPublicUsageStats();
    return {
      totalUsers: usage.totalUsers,
      activeNow: usage.activeNow,
      activeToday: usage.activeToday,
      newToday: usage.newToday,
      activeStudents: this.data.users.filter((u) => u.role === 'student').length,
      paidSubscriptions: this.data.users.filter((u) => u.plan === 'premium' || u.plan === 'pro').length,
      totalTransactionsRecorded: this.data.transactions.length,
      totalBudgetsConfigured: this.data.budgets.length,
      totalSavingsGoalsTracked: this.data.goals.length,
      totalReceiptsProcessed: this.data.receipts.length,
      totalFamilyHubs: this.data.family_groups.length,
    };
  }
}

export const db = new DatabaseStore();
