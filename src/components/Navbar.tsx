import React, { useState } from 'react';
import { User } from '../types';
import { Logo } from './Logo';
import { useLanguage } from '../context/LanguageContext';
import {
  Plus,
  Mic,
  Camera,
  Bell,
  LogOut,
  User as UserIcon,
  Crown,
  ChevronDown,
  Sparkles,
  Smartphone,
  Globe,
  Check,
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onOpenQuickAdd: (type?: 'expense' | 'income') => void;
  onOpenVoice: () => void;
  onOpenScanner: () => void;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenQuickAdd,
  onOpenVoice,
  onOpenScanner,
  onNavigate,
  onLogout,
  onOpenAuth,
  activeView,
}) => {
  const { language, toggleLanguage, setLanguage } = useLanguage();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="cursor-pointer shrink-0" onClick={() => onNavigate(user ? 'dashboard' : 'landing')}>
          <Logo />
        </div>

        {/* Center / Quick status for authenticated user */}
        {user ? (
          <div className="hidden md:flex items-center gap-5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">
                {language === 'en' ? 'Active Ledger' : 'فعال کھاتہ'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">PKR ({user.currency || 'PKR'})</span>
            </div>

            <button
              onClick={() => onNavigate('coach')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'coach'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 group-hover:text-emerald-700" />
              <span>{language === 'en' ? 'AI Financial Advisor' : 'AI فنانس مشیر'}</span>
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('landing')}
              className="hover:text-emerald-600 transition-colors font-semibold"
            >
              {language === 'en' ? 'Features' : 'خصوصیات'}
            </button>
            <button
              onClick={() => onNavigate('subscriptions')}
              className="hover:text-emerald-600 transition-colors"
            >
              {language === 'en' ? 'Pricing & VIP' : 'پلانز و ممبرشپ'}
            </button>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
              {language === 'en' ? 'Universal Personal & Business Wealth Platform' : 'ذاتی و کاروباری حساب کتاب برائے ہر صارف'}
            </span>
          </div>
        )}

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Prominent Language Switcher Button (English / Urdu as user wishes!) */}
          <div className="relative">
            <button
              onClick={toggleLanguage}
              title={language === 'en' ? 'Click to switch to Urdu (اردو میں دیکھیں)' : 'Click to switch to English'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-xs font-bold transition-all shadow-2xs hover:border-slate-300 active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span className={language === 'en' ? 'text-indigo-600 font-black' : 'text-slate-400'}>EN</span>
              <span className="text-slate-300 font-normal">/</span>
              <span className={language === 'ur' ? 'text-emerald-700 font-black' : 'text-slate-400'}>اردو</span>
            </button>
          </div>

          {user ? (
            <>
              {/* Voice Entry Shortcut */}
              <button
                onClick={onOpenVoice}
                title={language === 'en' ? 'Voice Expense Entry' : 'صوتی خرچ لاگر'}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors relative"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* CamScanner Shortcut */}
              <button
                onClick={onOpenScanner}
                title={language === 'en' ? 'Scan Receipt with CamScanner' : 'رسید سکینر'}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>

              {/* Mobile SMS Sync Shortcut */}
              <button
                onClick={() => onNavigate('sms')}
                title={language === 'en' ? 'Mobile SMS Sync' : 'ایس ایم ایس مطابقت'}
                className={`p-2 rounded-lg transition-colors relative ${
                  activeView === 'sms'
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </button>

              {/* Add Transaction Button */}
              <button
                onClick={() => onOpenQuickAdd('expense')}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {language === 'en' ? '+ Add Transaction' : '+ نیا اندراج'}
                </span>
                <span className="sm:hidden">
                  {language === 'en' ? 'Add' : '+'}
                </span>
              </button>

              {/* Notifications Toggle */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
                </button>

                {notificationsOpen && (
                  <div
                    onClick={() => setNotificationsOpen(false)}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {language === 'en' ? 'Notifications' : 'اطلاعات'}
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {language === 'en' ? '2 New' : '2 نئی'}
                      </span>
                    </div>
                    <div className="space-y-3 py-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                        <div className="font-bold text-emerald-900">
                          {language === 'en' ? 'AI Financial Advisor Active' : 'AI فنانس مشیر فعال ہے'}
                        </div>
                        <div className="text-slate-500 mt-0.5 text-[11px]">
                          {language === 'en'
                            ? 'Your monthly income and expense tracking is synchronized.'
                            : 'آپ کی ماہانہ آمدنی اور اخراجات کا ریکارڈ اپ ٹو ڈیٹ ہے۔'}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="font-bold text-slate-800">
                          {language === 'en' ? 'Account Verified' : 'کھاتہ تصدیق شدہ'}
                        </div>
                        <div className="text-slate-500 mt-0.5 text-[11px]">
                          {user.email || 'ahmadmhaseeb88@gmail.com'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs ring-2 ring-indigo-500/20">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                </button>

                {profileDropdownOpen && (
                  <div
                    onClick={() => setProfileDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-semibold text-slate-900 truncate">{user.name}</div>
                      <div className="text-xs text-slate-500 truncate">{user.email || 'ahmadmhaseeb88@gmail.com'}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          user.plan === 'pro'
                            ? 'bg-purple-100 text-purple-700'
                            : user.plan === 'premium'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {user.plan} Plan
                        </span>
                        <span className="text-[10px] text-slate-400">· {user.currency || 'PKR'}</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => onNavigate('settings')}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        {language === 'en' ? 'Account & Profile' : 'پروفائل و سیٹنگز'}
                      </button>

                      <button
                        onClick={() => onNavigate('subscriptions')}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        {language === 'en' ? 'Upgrade / VIP Plans' : 'وی آئی پی پلانز'}
                      </button>

                      {(user.role === 'admin' || user.email?.toLowerCase().trim() === 'ahmadmhaseeb88@gmail.com') && (
                        <button
                          onClick={() => onNavigate('admin')}
                          className="w-full text-left px-4 py-2 text-xs text-indigo-700 hover:bg-indigo-50 font-medium flex items-center gap-2"
                        >
                          <ShieldIcon className="w-3.5 h-3.5 text-indigo-600" />
                          {language === 'en' ? 'Users & Admin Console' : 'صارفین و ایڈمن کنٹرول'}
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {language === 'en' ? 'Sign Out' : 'لاگ آؤٹ'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {language === 'en' ? 'Sign In' : 'لاگ ان'}
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
              >
                {language === 'en' ? 'Get Started' : 'شروع کریں'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
