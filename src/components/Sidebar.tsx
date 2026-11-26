import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Target,
  ScanLine,
  Sparkles,
  CalendarCheck,
  BarChart3,
  Settings,
  ShieldCheck,
  Crown,
  Smartphone,
  Globe,
  Users,
} from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, user }) => {
  const { language, toggleLanguage } = useLanguage();
  if (!user) return null;

  const isEn = language === 'en';

  const navItems = [
    {
      id: 'dashboard',
      label: isEn ? 'Dashboard' : 'ڈیش بورڈ',
      icon: LayoutDashboard,
    },
    {
      id: 'coach',
      label: isEn ? 'AI Financial Advisor' : 'AI فنانس مشیر',
      icon: Sparkles,
      highlight: true,
      badge: isEn ? 'AI' : 'لائیو',
    },
    {
      id: 'transactions',
      label: isEn ? 'Transactions & Ledger' : 'آمدنی و اخراجات',
      icon: ReceiptText,
    },
    {
      id: 'budgets',
      label: isEn ? 'Smart Budgets' : 'بجٹ کنٹرول',
      icon: PieChart,
    },
    {
      id: 'semester',
      label: isEn ? 'Target & Goals Planner' : 'مالیاتی پلانر',
      icon: Target,
    },
    {
      id: 'goals',
      label: isEn ? 'Savings Vault' : 'بچت کے اہداف',
      icon: Target,
    },
    {
      id: 'family',
      label: isEn ? 'Family Sharing' : 'فیملی شیئرنگ',
      icon: Users,
      badge: isEn ? 'Hub' : 'نیا',
    },
    {
      id: 'camscanner',
      label: isEn ? 'Receipt Scanner' : 'رسید سکینر',
      icon: ScanLine,
    },
    {
      id: 'sms',
      label: isEn ? 'Mobile SMS Sync' : 'موبائل ایس ایم ایس',
      icon: Smartphone,
      badge: 'Auto',
    },
    {
      id: 'bills',
      label: isEn ? 'Bills & Utilities' : 'بل اور ادائیگیاں',
      icon: CalendarCheck,
    },
    {
      id: 'reports',
      label: isEn ? 'Financial Statements' : 'رپورٹس و سٹیٹمنٹ',
      icon: BarChart3,
    },
    {
      id: 'subscriptions',
      label: isEn ? 'VIP Membership' : 'وی آئی پی ممبرشپ',
      icon: Crown,
    },
    {
      id: 'settings',
      label: isEn ? 'Settings' : 'سیٹنگز',
      icon: Settings,
    },
  ];

  const isAdminOrOwner =
    user.role === 'admin' || user.email?.toLowerCase().trim() === 'ahmadmhaseeb88@gmail.com';

  if (isAdminOrOwner) {
    navItems.push({
      id: 'admin',
      label: isEn ? 'Users & Admin' : 'صارفین و ایڈمن',
      icon: ShieldCheck,
      badge: isEn ? 'Live' : 'لائیو',
    });
  }

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white shrink-0 min-h-[calc(100vh-4rem)] p-4">
        {/* User Profile Quick Card */}
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/80 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center text-sm shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.email || 'ahmadmhaseeb88@gmail.com'}</div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400 px-3 mb-2 flex items-center justify-between">
          <span>{isEn ? 'Finances & Tools' : 'مالیاتی مینجمنٹ'}</span>
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            PRO
          </span>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 font-bold'
                    : item.highlight
                    ? 'text-indigo-700 hover:bg-indigo-50 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : item.highlight ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && !isActive && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.highlight ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.highlight && !isActive && !item.badge && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Quick Language Toggle & Platform Note */}
        <div className="pt-3 border-t border-slate-100 mt-auto space-y-2">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isEn ? 'Language (زبان)' : 'زبان (Language)'}</span>
            </div>
            <span className="text-[11px] font-extrabold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
              {isEn ? 'English' : 'اردو'}
            </span>
          </button>

          <div className="px-3 py-1 text-[10px] text-slate-400 text-center font-medium">
            PaisaTrack AI · v2.5 Universal
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-bold ${
            activeView === 'dashboard' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{isEn ? 'Home' : 'ہوم'}</span>
        </button>

        <button
          onClick={() => onNavigate('coach')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-bold ${
            activeView === 'coach' ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <span>{isEn ? 'AI Coach' : 'AI مشیر'}</span>
        </button>

        <button
          onClick={() => onNavigate('transactions')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-bold ${
            activeView === 'transactions' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span>{isEn ? 'Ledger' : 'کھاتہ'}</span>
        </button>

        <button
          onClick={() => onNavigate('budgets')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-bold ${
            activeView === 'budgets' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span>{isEn ? 'Budgets' : 'بجٹ'}</span>
        </button>

        <button
          onClick={() => onNavigate('family')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-bold ${
            activeView === 'family' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>{isEn ? 'Family' : 'فیملی'}</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-bold ${
            activeView === 'settings' ? 'text-indigo-600' : 'text-slate-500'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>{isEn ? 'Settings' : 'سیٹنگز'}</span>
        </button>
      </div>
    </>
  );
};
