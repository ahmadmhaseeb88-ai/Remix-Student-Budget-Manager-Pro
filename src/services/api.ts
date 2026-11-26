import {
  User,
  Transaction,
  Budget,
  SavingsGoal,
  BillReminder,
  SemesterPlan,
  Receipt,
  DashboardSummary,
  CoachInsight,
  SubscriptionPlan,
  SmsLog,
  FamilyHubResponse,
} from '../types';

const TOKEN_KEY = 'budget_pro_token';
const USER_KEY = 'budget_pro_user';

export const api = {
  // Token and Auth State
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setAuth(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCachedUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Base request handler
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (err: any) {
        data = { error: 'Failed to parse JSON response: ' + err.message };
      }
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        const looksLikeHtml = /<!doctype|<html/i.test(text || '');
        data = {
          error: looksLikeHtml
            ? `Service endpoint unavailable (${response.status}). Please refresh or try again.`
            : text?.slice(0, 150) || `HTTP ${response.status} ${response.statusText}`,
        };
      }
    }

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        this.clearAuth();
      }
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  },

  // Auth endpoints
  async register(payload: any): Promise<{ token: string; user: User; message: string }> {
    const res = await this.request<{ token: string; user: User; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setAuth(res.token, res.user);
    return res;
  },

  async login(payload: any): Promise<{ token: string; user: User; message: string }> {
    const res = await this.request<{ token: string; user: User; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setAuth(res.token, res.user);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await this.request<{ user: User }>('/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    return res;
  },

  async updateProfile(payload: Partial<User>): Promise<{ user: User; message: string }> {
    const res = await this.request<{ user: User; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    return res;
  },

  async changePassword(payload: any): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async deleteAccount(password: string): Promise<{ message: string }> {
    const res = await this.request<{ message: string }>('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
    this.clearAuth();
    return res;
  },

  // Dashboard
  async getDashboardSummary(month?: string): Promise<DashboardSummary> {
    const query = month ? `?month=${month}` : '';
    return this.request<DashboardSummary>(`/dashboard/summary${query}`);
  },

  // Transactions
  async getTransactions(params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    payment_method?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Transaction[]; pagination: any }> {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          q.append(k, String(v));
        }
      });
    }
    return this.request<{ data: Transaction[]; pagination: any }>(`/transactions?${q.toString()}`);
  },

  async createTransaction(payload: Partial<Transaction>): Promise<{ data: Transaction; message: string }> {
    return this.request<{ data: Transaction; message: string }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateTransaction(id: string, payload: Partial<Transaction>): Promise<{ data: Transaction; message: string }> {
    return this.request<{ data: Transaction; message: string }>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteTransaction(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  async importTransactionsCsv(rows: any[]): Promise<{ count: number; message: string }> {
    return this.request<{ count: number; message: string }>('/transactions/import-csv', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },

  // Budgets
  async getBudgets(): Promise<{ data: Budget[] }> {
    return this.request<{ data: Budget[] }>('/budgets');
  },

  async createBudget(payload: Partial<Budget>): Promise<{ data: Budget; message: string }> {
    return this.request<{ data: Budget; message: string }>('/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateBudget(id: string, payload: Partial<Budget>): Promise<{ data: Budget; message: string }> {
    return this.request<{ data: Budget; message: string }>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteBudget(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/budgets/${id}`, {
      method: 'DELETE',
    });
  },

  // Savings Goals
  async getGoals(): Promise<{ data: SavingsGoal[] }> {
    return this.request<{ data: SavingsGoal[] }>('/goals');
  },

  async createGoal(payload: Partial<SavingsGoal>): Promise<{ data: SavingsGoal; message: string }> {
    return this.request<{ data: SavingsGoal; message: string }>('/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateGoal(id: string, payload: Partial<SavingsGoal>): Promise<{ data: SavingsGoal; message: string }> {
    return this.request<{ data: SavingsGoal; message: string }>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async depositGoal(
    id: string,
    amount: number,
    deduct_from_balance?: boolean
  ): Promise<{ data: SavingsGoal; isCompleted: boolean; message: string }> {
    return this.request<{ data: SavingsGoal; isCompleted: boolean; message: string }>(`/goals/${id}/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount, deduct_from_balance }),
    });
  },

  async deleteGoal(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/goals/${id}`, {
      method: 'DELETE',
    });
  },

  // Bills & Reminders
  async getBills(): Promise<{ data: BillReminder[] }> {
    return this.request<{ data: BillReminder[] }>('/bills');
  },

  async createBill(payload: Partial<BillReminder>): Promise<{ data: BillReminder; message: string }> {
    return this.request<{ data: BillReminder; message: string }>('/bills', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateBill(id: string, payload: Partial<BillReminder>): Promise<{ data: BillReminder; message: string }> {
    return this.request<{ data: BillReminder; message: string }>(`/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async payBill(
    id: string,
    record_as_expense: boolean = true,
    payment_method: string = 'Cash'
  ): Promise<{ data: BillReminder; message: string }> {
    return this.request<{ data: BillReminder; message: string }>(`/bills/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ record_as_expense, payment_method }),
    });
  },

  async deleteBill(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/bills/${id}`, {
      method: 'DELETE',
    });
  },

  // Semester Plans
  async getSemesterPlans(): Promise<{ data: SemesterPlan[] }> {
    return this.request<{ data: SemesterPlan[] }>('/semester-plans');
  },

  async saveSemesterPlan(payload: Partial<SemesterPlan>): Promise<{ data: SemesterPlan; message: string }> {
    return this.request<{ data: SemesterPlan; message: string }>('/semester-plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteSemesterPlan(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/semester-plans/${id}`, {
      method: 'DELETE',
    });
  },

  // CamScanner Receipts
  async getReceipts(): Promise<{ data: Receipt[] }> {
    return this.request<{ data: Receipt[] }>('/receipts');
  },

  async processReceipt(payload: {
    file_name: string;
    file_data_base64: string;
    mime_type: string;
    file_size: number;
  }): Promise<{ data: Receipt; ocr: any; message: string }> {
    return this.request<{ data: Receipt; ocr: any; message: string }>('/receipts/process', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteReceipt(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/receipts/${id}`, {
      method: 'DELETE',
    });
  },

  // AI & Voice
  async getAiCoachInsights(): Promise<{ data: CoachInsight }> {
    return this.request<{ data: CoachInsight }>('/ai/coach');
  },

  async parseVoiceExpense(transcript: string): Promise<{ data: Partial<Transaction> }> {
    return this.request<{ data: Partial<Transaction> }>('/ai/voice-parse', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    });
  },

  async askAiChat(message: string, history?: Array<{ sender: 'user' | 'coach' | 'assistant'; text: string }>): Promise<{ reply: string }> {
    return this.request<{ reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },

  // Subscriptions
  async getSubscriptionPlans(): Promise<{ plans: SubscriptionPlan[] }> {
    return this.request<{ plans: SubscriptionPlan[] }>('/subscriptions/plans');
  },

  async getCurrentSubscription(): Promise<any> {
    return this.request<any>('/subscriptions/current');
  },

  async upgradeSubscription(payload: {
    plan_id: string;
    payment_method: string;
    mobile_or_card_no?: string;
  }): Promise<any> {
    return this.request<any>('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Admin
  async getAdminStats(): Promise<any> {
    return this.request<any>('/admin/stats');
  },

  // Mobile SMS Sync & Automation
  async getSmsLogs(): Promise<{ data: SmsLog[] }> {
    return this.request<{ data: SmsLog[] }>('/sms/logs');
  },

  async simulateSms(message: string, sender?: string): Promise<any> {
    return this.request<any>('/sms/simulate', {
      method: 'POST',
      body: JSON.stringify({ message, sender }),
    });
  },

  async getSmsConfig(): Promise<{ phone_number: string; sms_webhook_token: string }> {
    return this.request<{ phone_number: string; sms_webhook_token: string }>('/sms/config');
  },

  async updateSmsConfig(payload: { phone_number?: string; regenerate_token?: boolean }): Promise<any> {
    return this.request<any>('/sms/config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteSmsLog(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/sms/logs/${id}`, {
      method: 'DELETE',
    });
  },

  // Family Sharing Hub
  async getFamilyHub(): Promise<FamilyHubResponse> {
    return this.request<FamilyHubResponse>('/family');
  },

  async createFamilyHub(payload: { name: string; shared_monthly_budget: number }): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>('/family', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async joinFamilyHub(invite_code: string): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>('/family/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code }),
    });
  },

  async updateFamilyHub(payload: { name?: string; shared_monthly_budget?: number; regenerate_code?: boolean }): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>('/family', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async addFamilyMember(payload: {
    name: string;
    email?: string;
    relation: string;
    role: string;
    spending_limit: number;
  }): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>('/family/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateFamilyMember(
    memberId: string,
    payload: { role?: string; spending_limit?: number; relation?: string; status?: string }
  ): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>(`/family/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async removeFamilyMember(memberId: string): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>(`/family/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  async addFamilyTransaction(payload: {
    member_id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    date: string;
    payment_method: string;
    split_equally?: boolean;
    sync_to_personal?: boolean;
  }): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>('/family/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteFamilyTransaction(txId: string): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>(`/family/transactions/${txId}`, {
      method: 'DELETE',
    });
  },

  async createFamilyGoal(payload: {
    title: string;
    target_amount: number;
    current_amount?: number;
    target_date: string;
  }): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>('/family/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async contributeFamilyGoal(
    goalId: string,
    payload: { amount: number; member_id: string }
  ): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>(`/family/goals/${goalId}/contribute`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteFamilyGoal(goalId: string): Promise<FamilyHubResponse & { message: string }> {
    return this.request<FamilyHubResponse & { message: string }>(`/family/goals/${goalId}`, {
      method: 'DELETE',
    });
  },
};
