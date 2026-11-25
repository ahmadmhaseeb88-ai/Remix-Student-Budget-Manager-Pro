import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<string, { en: string; ur: string }> = {
  // Navigation
  dashboard: { en: 'Dashboard', ur: 'ڈیش بورڈ' },
  aiCoach: { en: 'AI Advisor', ur: 'AI مشیر' },
  aiChatbot: { en: 'AI Financial Advisor', ur: 'AI مالیاتی مشیر' },
  transactions: { en: 'Transactions', ur: 'آمدنی و اخراجات' },
  budgets: { en: 'Smart Budgets', ur: 'سمارٹ بجٹ' },
  planner: { en: 'Target & Goals Planner', ur: 'مالیاتی پلانر' },
  goals: { en: 'Savings Goals', ur: 'بچت کے اہداف' },
  scanner: { en: 'Receipt Scanner', ur: 'رسید سکینر' },
  smsSync: { en: 'SMS Sync', ur: 'ایس ایم ایس مطابقت' },
  bills: { en: 'Bills & Utilities', ur: 'بلز اور ادائیگیاں' },
  reports: { en: 'Financial Reports', ur: 'مالیاتی رپورٹس' },
  pricing: { en: 'VIP Membership', ur: 'وی آئی پی ممبرشپ' },
  settings: { en: 'Settings', ur: 'سیٹنگز' },
  admin: { en: 'Admin Panel', ur: 'ایڈمن پینل' },

  // Key Financial Metrics (Top Priority)
  totalIncome: { en: 'Total Income', ur: 'کل آمدنی' },
  totalExpenses: { en: 'Total Expenses', ur: 'کل اخراجات' },
  netSavings: { en: 'Net Savings', ur: 'خالص بچت' },
  savingsRate: { en: 'Savings Rate', ur: 'بچت کی شرح' },
  monthlyBudget: { en: 'Monthly Budget Limit', ur: 'ماہانہ بجٹ کی حد' },
  dailySpendingLimit: { en: 'Safe Daily Spending', ur: 'یومیہ خرچ کی حد' },
  cashRunway: { en: 'Financial Runway', ur: 'مالیاتی تسلسل' },

  // Actions
  addTransaction: { en: '+ Add Transaction', ur: '+ نیا اندراج' },
  addExpense: { en: '+ Add Expense', ur: '+ خرچ درج کریں' },
  addIncome: { en: '+ Add Income', ur: '+ آمدنی درج کریں' },
  voiceInput: { en: 'Voice Expense', ur: 'صوتی خرچ' },
  scanReceipt: { en: 'Scan Receipt', ur: 'رسید سکین کریں' },
  smsImport: { en: 'SMS Quick Logger', ur: 'فوری ایس ایم ایس' },
  exportReport: { en: 'Download Statement', ur: 'سٹیٹمنٹ ڈاؤن لوڈ' },
  askAi: { en: 'Ask AI Advisor', ur: 'AI سے مشورہ لیں' },
  send: { en: 'Send', ur: 'بھیجیں' },
  clear: { en: 'Clear', ur: 'صاف کریں' },

  // Common
  welcomeBack: { en: 'Welcome back', ur: 'خوش آمدید' },
  activeAccount: { en: 'Active Account', ur: 'فعال کھاتہ' },
  personalAndBusiness: { en: 'Personal & Business Finance', ur: 'ذاتی و کاروباری مالیات' },
  allUsersWelcome: { en: 'Designed for Everyone: Freelancers, Businesses & Individuals', ur: 'ہر صارف، فری لانسر اور کاروبار کے لیے سمارٹ نظام' },
  recentTransactions: { en: 'Recent Transactions', ur: 'حالیہ لین دین' },
  viewAll: { en: 'View All', ur: 'تمام دیکھیں' },
  noTransactions: { en: 'No transactions recorded yet', ur: 'ابھی تک کوئی لین دین درج نہیں ہوا' },
  budgetStatus: { en: 'Budget Status', ur: 'بجٹ کی صورتحال' },
  quickExpensePills: { en: '1-Tap Quick Expenses', ur: 'ایک کلک پر فوری خرچ' },
  simulateSmsPlaceholder: { en: 'Paste SMS (e.g. Paid Rs 850 at Metro via JazzCash)', ur: 'بینک یا ایزی پیسہ کا ایس ایم ایس یہاں پیسٹ کریں' },
  logSms: { en: 'Log SMS', ur: 'اندراج کریں' },
  aiChatPlaceholder: { en: 'Ask anything about your money, expenses, or savings...', ur: 'اپنی آمدنی، اخراجات یا بچت کے بارے میں کوئی بھی سوال پوچھیں...' },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('paisatrack_lang');
    return saved === 'ur' ? 'ur' : 'en'; // English is default as requested
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('paisatrack_lang', lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ur' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].en;
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
