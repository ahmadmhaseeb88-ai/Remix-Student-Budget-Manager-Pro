import React, { useEffect, useState } from 'react';
import { Logo } from '../components/Logo';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { UsageStats } from '../types';
import {
  Sparkles,
  ScanLine,
  Target,
  ArrowRight,
  CheckCircle2,
  Mic,
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  Smartphone,
  ShieldCheck,
  Globe,
} from 'lucide-react';

interface LandingViewProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onExploreDemo: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenAuth,
  onExploreDemo,
}) => {
  const { language, toggleLanguage } = useLanguage();
  const isEn = language === 'en';
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    api.getUsageStats().then(setUsageStats).catch(() => {});
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-8 text-center max-w-4xl mx-auto px-4">
        {/* Top Tag & Language Button */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isEn
                ? 'Smart Wealth & Ledger Manager for Everyone: Individuals, Freelancers & Businesses'
                : 'ذاتی، گھریلو، کاروباری اور فری لانسنگ کھاتہ کا بہترین مینیجر'}
            </span>
          </div>

          <button
            onClick={toggleLanguage}
            title={isEn ? 'Switch to Urdu' : 'Switch to English'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isEn ? 'Language: English (اردو)' : 'زبان: اردو (English)'}</span>
          </button>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          {isEn ? (
            <>
              Personal & Business Finance <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 bg-clip-text text-transparent">
                Simplified With AI
              </span>
            </>
          ) : (
            <>
              آمدنی، اخراجات اور بچت کا <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 bg-clip-text text-transparent">
                سب سے آسان اور ذہین نظام
              </span>
            </>
          )}
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {isEn
            ? 'Track income, manage daily expenses, and grow your net savings with an intelligent AI financial advisor, receipt scanner, and automated SMS logger.'
            : 'کوئی بھی صارف (ملازمت پیشہ، فری لانسر، کاروباری افراد یا گھریلو صارفین) آمدنی و اخراجات کا حساب کتاب باآسانی رکھ سکتے ہیں بمع AI مالیاتی مشیر۔'}
        </p>

        {/* CTA Button Group */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{isEn ? 'Create Free Account' : 'مفت نیا کھاتہ بنائیں'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-sm px-6 py-3.5 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isEn ? 'Sign In to Your Account' : 'اپنے اکاؤنٹ میں لاگ ان کریں'}</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {isEn ? 'PKR & Multi-Currency' : 'پاکستانی روپیہ سپورٹ'}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {isEn ? 'EasyPaisa & JazzCash SMS Logger' : 'EasyPaisa و JazzCash'}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {isEn ? 'Gemini 2.5 AI Advisor' : 'AI فنانس مشیر'}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {isEn ? 'Export & Print Statements' : 'پی ڈی ایف اسٹیٹمنٹ'}
          </span>
          {usageStats && (
            <span className="flex items-center gap-1.5 text-slate-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isEn
                ? `${usageStats.totalUsers} Users · ${usageStats.activeNow} Online Now`
                : `${usageStats.totalUsers} صارفین · ${usageStats.activeNow} ابھی آن لائن`}
            </span>
          )}
        </div>
      </section>

      {/* Hero Visual Preview: Big 3 Core Metrics */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800">
          <div className="text-center mb-6">
            <span className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider">
              {isEn ? 'Priority Dashboard Display' : 'ڈیش بورڈ پر سب سے پہلے'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              {isEn ? 'Total Income, Total Expenses & Net Savings' : 'کل آمدنی، کل اخراجات اور خالص بچت'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
              <span className="text-[11px] text-emerald-400 font-bold block">
                {isEn ? 'Total Income' : 'کل آمدنی'}
              </span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">Rs 95,000</span>
              <span className="text-[10px] text-slate-300 mt-1 block">
                {isEn ? '+ Monthly Inflow' : '+ ماہانہ آمدنی'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
              <span className="text-[11px] text-rose-400 font-bold block">
                {isEn ? 'Total Expenses' : 'کل اخراجات'}
              </span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">Rs 38,450</span>
              <span className="text-[10px] text-slate-300 mt-1 block">
                {isEn ? '- Monthly Outflows' : '- ماہانہ اخراجات'}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
              <span className="text-[11px] text-sky-400 font-bold block">
                {isEn ? 'Net Savings' : 'خالص بچت'}
              </span>
              <span className="text-2xl font-black text-emerald-300 font-mono mt-1 block">Rs 56,550</span>
              <span className="text-[10px] text-slate-300 mt-1 block">
                {isEn ? '🟢 59.5% Savings Rate' : '🟢 59.5% بچت کی شرح'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {isEn ? 'High-Performance Financial Features' : 'ہر صارف کے لیے جدید ترین فیچرز'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isEn ? 'Clean, fast, and professional without confusing jargon' : 'سادہ، تیز رفتار اور پیشہ ورانہ نظام'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: AI Chatbot */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {isEn ? 'AI Financial Advisor' : 'AI فنانس مشیر'}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {isEn
                  ? 'Ask any question about your spending, find cost-cutting opportunities, and receive smart savings recommendations tailored to your live ledger.'
                  : 'اپنے خرچوں کا خلاصہ پوچھیں، غیر ضروری اخراجات کا پتہ لگائیں اور بچت کا پلان بنائیں۔'}
              </p>
            </div>
            <div className="mt-4 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-950 font-medium">
              💡 {isEn ? '"You spent Rs 4,200 on dining this month. Cutting daily coffee saves Rs 4,500/month."' : '"اس مہینے آپ کا چائے اور کھانے پر 4,200 خرچ ہوا، بچت بڑھانے کے لیے تجاویز موجود ہیں۔"'}
            </div>
          </div>

          {/* Feature 2: 1-Tap Quick Logger */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {isEn ? '1-Tap Quick Expenses' : '1-کلک فوری خرچ'}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {isEn
                  ? 'Chai, food, fuel, groceries, or mobile balance — record routine expenses with a single tap without tedious form filling.'
                  : 'چائے، کھانا، پیٹرول یا راشن — کسی فارم کے بغیر صرف ایک کلک پر خرچہ درج کریں۔'}
              </p>
            </div>
            <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-[11px] text-amber-950 font-medium">
              ⚡ {isEn ? 'Chai Rs 150, Lunch Rs 450, Fuel Rs 500 — logged in 1 second!' : 'چائے 150، لنچ 450، پیٹرول 500 — ایک سیکنڈ میں کھاتہ اپ ڈیٹ!'}
            </div>
          </div>

          {/* Feature 3: CamScanner OCR */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <ScanLine className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {isEn ? 'Receipt Scanner (CamScanner)' : 'رسید سکینر'}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {isEn
                  ? 'Snap a photo of any receipt, bill, or invoice. AI instantly parses total amounts, dates, and items into your ledger.'
                  : 'دکان یا مارٹ کی کاغذی رسید کی تصویر کھینچیں۔ AI خود بخود کل رقم اور اشیاء کھاتے میں ڈال دے گا۔'}
              </p>
            </div>
            <div className="mt-4 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-950 font-medium">
              📄 {isEn ? 'Store digital receipts and generate verified tax statements.' : 'کاغذی بلز محفوظ کریں اور اسٹیٹمنٹ تیار کریں۔'}
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-3xl mx-auto px-4 text-center p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white shadow-xl">
        <Logo className="justify-center mb-4 text-white" />
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          {isEn ? 'Take Full Control of Your Wealth Today' : 'آج ہی اپنے مالیات پر مکمل کنٹرول حاصل کریں'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto">
          {isEn
            ? 'Track every rupee with accuracy, clarity, and peace of mind using PaisaTrack AI.'
            : 'پیسہ ٹریک اے آئی کے ساتھ اپنے پیسے کا محفوظ اور درست حساب رکھیں۔'}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all shadow-md active:scale-95"
          >
            {isEn ? 'Create Free Account' : 'نیا فری اکاؤنٹ بنائیں'}
          </button>
          <button
            onClick={() => onOpenAuth('login')}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl transition-all border border-white/15 active:scale-95"
          >
            {isEn ? 'Sign In to Account' : 'اپنے اکاؤنٹ میں لاگ ان کریں'}
          </button>
        </div>
      </section>
    </div>
  );
};
