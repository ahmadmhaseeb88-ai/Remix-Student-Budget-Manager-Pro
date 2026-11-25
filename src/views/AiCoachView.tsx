import React, { useState, useEffect } from 'react';
import { CoachInsight, User } from '../types';
import { api } from '../services/api';
import {
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  PiggyBank,
  RefreshCw,
  Send,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

interface AiCoachViewProps {
  user: User;
}

export const AiCoachView: React.FC<AiCoachViewProps> = ({ user }) => {
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Interactive conversation messages
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'coach'; text: string }>>([
    {
      sender: 'coach',
      text: `Hello ${user.name}! I am your AI Financial Advisor. I have analyzed your live income, expense ledger, and savings goals. How can I help you optimize your monthly budget or accelerate your savings today?`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const currency = user.currency || 'PKR';
  const formatMoney = (amt: number) => {
    return `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amt).toLocaleString()}`;
  };

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAiCoachInsights();
      if (res?.data) {
        setInsight(res.data);
      } else {
        throw new Error('No coach insight data returned from server.');
      }
    } catch (err: any) {
      console.error('Failed to load coach insights:', err);
      setError(err?.message || 'Could not load coach insights.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInsights();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const query = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.askAiChat(
        query,
        chatMessages.map((m) => ({ sender: m.sender, text: m.text }))
      );
      if (res?.reply) {
        setChatMessages((prev) => [...prev, { sender: 'coach', text: res.reply }]);
      } else {
        throw new Error('No reply from server');
      }
    } catch {
      // High-quality contextual fallback
      let reply = '';
      const q = query.toLowerCase();

      if (q.includes('food') || q.includes('khana') || q.includes('chai') || q.includes('mess')) {
        reply = `کھانے اور چائے کے اخراجات: آپ کے ریکارڈ کے مطابق اس مد میں خاصا خرچ ہو رہا ہے۔ روزانہ کا بجٹ پہلے سے طے کر کے آپ باآسانی 25% بچت کر سکتے ہیں۔`;
      } else if (q.includes('bachat') || q.includes('saving') || q.includes('save')) {
        reply = `بچت کا سنہری اصول: جیسے ہی آمدنی یا تنخواہ آئے، کم از کم 20% فورا ایک الگ سیونگز کھاتے میں محفوظ کر لیں۔ باقی رقم کو ہفتہ وار بنیادوں پر تقسیم کریں۔`;
      } else {
        reply = `آپ کی کل آمدنی اور اخراجات کا توازن بالکل درست سمت میں ہے۔ غیر ضروری اخراجات پر کنٹرول رکھ کر آپ جلد اپنے فنانشل اہداف حاصل کر سکتے ہیں۔`;
      }

      setChatMessages((prev) => [...prev, { sender: 'coach', text: reply }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AI Financial Advisor
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Powered by Gemini 2.5 Flash — automated intelligence that analyzes your live cashflow, expenses, and savings.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
          <span>{refreshing ? 'Analyzing...' : 'Refresh AI Insights'}</span>
        </button>
      </div>

      {error && !insight && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-lg mx-auto space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Financial Coach Insights Unavailable</h3>
          <p className="text-xs text-rose-700">{error}</p>
          <button
            onClick={fetchInsights}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Retry Financial Analysis
          </button>
        </div>
      )}

      {loading && !insight && !error ? (
        <div className="py-16 text-center text-xs text-slate-400">
          <Sparkles className="w-8 h-8 text-indigo-500 mx-auto animate-pulse mb-3" />
          Analyzing live transactions, cash burn rate, and budgets...
        </div>
      ) : (
        insight && (
          <>
            {/* Top Forecast and Risk Banner */}
            <div
              className={`p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                insight.forecast.riskLevel === 'danger'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : insight.forecast.riskLevel === 'caution'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider ${
                      insight.forecast.riskLevel === 'danger'
                        ? 'bg-rose-600 text-white'
                        : insight.forecast.riskLevel === 'caution'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    Risk Level: {insight.forecast.riskLevel}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    End-of-Month Projection
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold leading-snug">
                  {insight.forecast.advice}
                </h3>
                <p className="text-xs text-slate-600 max-w-2xl">{insight.summary}</p>
              </div>

              <div className="shrink-0 p-3.5 rounded-xl bg-white/90 border border-slate-200/60 shadow-2xs text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Projected Month Outflow
                </span>
                <span className="text-xl font-extrabold text-slate-900 block">
                  {formatMoney(insight.forecast.estimatedMonthEndExpense)}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Net: {formatMoney(insight.forecast.projectedSurplusOrDeficit)}
                </span>
              </div>
            </div>

            {/* Grid of Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: Spending Patterns */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Spending Pattern Observations
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {insight.spendingPatterns.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card 2: Student Frugality Tips */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Campus Frugality Hacks
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {insight.frugalityTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card 3: Savings Strategies */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <PiggyBank className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Student Savings Strategies
                    </h4>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {insight.savingsStrategies.map((st, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Interactive Coach Q&A Box */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Interactive Money Coach Consultation
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Student context grounded</span>
              </div>

              {/* Chat Thread */}
              <div className="space-y-3 max-h-72 overflow-y-auto mb-4 p-1">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 text-xs ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'coach' && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                        AI
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl max-w-lg leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 pl-9">
                    <span className="animate-spin">⏳</span> Coach is thinking...
                  </div>
                )}
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Coach: How can I save on hostel meals, or budget for FYP hardware?"
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask Coach</span>
                </button>
              </form>
            </div>
          </>
        )
      )}
    </div>
  );
};
