import React, { useState, useEffect } from 'react';
import { DashboardSummary, User, Transaction } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Target,
  Sparkles,
  CalendarCheck,
  Plus,
  Mic,
  Camera,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Printer,
  Send,
  CreditCard,
  Copy,
  Check,
  Zap,
  TrendingUp,
  RefreshCw,
  MessageSquare,
  Bot,
  HelpCircle,
  ShieldCheck,
  Globe,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  user: User;
  onOpenQuickAdd: (type?: 'expense' | 'income') => void;
  onOpenVoice: () => void;
  onOpenScanner: () => void;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onOpenQuickAdd,
  onOpenVoice,
  onOpenScanner,
  onNavigate,
}) => {
  const { language, toggleLanguage } = useLanguage();
  const isEn = language === 'en';

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Digital VIP card toggle & copy state
  const [showDigitalCard, setShowDigitalCard] = useState(false);
  const [cardTapped, setCardTapped] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Quick SMS logger state
  const [quickSmsText, setQuickSmsText] = useState('');
  const [quickSmsProcessing, setQuickSmsProcessing] = useState(false);
  const [quickSmsSuccess, setQuickSmsSuccess] = useState<string | null>(null);

  // Home Integrated AI Chatbot State
  const [homeChatMessages, setHomeChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: isEn
        ? `Hello ${user.name}! I am your AI Financial Advisor. Your income, expenses, and savings are live and up to date. Ask me any question like: "How much did I spend this month?" or "How can I increase my savings?"`
        : `سلام ${user.name}! میں آپ کا سمارٹ AI مالیاتی مشیر ہوں۔ آپ کا کھاتہ لائیو اپ ٹو ڈیٹ ہے۔ کوئی بھی سوال پوچھیں، مثلاً: "میرا اس مہینے کتنا خرچ ہوا؟" یا "بچت کیسے بڑھاؤں؟"`,
    },
  ]);
  const [homeChatInput, setHomeChatInput] = useState('');
  const [homeChatLoading, setHomeChatLoading] = useState(false);

  // Update initial AI greeting when language changes if only 1 message
  useEffect(() => {
    setHomeChatMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'assistant') {
        return [
          {
            sender: 'assistant',
            text: isEn
              ? `Hello ${user.name}! I am your AI Financial Advisor. Your income, expenses, and savings are live and up to date. Ask me any question like: "How much did I spend this month?" or "How can I increase my savings?"`
              : `سلام ${user.name}! میں آپ کا سمارٹ AI مالیاتی مشیر ہوں۔ آپ کا کھاتہ لائیو اپ ٹو ڈیٹ ہے۔ کوئی بھی سوال پوچھیں، مثلاً: "میرا اس مہینے کتنا خرچ ہوا؟" یا "بچت کیسے بڑھاؤں؟"`,
          },
        ];
      }
      return prev;
    });
  }, [isEn, user.name]);

  const fetchSummary = async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardSummary(month);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedMonth);
  }, [selectedMonth]);

  const currency = summary?.currency || user.currency || 'PKR';
  const formatMoney = (amount: number) => {
    return `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amount).toLocaleString()}`;
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.email || 'ahmadmhaseeb88@gmail.com');
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleOneTapExpense = async (amount: number, category: string, description: string) => {
    try {
      await api.createTransaction({
        type: 'expense',
        amount,
        category,
        description,
        payment_method: 'Cash',
        date: new Date().toISOString().split('T')[0],
      });
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.85 } });
      setQuickSmsSuccess(
        isEn
          ? `✓ Logged ${currency} ${amount} for ${description}`
          : `⚡ فورا اندراج ہو گیا: ${currency} ${amount} برائے ${description}`
      );
      fetchSummary(selectedMonth);
      setTimeout(() => setQuickSmsSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.message || (isEn ? 'Failed to log expense' : 'خرچ درج نہیں ہو سکا'));
    }
  };

  const handlePayBillQuick = async (billId: string) => {
    try {
      await api.payBill(billId, true, 'Cash');
      fetchSummary(selectedMonth);
    } catch (err: any) {
      alert(err.message || (isEn ? 'Failed to pay bill' : 'بل ادا نہیں ہو سکا'));
    }
  };

  const handleQuickSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSmsText.trim()) return;
    setQuickSmsProcessing(true);
    setQuickSmsSuccess(null);
    try {
      const res = await api.simulateSms(quickSmsText, user.phone_number);
      if (res.success) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
        setQuickSmsSuccess(
          res.message || (isEn ? 'SMS parsed and logged to ledger successfully!' : 'ایس ایم ایس کامیابی سے محفوظ ہو گیا!')
        );
        setQuickSmsText('');
        fetchSummary(selectedMonth);
        setTimeout(() => setQuickSmsSuccess(null), 5000);
      }
    } catch (err: any) {
      alert(err.message || (isEn ? 'Failed to process SMS' : 'ایس ایم ایس پروسیس نہیں ہو سکا'));
    } finally {
      setQuickSmsProcessing(false);
    }
  };

  // AI Chatbot handler with Gemini 2.5 Flash
  const handleSendChat = async (queryText?: string) => {
    const textToSend = (queryText || homeChatInput).trim();
    if (!textToSend || homeChatLoading) return;

    setHomeChatMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setHomeChatInput('');
    setHomeChatLoading(true);

    try {
      const res = await api.askAiChat(
        textToSend,
        homeChatMessages.map((m) => ({
          sender: m.sender === 'user' ? 'user' : 'coach',
          text: m.text,
        }))
      );
      if (res?.reply) {
        setHomeChatMessages((prev) => [...prev, { sender: 'assistant', text: res.reply }]);
      } else {
        throw new Error('No reply received');
      }
    } catch {
      // Clean fallback with real numbers
      let fallback = '';
      const q = textToSend.toLowerCase();
      if (q.includes('income') || q.includes('aamdani')) {
        fallback = isEn
          ? `Your total income this month is **${formatMoney(summary?.monthIncome || 0)}**. Cashflow is positive and active.`
          : `آپ کی اس مہینے کی کل آمدنی **${formatMoney(summary?.monthIncome || 0)}** ہے۔ کیش فلو مثبت ہے۔`;
      } else if (q.includes('expense') || q.includes('kharch') || q.includes('spending')) {
        fallback = isEn
          ? `Your total expenses this month stand at **${formatMoney(summary?.monthExpense || 0)}**. You have utilized ${
              summary?.monthIncome ? Math.round(((summary.monthExpense || 0) / summary.monthIncome) * 100) : 0
            }% of your monthly income.`
          : `اس مہینے آپ کا کل خرچہ **${formatMoney(summary?.monthExpense || 0)}** ہو چکا ہے۔`;
      } else if (q.includes('saving') || q.includes('bachat')) {
        const net = Math.max(0, (summary?.monthIncome || 0) - (summary?.monthExpense || 0));
        fallback = isEn
          ? `You have a net savings of **${formatMoney(net)}** remaining this month. Your total cash balance in the vault is **${formatMoney(summary?.totalBalance || 0)}**.`
          : `اس مہینے آپ کے پاس **${formatMoney(net)}** کی خالص بچت باقی ہے۔`;
      } else {
        fallback = isEn
          ? `Your financial ledger summary: Total Balance is **${formatMoney(summary?.totalBalance || 0)}**, Total Income is **${formatMoney(
              summary?.monthIncome || 0
            )}**, and Total Expenses are **${formatMoney(summary?.monthExpense || 0)}**.`
          : `آپ کا موجودہ بیلنس **${formatMoney(summary?.totalBalance || 0)}** ہے۔ آمدنی **${formatMoney(summary?.monthIncome || 0)}** اور خرچہ **${formatMoney(summary?.monthExpense || 0)}** ہے۔`;
      }
      setHomeChatMessages((prev) => [...prev, { sender: 'assistant', text: fallback }]);
    } finally {
      setHomeChatLoading(false);
    }
  };

  // Financial health & velocity metrics
  const currentDay = Math.min(new Date().getDate(), 30);
  const daysRemaining = Math.max(1, 30 - currentDay);
  const dailyBurn = summary && currentDay > 0 ? Math.round(summary.monthExpense / currentDay) : 0;
  const safeDailyBudget =
    summary && daysRemaining > 0 ? Math.round(Math.max(0, summary.remainingBudget) / daysRemaining) : 0;

  // Net Savings calculation
  const netSavings = summary ? summary.monthIncome - summary.monthExpense : 0;
  const savingsRate =
    summary && summary.monthIncome > 0 ? Math.max(0, Math.round((netSavings / summary.monthIncome) * 100)) : 0;

  const smsPresets = isEn
    ? [
        { label: 'EasyPaisa Chai', text: 'Rs. 250 sent to Cafe on EasyPaisa. Balance Rs 18,500' },
        { label: 'JazzCash Superstore', text: 'Paid Rs 1,200 to Superstore via JazzCash Till. TID: 994821' },
        { label: 'SadaPay Mart', text: 'Rs. 850 spent with SadaPay Card at Mart.' },
        { label: 'Cash Lunch', text: 'Lunch meal 450 cash' },
        { label: 'Salary Inflow', text: 'Received Salary Rs 85,000 via bank transfer' },
      ]
    : [
        { label: 'EasyPaisa چائے/ناشتہ', text: 'Rs. 250 sent to Cafe on EasyPaisa. Balance Rs 18,500' },
        { label: 'JazzCash دکان', text: 'Paid Rs 1,200 to Superstore via JazzCash Till. TID: 994821' },
        { label: 'SadaPay کارڈ', text: 'Rs. 850 spent with SadaPay Card at Mart.' },
        { label: 'نقد کھانا (Cash)', text: 'Khana lunch 450 cash' },
        { label: 'ماہانہ تنخواہ (Salary)', text: 'Received Salary Rs 85000 bank transfer' },
      ];

  const quickQuestions = isEn
    ? [
        'Give me a summary of this month expenses',
        'How can I increase my savings rate?',
        'How much did I spend on food and dining?',
        'Where can I cut unnecessary expenses?',
      ]
    : [
        'اس مہینے کے اخراجات کا خلاصہ بتائیں',
        'Main har mahine bachat kaise barhaon?',
        'Khane aur chai pe kitna kharch hua?',
        'Kahan se kharcha kam kiya ja sakta hai?',
      ];

  if (loading && !summary) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 mt-3 font-semibold">
          {isEn ? 'Loading financial ledger...' : 'حساب کتاب لوڈ ہو رہا ہے...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Top Controls (Clean, Professional, Zero Fluff) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isEn ? `Welcome back, ${user.name}!` : `خوش آمدید، ${user.name}!`}
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {isEn ? 'Active Ledger' : 'فعال کھاتہ'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isEn
              ? 'Real-time Personal & Business Finance Platform · All-in-One Ledger'
              : 'ذاتی و کاروباری کھاتہ کا لائیو ڈیش بورڈ · Live Financial Pulse'}
          </p>
        </div>

        {/* Action Controls Cluster */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Switcher Button (English / Urdu Toggle - User's choice!) */}
          <button
            onClick={toggleLanguage}
            title={isEn ? 'Click to switch to Urdu (اردو)' : 'Click to switch to English'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all shadow-2xs hover:border-slate-300"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span className={isEn ? 'text-indigo-600 font-extrabold' : 'text-slate-400'}>EN</span>
            <span className="text-slate-300">|</span>
            <span className={!isEn ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>اردو</span>
          </button>

          {/* VIP Digital Card Preview Toggle */}
          <button
            onClick={() => setShowDigitalCard(!showDigitalCard)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
              showDigitalCard
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-500" />
            <span>{showDigitalCard ? (isEn ? 'Hide Card' : 'کارڈ چھپائیں') : isEn ? 'VIP FinCard' : 'VIP ڈیجیٹل کارڈ'}</span>
          </button>

          {/* Month Picker */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          {/* Family Sharing shortcut */}
          <button
            onClick={() => onNavigate('family')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isEn ? 'Family Sharing' : 'فیملی شیئرنگ'}</span>
          </button>

          {/* Direct + Income button */}
          <button
            onClick={() => onOpenQuickAdd('income')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEn ? '+ Add Income' : '+ آمدنی'}</span>
          </button>

          {/* Direct - Expense button */}
          <button
            onClick={() => onOpenQuickAdd('expense')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEn ? '- Add Expense' : '- خرچہ'}</span>
          </button>
        </div>
      </div>

      {/* 2. THE BIG 3 STATS: PEHLA INCOME, EXPENSE, AUR SAVINGS (PROMINENT AT THE VERY TOP!) */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: TOTAL INCOME (کل آمدنی) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/60 border-2 border-emerald-300/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
                    {isEn ? 'Total Income' : 'کل آمدنی'}
                  </span>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {isEn ? 'Received deposits & revenue' : 'اس مہینے موصول شدہ رقم'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {isEn ? '+ Inflow' : '+ آمدنی'}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight font-mono">
                {formatMoney(summary.monthIncome)}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-100/80 text-xs">
                <span className="text-slate-600 font-medium">
                  {isEn ? 'Total incoming cashflow' : 'مجموعی آمدنی'}
                </span>
                <button
                  onClick={() => onOpenQuickAdd('income')}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
                >
                  {isEn ? '+ Add Income' : 'نئی رقم شامل کریں +'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: TOTAL EXPENSES (کل اخراجات) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 via-white to-rose-50/60 border-2 border-rose-300/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/20">
                  <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-rose-800">
                    {isEn ? 'Total Expenses' : 'کل اخراجات'}
                  </span>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {isEn ? 'Total spending & outflows' : 'اس مہینے کا مجموعی خرچہ'}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {isEn ? '- Outflow' : '- خرچہ'}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-rose-700 tracking-tight font-mono">
                {formatMoney(summary.monthExpense)}
              </div>
              {/* Spending percentage bar */}
              <div className="mt-3 pt-3 border-t border-rose-100/80">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-1.5">
                  <span>{isEn ? 'Income utilized:' : 'آمدنی کا خرچ شدہ حصہ:'}</span>
                  <span className="font-bold text-rose-700 font-mono">
                    {summary.monthIncome > 0
                      ? `${Math.round((summary.monthExpense / summary.monthIncome) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all"
                    style={{
                      width: `${summary.monthIncome > 0 ? Math.min(100, Math.round((summary.monthExpense / summary.monthIncome) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: NET SAVINGS & BALANCE (خالص بچت اور بیلنس) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-white to-sky-50/60 border-2 border-indigo-300/80 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Wallet className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-900">
                    {isEn ? 'Net Savings' : 'خالص بچت'}
                  </span>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {isEn ? 'Saved cash & reserve balance' : 'موجودہ محفوظ شدہ رقم'}
                  </div>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  netSavings >= 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}
              >
                {netSavings >= 0
                  ? isEn
                    ? `🟢 ${savingsRate}% Saved`
                    : `🟢 ${savingsRate}% بچت`
                  : isEn
                  ? '⚠️ Deficit'
                  : '⚠️ خسارہ'}
              </span>
            </div>

            <div className="mt-4">
              <div
                className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${
                  netSavings >= 0 ? 'text-indigo-900' : 'text-rose-700'
                }`}
              >
                {formatMoney(netSavings)}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-indigo-100/80 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">
                  {isEn ? 'Vault Balance:' : 'کل بیلنس:'}{' '}
                  <span className="text-indigo-700 font-mono font-bold">{formatMoney(summary.totalBalance)}</span>
                </span>
                <button
                  onClick={() => onNavigate('goals')}
                  className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-md font-bold transition-colors"
                >
                  {isEn ? `Goals: ${formatMoney(summary.totalSavedSoFar)}` : `بچت اہداف: ${formatMoney(summary.totalSavedSoFar)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. INTEGRATED AI FINANCIAL ASSISTANT & CHATBOT (HOME PAGE AI CHATBOT) */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-5 sm:p-6 shadow-xl border border-slate-800/90 relative overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                <Bot className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base tracking-tight">
                    {isEn ? 'PaisaTrack AI Financial Advisor' : 'PaisaTrack AI · ذہین مالیاتی مشیر'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Gemini 2.5 Flash
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isEn
                    ? 'Ask any question about your spending, income, savings, or budgets in plain English or Urdu'
                    : 'اپنے کھاتے سے متعلق کوئی بھی سوال انگلش یا اردو میں پوچھیں'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('coach')}
              className="self-start sm:self-auto text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>{isEn ? 'Full AI Coach View' : 'مکمل AI تجزیہ کھولیں'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">
              {isEn ? 'Quick questions:' : 'فوری سوالات:'}
            </span>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendChat(q)}
                disabled={homeChatLoading}
                className="text-xs font-medium px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-400/40 text-slate-200 hover:text-emerald-300 transition-all text-left"
              >
                💡 {q}
              </button>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div className="max-h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {homeChatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-xl whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-white/10 text-slate-100 rounded-tl-xs border border-white/10'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {homeChatLoading && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isEn ? 'PaisaTrack AI is analyzing your ledger...' : 'PaisaTrack AI حساب کتاب چیک کر رہا ہے...'}</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="flex items-center gap-2 pt-2 border-t border-white/10"
          >
            <input
              type="text"
              value={homeChatInput}
              onChange={(e) => setHomeChatInput(e.target.value)}
              placeholder={
                isEn
                  ? 'Ask anything, e.g. "How much did I spend on food this month?" or "How can I cut expenses?"'
                  : 'مثلا: اس مہینے چائے اور کھانے پر کتنا لگا؟ یا بچت کیسے بڑھاؤں؟'
              }
              className="flex-1 text-xs px-4 py-3 rounded-2xl bg-white/10 border border-white/15 focus:border-emerald-400 focus:bg-white/15 text-white placeholder:text-slate-400 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={onOpenVoice}
              title={isEn ? 'Voice Expense Entry' : 'صوتی خرچ درج کریں'}
              className="p-3 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-2xl transition-colors shrink-0"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!homeChatInput.trim() || homeChatLoading}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isEn ? 'Ask AI' : 'پوچھیں'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* 4. OPTIONAL VIP DIGITAL FINCARD (Modern, Clean, Zero University Restrictions) */}
      {showDigitalCard && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-slate-800 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Card Left: User Identity */}
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-xl flex items-center justify-center shadow-md">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">
                    PAISATRACK VIP MEMBER · VERIFIED
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    {user.name}
                  </h2>
                  <div className="text-xs text-slate-300 font-medium">
                    {user.email || 'ahmadmhaseeb88@gmail.com'}
                  </div>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">ACCOUNT HOLDER</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-slate-100">{user.name}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">PRIMARY EMAIL</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="font-mono font-semibold text-slate-200 truncate text-[11px]" title={user.email}>
                      {user.email || 'ahmadmhaseeb88@gmail.com'}
                    </span>
                    <button
                      onClick={handleCopyId}
                      className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                      title="Copy Email"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">CURRENCY</span>
                  <span className="font-bold text-slate-100 mt-0.5 block">{user.currency || 'PKR'}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">ACCOUNT STATUS</span>
                  <span className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isEn ? 'Active Ledger' : 'فعال کھاتہ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Right: Budget Target & Action */}
            <div className="flex flex-col sm:flex-row md:flex-col justify-between items-start md:items-end gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                  {isEn ? 'Monthly Budget Target' : 'ماہانہ ہدف بجٹ'}
                </span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  {formatMoney(user.monthly_budget || 50000)}
                </span>
              </div>

              <button
                onClick={() => {
                  setCardTapped(true);
                  confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
                  setTimeout(() => setCardTapped(false), 2500);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{cardTapped ? (isEn ? '✓ Card Verified!' : '✓ تصدیق شدہ کارڈ!') : isEn ? 'Verify Digital Card' : 'NFC کارڈ چیک کریں'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 1-TAP FAST EVERYDAY EXPENSE LOGGERS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              {isEn ? '1-Tap Quick Expenses' : 'فوری روزمرہ اخراجات'}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {isEn ? 'Log common expenses instantly with one click' : 'صرف ایک کلک پر عام روزمرہ خرچہ محفوظ کریں'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => handleOneTapExpense(150, 'Food', isEn ? 'Chai & Snacks' : 'چائے و ناشتہ')}
            className="p-3 rounded-2xl border border-slate-200/70 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">☕</span>
              <span className="text-xs font-black text-slate-900 group-hover:text-amber-800 font-mono">Rs 150</span>
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1 truncate">
              {isEn ? 'Chai & Snack' : 'چائے و ناشتہ'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Tea & bakery</div>
          </button>

          <button
            onClick={() => handleOneTapExpense(450, 'Food', isEn ? 'Lunch & Dining' : 'دوپہر/رات کھانا')}
            className="p-3 rounded-2xl border border-slate-200/70 bg-slate-50 hover:bg-orange-50 hover:border-orange-300 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🍛</span>
              <span className="text-xs font-black text-slate-900 group-hover:text-orange-800 font-mono">Rs 450</span>
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1 truncate">
              {isEn ? 'Lunch / Dining' : 'کھانا (Lunch)'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Hotel / cafe</div>
          </button>

          <button
            onClick={() => handleOneTapExpense(500, 'Transport', isEn ? 'Fuel & Commute' : 'پیٹرول و سفر')}
            className="p-3 rounded-2xl border border-slate-200/70 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">⛽</span>
              <span className="text-xs font-black text-slate-900 group-hover:text-blue-800 font-mono">Rs 500</span>
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1 truncate">
              {isEn ? 'Fuel / Travel' : 'سفر / پیٹرول'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Fuel & ride</div>
          </button>

          <button
            onClick={() => handleOneTapExpense(1200, 'Grocery', isEn ? 'Groceries & Mart' : 'سودا سلف و راشن')}
            className="p-3 rounded-2xl border border-slate-200/70 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">🛒</span>
              <span className="text-xs font-black text-slate-900 group-hover:text-emerald-800 font-mono">Rs 1,200</span>
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1 truncate">
              {isEn ? 'Groceries' : 'راشن و سودا'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Daily essentials</div>
          </button>

          <button
            onClick={() => handleOneTapExpense(300, 'Bills & Utilities', isEn ? 'Mobile Balance' : 'موبائل لوڈ')}
            className="p-3 rounded-2xl border border-slate-200/70 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">📱</span>
              <span className="text-xs font-black text-slate-900 group-hover:text-purple-800 font-mono">Rs 300</span>
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1 truncate">
              {isEn ? 'Mobile Load' : 'موبائل لوڈ'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Data bundle</div>
          </button>

          <button
            onClick={() => handleOneTapExpense(2500, 'Bills & Utilities', isEn ? 'Utility Bill' : 'بجلی / گیس بل')}
            className="p-3 rounded-2xl border border-slate-200/70 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">💡</span>
              <span className="text-xs font-black text-slate-900 group-hover:text-rose-800 font-mono">Rs 2,500</span>
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1 truncate">
              {isEn ? 'Utility Bill' : 'بجلی / گیس بل'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Monthly bills</div>
          </button>
        </div>
      </div>

      {/* 6. MOBILE SMS & BANK ALERT LOGGER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/80 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                {isEn ? 'Mobile SMS & Bank Alert Quick Logger' : 'موبائل ایس ایم ایس اور بینک الرٹ لاگر'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                EasyPaisa · JazzCash · SadaPay · Banks
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEn
                ? 'Paste any transactional SMS or bank notification to auto-extract amount and category'
                : 'کوئی بھی ایس ایم ایس یا بینک میسج پیسٹ کریں، سسٹم فورا خرچ اور کیٹیگری نکال لے گا'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('sms')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 shrink-0 self-start sm:self-auto"
          >
            <span>{isEn ? 'SMS Settings' : 'SMS سیٹنگز کھولیں'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Presets */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
            {isEn ? 'Quick presets:' : 'ٹیسٹ نمونے:'}
          </span>
          {smsPresets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuickSmsText(p.text)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200/80 text-slate-700 hover:text-emerald-700 transition-colors shadow-2xs"
            >
              ⚡ {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleQuickSmsSubmit} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={quickSmsText}
            onChange={(e) => setQuickSmsText(e.target.value)}
            placeholder={
              isEn
                ? 'Paste SMS here, e.g. "Paid Rs. 1,200 at Metro via JazzCash" or "Sent Rs. 450 to Cafe"'
                : 'یہاں ایس ایم ایس پیسٹ کریں... مثلاً "Rs. 450 sent to Superstore on EasyPaisa"'
            }
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono"
          />
          <button
            type="submit"
            disabled={!quickSmsText.trim() || quickSmsProcessing}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{quickSmsProcessing ? (isEn ? 'Saving...' : 'محفوظ ہو رہا ہے...') : isEn ? 'Save' : 'محفوظ کریں'}</span>
          </button>
        </form>

        {quickSmsSuccess && (
          <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{quickSmsSuccess}</span>
          </div>
        )}
      </div>

      {/* 6B. FAMILY SHARING HUB QUICK BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-white to-violet-50/80 border border-indigo-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isEn ? 'Family Sharing & Household Hub' : 'فیملی شیئرنگ اور مشترکہ بجٹ'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {isEn ? 'Shared Budgets & Vaults' : 'مشترکہ کھاتہ'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEn
                ? 'Invite family members, set monthly spending allowances, split household bills equally, and track shared savings goals.'
                : 'خاندان کے افراد کو مدعو کریں، ماہانہ خرچ کی حد مقرر کریں، بل تقسیم کریں اور مشترکہ بچت اہداف بنائیں۔'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('family')}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <span>{isEn ? 'Open Family Hub' : 'فیملی ہب کھولیں'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 7. CHARTS & CATEGORY DISTRIBUTION */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily spending timeline chart (2 cols) */}
          <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isEn ? '30-Day Spending Timeline' : '30 روزہ اخراجات کا گراف'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isEn ? 'Daily expenses and cash outflow this month' : 'اس مہینے کے روزانہ کے اخراجات اور آمدنی'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {isEn ? 'Expense' : 'خرچہ'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {isEn ? 'Income' : 'آمدنی'}
                </span>
              </div>
            </div>

            {/* Visual Timeline Bars */}
            <div className="h-44 flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-slate-100">
              {summary.dailySpending && summary.dailySpending.length > 0 ? (
                summary.dailySpending.map((dayItem, idx) => {
                  const maxAmt = Math.max(1, ...summary.dailySpending.map((d) => d.expense));
                  const heightPercent = Math.max(8, Math.min(100, Math.round((dayItem.expense / maxAmt) * 100)));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-20 font-mono shadow-md">
                        Day {dayItem.day}: {formatMoney(dayItem.expense)}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all group-hover:opacity-80 ${
                          dayItem.expense > 0 ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-xs' : 'bg-slate-100'
                        }`}
                      />
                      <span className="text-[9px] text-slate-400 font-mono">
                        {idx % 4 === 0 ? dayItem.day : ''}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  {isEn ? 'No timeline data for this month' : 'اس مہینے کا کوئی ڈیٹا دستیاب نہیں'}
                </div>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">
                  {isEn ? 'AVG DAILY SPEND' : 'اوسط یومیہ خرچ'}
                </span>
                <span className="font-extrabold text-slate-800 font-mono">{formatMoney(dailyBurn)}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">
                  {isEn ? 'SAFE DAILY LIMIT' : 'محفوظ یومیہ حد'}
                </span>
                <span className="font-extrabold text-emerald-700 font-mono">{formatMoney(safeDailyBudget)}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">
                  {isEn ? 'DAYS REMAINING' : 'باقی دن'}
                </span>
                <span className="font-extrabold text-indigo-700 font-mono">{daysRemaining} {isEn ? 'Days' : 'دن'}</span>
              </div>
            </div>
          </div>

          {/* Category distribution (1 col) */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isEn ? 'Expenses by Category' : 'کیٹیگری کے لحاظ سے خرچ'}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {summary.categoryBreakdown?.length || 0} {isEn ? 'items' : 'اقسام'}
                </span>
              </div>

              <div className="space-y-3">
                {summary.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                  summary.categoryBreakdown.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-900 font-bold">{formatMoney(cat.amount)}</span>
                          <span className="text-[10px] text-slate-400 font-mono w-7 text-right">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {isEn ? 'No categorized expenses yet' : 'کوئی اخراجات درج نہیں'}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigate('transactions')}
              className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{isEn ? 'View Full Ledger' : 'مکمل کھاتہ دیکھیں'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 8. RECENT TRANSACTIONS TABLE */}
      {summary && (
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isEn ? 'Recent Transactions' : 'حالیہ لین دین'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEn ? 'Latest financial activity in your account' : 'آپ کے کھاتے کی تازہ ترین سرگرمیاں'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>{isEn ? 'View All Transactions' : 'تمام دیکھیں'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                  <th className="pb-3 px-3">{isEn ? 'Type' : 'نوعیت'}</th>
                  <th className="pb-3 px-3">{isEn ? 'Description' : 'تفصیل'}</th>
                  <th className="pb-3 px-3">{isEn ? 'Category' : 'کیٹیگری'}</th>
                  <th className="pb-3 px-3">{isEn ? 'Payment Method' : 'طریقہ ادائیگی'}</th>
                  <th className="pb-3 px-3">{isEn ? 'Date' : 'تاریخ'}</th>
                  <th className="pb-3 px-3 text-right">{isEn ? 'Amount' : 'رقم'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recentTransactions && summary.recentTransactions.length > 0 ? (
                  summary.recentTransactions.slice(0, 7).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <>
                              <ArrowUpRight className="w-3 h-3" />
                              {isEn ? 'Income' : 'آمدنی'}
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3 h-3" />
                              {isEn ? 'Expense' : 'خرچہ'}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {tx.description}
                        {tx.merchant && <span className="text-slate-400 font-normal"> · {tx.merchant}</span>}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-medium">{tx.payment_method}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{tx.date}</td>
                      <td
                        className={`py-3 px-3 text-right font-black font-mono text-sm ${
                          tx.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {formatMoney(tx.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {isEn ? 'No recent transactions recorded yet' : 'ابھی تک کوئی لین دین درج نہیں ہوا'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
