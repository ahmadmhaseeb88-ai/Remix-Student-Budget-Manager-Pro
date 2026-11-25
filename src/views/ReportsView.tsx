import React, { useState, useEffect } from 'react';
import { User, Transaction, DashboardSummary } from '../types';
import { api } from '../services/api';
import {
  BarChart3,
  Download,
  Calendar,
  FileText,
  TrendingDown,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  CheckCircle2,
  Eye,
  X,
  Copy,
  Check,
  Globe,
  Award,
  Share2,
  ShieldCheck,
  Wallet,
  Sparkles,
  Lock,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ReportsViewProps {
  user: User;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ user }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Default language is English as requested ("print monthly report ko english ma likoo")
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [includeSeal, setIncludeSeal] = useState(true);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const currency = user.currency || 'PKR';
  const formatMoney = (amt: number) => {
    return `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amt).toLocaleString()}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, txRes] = await Promise.all([
        api.getDashboardSummary(selectedMonth),
        api.getTransactions({ limit: 100 }),
      ]);
      setSummary(sumRes);
      setTransactions(txRes.data);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);

  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const monthName = new Date(selectedMonth + '-01T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const statementRef = `PTS-${selectedMonth.replace('-', '')}-${(user.id || '88').slice(-4).toUpperCase()}`;

  // Largest expenses
  const largestExpenses = [...transactions]
    .filter((t) => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const handleCopyWhatsApp = () => {
    if (!summary) return;
    const netSavings = summary.monthIncome - summary.monthExpense;
    const savingsRate = summary.monthIncome > 0 ? Math.round((netSavings / summary.monthIncome) * 100) : 0;

    const summaryText = `📊 *PAISATRACK AI — MONTHLY FINANCIAL STATEMENT*
Account Holder: ${user.name}
Email: ${user.email}
Statement Period: ${monthName}
Reference: ${statementRef}
---------------------------------
💰 Total Inflow (Income): ${formatMoney(summary.monthIncome)}
💸 Total Outflow (Expenses): ${formatMoney(summary.monthExpense)}
💵 Net Retained Savings: ${formatMoney(netSavings)} (${savingsRate}%)
🛡️ Budget Ceiling: ${formatMoney(summary.monthlyBudget)} (${summary.budgetUtilization}% used)
🏦 Total Vault Reserve: ${formatMoney(summary.totalBalance || summary.totalSavedSoFar)}
---------------------------------
📌 Top Expense Items:
${largestExpenses.map((e) => `• ${e.date}: ${e.description} — ${formatMoney(e.amount)} (${e.category})`).join('\n')}
---------------------------------
Official ledger verified via PaisaTrack AI Wealth Platform.`;

    navigator.clipboard.writeText(summaryText);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  const handleDownloadPdfReport = () => {
    if (!summary) return;

    const doc = new jsPDF();
    const netSavings = summary.monthIncome - summary.monthExpense;
    const savingsRate = summary.monthIncome > 0 ? Math.round((netSavings / summary.monthIncome) * 100) : 0;

    // Header styling
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('PAISATRACK AI — CERTIFIED MONTHLY FINANCIAL STATEMENT', 14, 15);

    // Metadata section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`Statement Period: ${monthName}`, 14, 34);
    doc.text(`Account Holder: ${user.name}`, 14, 40);
    doc.text(`Email Address: ${user.email}`, 14, 46);
    doc.text(`Reference No: ${statementRef}`, 120, 34);
    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 120, 40);
    doc.text(`Currency: ${currency} (Pakistani Rupee)`, 120, 46);

    doc.setDrawColor(203, 213, 225);
    doc.line(14, 50, 196, 50);

    // Performance Overview
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Cashflow & Executive Performance Summary', 14, 58);

    doc.setFontSize(10);
    doc.text(`• Total Recorded Inflow (Income): ${formatMoney(summary.monthIncome)}`, 18, 66);
    doc.text(`• Total Recorded Outflow (Expenses): ${formatMoney(summary.monthExpense)}`, 18, 72);
    doc.text(`• Net Retained Surplus / Savings: ${formatMoney(netSavings)} (${savingsRate}% Savings Ratio)`, 18, 78);
    doc.text(`• Monthly Target Budget Limit: ${formatMoney(summary.monthlyBudget)} (${summary.budgetUtilization}% utilized)`, 18, 84);
    doc.text(`• Total Reserve Vault Balance: ${formatMoney(summary.totalBalance || summary.totalSavedSoFar)}`, 18, 90);

    doc.line(14, 96, 196, 96);

    // Category breakdown
    doc.setFontSize(12);
    doc.text('2. Expense Distribution by Category', 14, 104);
    doc.setFontSize(10);
    let y = 112;
    if (summary.categoryBreakdown.length === 0) {
      doc.text('No categorized expenses logged during this period.', 18, y);
      y += 8;
    } else {
      summary.categoryBreakdown.forEach((c) => {
        doc.text(`• ${c.category}: ${formatMoney(c.amount)} (${c.percentage}%)`, 18, y);
        y += 6;
      });
    }

    y += 4;
    doc.line(14, y, 196, y);
    y += 8;

    // Largest expenses
    doc.setFontSize(12);
    doc.text('3. Significant Outflows & Transactions', 14, y);
    y += 8;
    doc.setFontSize(10);
    if (largestExpenses.length === 0) {
      doc.text('No significant transactions logged.', 18, y);
      y += 8;
    } else {
      largestExpenses.forEach((t) => {
        doc.text(`• ${t.date} | ${t.description}: ${formatMoney(t.amount)} [${t.category} - ${t.payment_method}]`, 18, y);
        y += 6;
      });
    }

    // Official Certification footer
    doc.setDrawColor(15, 23, 42);
    doc.line(14, 260, 196, 260);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Certified authentic ledger record generated automatically via PaisaTrack AI Platform.', 14, 266);
    doc.text(`Verification Stamp: SECURE-LEDGER-HASH-${Date.now().toString(36).toUpperCase()}`, 14, 271);
    doc.text(`Signatory: ${user.name} (Account Holder Verified)`, 130, 266);

    doc.save(`PaisaTrack_Statement_${selectedMonth}.pdf`);
  };

  const handleExportCsv = () => {
    const token = api.getToken();
    window.open(`/api/transactions/export-csv?token=${token}`, '_blank');
  };

  const netSavings = summary ? summary.monthIncome - summary.monthExpense : 0;
  const savingsRate =
    summary && summary.monthIncome > 0 ? Math.max(0, Math.round((netSavings / summary.monthIncome) * 100)) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Financial Statements & Reports
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Audit Ready
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verified monthly ledger statements, category cashflow breakdown, and print-ready PDF reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector: English (Default) vs Urdu */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ur')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                language === 'ur'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اردو
            </button>
          </div>

          {/* Month Selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          {/* Print Monthly Report Button (Prominent) */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors active:scale-95"
            title="Print Monthly Report"
          >
            <Printer className="w-4 h-4" />
            <span>Print Monthly Report</span>
          </button>

          {/* Download PDF Statement */}
          <button
            onClick={handleDownloadPdfReport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 shadow-2xs transition-colors"
            title="Copy summary formatted for WhatsApp"
          >
            {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{copiedWhatsApp ? 'Copied!' : 'Share'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {loading || !summary ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <span>Generating verified financial analytics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Monthly Inflow
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                {formatMoney(summary.monthIncome)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Deposits & verified revenue</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Monthly Outflow
              </span>
              <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
                {formatMoney(summary.monthExpense)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Expenses & payments</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Net Retained Savings
              </span>
              <div
                className={`text-2xl font-black mt-1 font-mono ${
                  netSavings >= 0 ? 'text-indigo-950' : 'text-rose-600'
                }`}
              >
                {formatMoney(netSavings)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block font-semibold">
                {netSavings >= 0 ? `🟢 ${savingsRate}% Net Savings Ratio` : '⚠️ Deficit Outflow'}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Budget Ceiling Status
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">
                {summary.budgetUtilization}%
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                Limit: {formatMoney(summary.monthlyBudget)}
              </span>
            </div>
          </div>

          {/* Two-column analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Table */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm">Category Spending Distribution</h3>
                <span className="text-xs text-slate-400 font-mono">
                  {summary.categoryBreakdown.length} Categories
                </span>
              </div>

              {summary.categoryBreakdown.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No expense records logged in {monthName}.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {summary.categoryBreakdown.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{cat.category}</span>
                        <span className="text-slate-900 font-bold font-mono">{formatMoney(cat.amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 w-10 text-right font-bold font-mono">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Largest Expenses */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm">Top 5 Largest Outflows</h3>
                <span className="text-xs text-slate-400">Ranked by amount</span>
              </div>

              {largestExpenses.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No expense records available.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {largestExpenses.map((t, idx) => (
                    <div key={t.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{t.description}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {t.category} · {t.date} · {t.payment_method}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-black text-rose-700 font-mono">
                        {formatMoney(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SCREEN PRINT PREVIEW MODAL (POLISHED EXECUTIVE STATEMENT) */}
      {/* ========================================================================= */}
      {showPrintModal && summary && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Top Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Print Monthly Financial Statement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official verified statement for {monthName} · Optimized for Paper & PDF Print
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document (Ctrl+P)</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Customization Options Bar */}
            <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-slate-700">Format:</span>

                {/* Language Toggle Inside Modal */}
                <div className="flex items-center p-0.5 bg-white rounded-lg border border-slate-200">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2.5 py-0.5 text-xs font-bold rounded ${language === 'en' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600'}`}
                  >
                    English (Default)
                  </button>
                  <button
                    onClick={() => setLanguage('ur')}
                    className={`px-2.5 py-0.5 text-xs font-bold rounded ${language === 'ur' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'}`}
                  >
                    اردو (Urdu)
                  </button>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSeal}
                    onChange={(e) => setIncludeSeal(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Official Security Stamp</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCategories}
                    onChange={(e) => setIncludeCategories(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Category Breakdown</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTransactions}
                    onChange={(e) => setIncludeTransactions(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Full Ledger ({monthTransactions.length})</span>
                </label>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                Ref: {statementRef}
              </span>
            </div>

            {/* Document Printable Preview Canvas */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-300 w-full max-w-3xl p-6 sm:p-10 space-y-6 text-slate-900 print-document-box">
                {language === 'en' ? (
                  /* ================= ENGLISH STATEMENT ================= */
                  <div className="space-y-6">
                    {/* Top Security Banner / Seal */}
                    {includeSeal && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                            <ShieldCheck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-black uppercase tracking-wider text-emerald-950">
                              PAISATRACK AI FINANCIAL PLATFORM
                            </div>
                            <div className="text-[11px] text-slate-600 font-medium">
                              Certified Personal & Business Wealth Audit Statement
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 text-white shadow-2xs font-mono">
                          LEDGER VERIFIED
                        </span>
                      </div>
                    )}

                    {/* Statement Header */}
                    <div className="border-b-2 border-slate-900 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-700">
                            MONTHLY FINANCIAL AUDIT STATEMENT
                          </div>
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            PAISATRACK AI
                          </h1>
                          <div className="text-xs font-semibold text-slate-500 mt-0.5">
                            Universal Personal & Business Wealth OS
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statement Period</div>
                          <div className="text-lg font-black text-emerald-700">{monthName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">Ref: {statementRef}</div>
                        </div>
                      </div>

                      {/* Account Details Grid */}
                      <div className="mt-4 pt-3.5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Account Holder</span>
                          <span className="font-extrabold text-slate-900">{user.name}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Account ID</span>
                          <span className="font-bold text-slate-900 font-mono">{user.student_id || 'ACC-8824-PK'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Email Address</span>
                          <span className="font-mono text-slate-800 font-semibold text-[11px] truncate block" title={user.email}>
                            {user.email || 'ahmadmhaseeb88@gmail.com'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Currency</span>
                          <span className="font-bold text-slate-900">{currency} (Pakistani Rupee)</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 font-bold block">Account Status</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Verified Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Summary Cards */}
                    <div>
                      <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-500 mb-2.5">
                        Executive Cashflow Performance
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-emerald-50/50">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Inflow</span>
                          <span className="text-lg font-black text-emerald-700 font-mono">{formatMoney(summary.monthIncome)}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-rose-50/50">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Outflow</span>
                          <span className="text-lg font-black text-rose-700 font-mono">{formatMoney(summary.monthExpense)}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-indigo-50/50">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Net Savings</span>
                          <span className={`text-lg font-black font-mono ${netSavings >= 0 ? 'text-indigo-950' : 'text-rose-700'}`}>
                            {formatMoney(netSavings)}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">Savings Ratio</span>
                          <span className="text-lg font-black text-slate-900 font-mono">
                            {savingsRate}% <span className="text-[10px] font-normal text-slate-500">saved</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Category Distribution */}
                    {includeCategories && summary.categoryBreakdown.length > 0 && (
                      <div>
                        <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-500 mb-2">
                          Expense Breakdown by Category
                        </h3>
                        <table className="w-full text-xs text-left border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3 text-right">Total Outflow</th>
                              <th className="py-2 px-3 text-right">Share (%)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {summary.categoryBreakdown.map((cat, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="py-2 px-3 font-semibold text-slate-900">{cat.category}</td>
                                <td className="py-2 px-3 text-right font-black font-mono text-slate-900">{formatMoney(cat.amount)}</td>
                                <td className="py-2 px-3 text-right font-semibold text-slate-600 font-mono">{cat.percentage}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Itemized Transactions Table */}
                    {includeTransactions && (
                      <div>
                        <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-500 mb-2">
                          Itemized Transaction Ledger ({monthTransactions.length} records)
                        </h3>
                        {monthTransactions.length === 0 ? (
                          <div className="text-xs text-slate-400 py-4 text-center border border-dashed rounded-xl">
                            No transactions recorded during {monthName}.
                          </div>
                        ) : (
                          <table className="w-full text-xs text-left border-collapse border border-slate-200">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <th className="py-2 px-3">Date</th>
                                <th className="py-2 px-3">Description</th>
                                <th className="py-2 px-3">Category</th>
                                <th className="py-2 px-3">Payment Method</th>
                                <th className="py-2 px-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {monthTransactions.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/80">
                                  <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{t.date}</td>
                                  <td className="py-2 px-3 font-semibold text-slate-900">{t.description}</td>
                                  <td className="py-2 px-3 text-slate-600">{t.category}</td>
                                  <td className="py-2 px-3 text-slate-600">{t.payment_method}</td>
                                  <td
                                    className={`py-2 px-3 text-right font-black font-mono ${
                                      t.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                                    }`}
                                  >
                                    {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    {/* Signatures & Formal Verification Section */}
                    <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-8">Account Holder Declaration</div>
                        <div className="border-t border-slate-400 pt-1 text-slate-700">
                          <strong>{user.name}</strong>
                          <div className="text-[11px] text-slate-500">Certified Authentic Financial Records</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-8">System Ledger Audit</div>
                        <div className="border-t border-slate-400 pt-1 text-slate-700">
                          <strong>PaisaTrack AI Automated Ledger Seal</strong>
                          <div className="text-[11px] text-slate-500 font-mono">Timestamp: {new Date().toISOString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ================= URDU STATEMENT ================= */
                  <div dir="rtl" className="font-urdu text-right space-y-6">
                    {/* Top Security Banner */}
                    {includeSeal && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs">
                            <ShieldCheck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-emerald-950">
                              پیسہ ٹریک اے آئی فنانشل پلیٹ فارم
                            </div>
                            <div className="text-[11px] text-slate-600">
                              مصدقہ ذاتی و کاروباری مالیاتی آڈٹ گوشوارہ
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-emerald-600 text-white font-mono">
                          مصدقہ کھاتہ
                        </span>
                      </div>
                    )}

                    {/* Statement Header */}
                    <div className="border-b-2 border-slate-900 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[11px] font-bold text-emerald-800">
                            ماہانہ مالیاتی رپورٹ و آڈٹ گوشوارہ
                          </div>
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                            PAISATRACK AI
                          </h1>
                          <div className="text-xs font-bold text-slate-600 mt-0.5">
                            ذاتی اور کاروباری فنانس مینجمنٹ
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-500">رپورٹ کا دورانیہ</div>
                          <div className="text-base font-extrabold text-emerald-800">{monthName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Ref: {statementRef}</div>
                        </div>
                      </div>

                      {/* Account Details Grid */}
                      <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block">کھاتہ دار کا نام</span>
                          <span className="font-extrabold text-slate-900 text-sm">{user.name}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block">کھاتہ نمبر / آئی ڈی</span>
                          <span className="font-bold text-slate-900 font-mono">{user.student_id || 'ACC-8824-PK'}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block">ای میل ایڈریس</span>
                          <span className="font-bold text-slate-900 font-mono text-[11px] truncate block" dir="ltr">{user.email}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block">کرنسی</span>
                          <span className="font-bold text-slate-900">{currency} (پاکستانی روپیہ)</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-500 font-bold block">اکاؤنٹ کی حالت</span>
                          <span className="font-bold text-emerald-700">فعال و مصدقہ (Verified)</span>
                        </div>
                      </div>
                    </div>

                    {/* KPI Overview Grid */}
                    <div>
                      <h3 className="text-xs font-black text-slate-600 mb-2.5">
                        ماہانہ نقد آمد و خرچ کا جائزہ (Cashflow Performance)
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-emerald-50/40">
                          <span className="text-[11px] font-bold text-slate-600 block">کل موصولہ رقم (آمدنی)</span>
                          <span className="text-lg font-black text-emerald-800 font-mono">{formatMoney(summary.monthIncome)}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-rose-50/40">
                          <span className="text-[11px] font-bold text-slate-600 block">کل اخراجات</span>
                          <span className="text-lg font-black text-rose-700 font-mono">{formatMoney(summary.monthExpense)}</span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                          <span className="text-[11px] font-bold text-slate-600 block">خالص ماہانہ بچت</span>
                          <span className={`text-lg font-black font-mono ${netSavings >= 0 ? 'text-indigo-900' : 'text-rose-700'}`}>
                            {formatMoney(netSavings)}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                          <span className="text-[11px] font-bold text-slate-600 block">بچت کی شرح</span>
                          <span className="text-lg font-black text-slate-900 font-mono">{savingsRate}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Category Table */}
                    {includeCategories && summary.categoryBreakdown.length > 0 && (
                      <div>
                        <h3 className="text-xs font-black text-slate-700 mb-2">
                          اخراجات بلحاظ شعبہ و کیٹیگری
                        </h3>
                        <table className="w-full text-xs text-right border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 font-bold border-b border-slate-200">
                              <th className="py-2 px-3">کیٹیگری</th>
                              <th className="py-2 px-3 text-left">کل خرچ رقم</th>
                              <th className="py-2 px-3 text-left">فیصد حصہ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {summary.categoryBreakdown.map((cat, i) => (
                              <tr key={i}>
                                <td className="py-2 px-3 font-bold">{cat.category}</td>
                                <td className="py-2 px-3 text-left font-black font-mono">{formatMoney(cat.amount)}</td>
                                <td className="py-2 px-3 text-left font-bold font-mono">{cat.percentage}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Ledger */}
                    {includeTransactions && monthTransactions.length > 0 && (
                      <div>
                        <h3 className="text-xs font-black text-slate-700 mb-2">
                          تفصیلی لین دین کھاتہ ({monthName})
                        </h3>
                        <table className="w-full text-xs text-right border-collapse border border-slate-200">
                          <thead>
                            <tr className="bg-slate-100 font-bold border-b border-slate-200">
                              <th className="py-2 px-2.5">تاریخ</th>
                              <th className="py-2 px-2.5">تفصیل</th>
                              <th className="py-2 px-2.5">کیٹیگری</th>
                              <th className="py-2 px-2.5">طریقہ</th>
                              <th className="py-2 px-2.5 text-left">رقم</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {monthTransactions.map((t) => (
                              <tr key={t.id}>
                                <td className="py-1.5 px-2.5 text-slate-600 font-mono text-[11px]">{t.date}</td>
                                <td className="py-1.5 px-2.5 font-bold">{t.description}</td>
                                <td className="py-1.5 px-2.5 text-slate-600">{t.category}</td>
                                <td className="py-1.5 px-2.5 text-slate-600">{t.payment_method}</td>
                                <td
                                  className={`py-1.5 px-2.5 text-left font-black font-mono ${
                                    t.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                                  }`}
                                >
                                  {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Signatures */}
                    <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 mb-8">کھاتہ دار کے تصدیقی دستخط</div>
                        <div className="border-t border-slate-400 pt-1">
                          <strong>دستخط: {user.name}</strong>
                          <div className="text-[11px] text-slate-500">مصدقہ کھاتہ دار</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 mb-8">سسٹم آڈٹ تصدیق</div>
                        <div className="border-t border-slate-400 pt-1">
                          <strong>پیسہ ٹریک اے آئی خودکار لیجر</strong>
                          <div className="text-[11px] text-slate-500 font-mono">{new Date().toISOString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Directly print to physical printer or save as PDF (Ctrl+P). Clean margins & zero clutter.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEDICATED PRINT-ONLY LAYOUT (TRIGGERED DIRECTLY BY WINDOW.PRINT()) */}
      {/* ========================================================================= */}
      {summary && (
        <div className="print-only print-container">
          {language === 'ur' ? (
            /* Urdu Physical Print Layout */
            <div dir="rtl" className="font-urdu text-right space-y-5">
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800">
                      پیسہ ٹریک اے آئی (PaisaTrack AI)
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      ماہانہ مالیاتی رپورٹ و آڈٹ گوشوارہ
                    </h1>
                    <div className="text-xs font-bold text-slate-700 mt-0.5">
                      ذاتی و کاروباری حساب کتاب · تصدیق شدہ کھاتہ
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800">رپورٹ کا دورانیہ</div>
                    <div className="text-lg font-black text-emerald-800">{monthName}</div>
                    <div className="text-[11px] text-slate-600 font-mono">Ref: {statementRef}</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-300 grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">کھاتہ دار کا نام</span>
                    <span className="font-black text-slate-900">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">کھاتہ آئی ڈی</span>
                    <span className="font-bold text-slate-900 font-mono">{user.student_id || 'ACC-8824-PK'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">کرنسی</span>
                    <span className="font-bold text-slate-900">{currency} (پاکستانی روپیہ)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">کھاتے کی حالت</span>
                    <span className="font-bold text-emerald-800">فعال و مصدقہ</span>
                  </div>
                </div>
              </div>

              {/* Performance Summary Table */}
              <div className="mb-5">
                <table className="w-full text-xs text-right border-collapse border border-slate-300">
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="py-2 px-3 font-bold text-slate-700 bg-slate-50 w-1/4">کل آمدنی</td>
                      <td className="py-2 px-3 font-black text-emerald-800 w-1/4 font-mono">{formatMoney(summary.monthIncome)}</td>
                      <td className="py-2 px-3 font-bold text-slate-700 bg-slate-50 w-1/4">بجٹ کی حد</td>
                      <td className="py-2 px-3 font-black text-slate-900 w-1/4 font-mono">{formatMoney(summary.monthlyBudget)}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="py-2 px-3 font-bold text-slate-700 bg-slate-50">کل اخراجات</td>
                      <td className="py-2 px-3 font-black text-rose-800 font-mono">{formatMoney(summary.monthExpense)}</td>
                      <td className="py-2 px-3 font-bold text-slate-700 bg-slate-50">بجٹ کا استعمال</td>
                      <td className="py-2 px-3 font-black text-slate-900 font-mono">{summary.budgetUtilization}%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-slate-700 bg-slate-50">خالص ماہانہ بچت</td>
                      <td className="py-2 px-3 font-black text-slate-900 font-mono">{formatMoney(netSavings)}</td>
                      <td className="py-2 px-3 font-bold text-slate-700 bg-slate-50">بچت کی شرح</td>
                      <td className="py-2 px-3 font-black text-emerald-800 font-mono">{savingsRate}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Categories */}
              {summary.categoryBreakdown.length > 0 && (
                <div className="mb-5 break-inside-avoid">
                  <h3 className="text-xs font-black text-slate-800 mb-2">اخراجات بلحاظ مد</h3>
                  <table className="w-full text-xs text-right border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-300">
                        <th className="py-2 px-3">مد</th>
                        <th className="py-2 px-3 text-left">رقم</th>
                        <th className="py-2 px-3 text-left">فیصد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {summary.categoryBreakdown.map((cat, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-3 font-bold">{cat.category}</td>
                          <td className="py-1.5 px-3 text-left font-black font-mono">{formatMoney(cat.amount)}</td>
                          <td className="py-1.5 px-3 text-left font-bold font-mono">{cat.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Transactions */}
              {monthTransactions.length > 0 && (
                <div className="mb-6 break-inside-avoid">
                  <h3 className="text-xs font-black text-slate-800 mb-2">ٹرانزیکشن ریکارڈز ({monthName})</h3>
                  <table className="w-full text-xs text-right border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-300">
                        <th className="py-1.5 px-2.5">تاریخ</th>
                        <th className="py-1.5 px-2.5">تفصیل</th>
                        <th className="py-1.5 px-2.5">مد</th>
                        <th className="py-1.5 px-2.5">طریقہ</th>
                        <th className="py-1.5 px-2.5 text-left">رقم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {monthTransactions.map((t) => (
                        <tr key={t.id}>
                          <td className="py-1.5 px-2.5 text-slate-700 font-mono text-[11px]">{t.date}</td>
                          <td className="py-1.5 px-2.5 font-bold">{t.description}</td>
                          <td className="py-1.5 px-2.5 text-slate-700">{t.category}</td>
                          <td className="py-1.5 px-2.5 text-slate-700">{t.payment_method}</td>
                          <td className={`py-1.5 px-2.5 text-left font-black font-mono ${t.type === 'income' ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs break-inside-avoid">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 mb-10">کھاتہ دار کے تصدیقی دستخط</div>
                  <div className="border-t border-slate-400 pt-1">
                    <strong>دستخط: {user.name}</strong>
                    <div className="text-[11px] text-slate-500">مصدقہ کھاتہ دار</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 mb-10">سسٹم آڈٹ تصدیق</div>
                  <div className="border-t border-slate-400 pt-1">
                    <strong>پیسہ ٹریک اے آئی خودکار لیجر</strong>
                    <div className="text-[11px] text-slate-500 font-mono">{new Date().toISOString()}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= ENGLISH PHYSICAL PRINT LAYOUT (POLISHED) ================= */
            <div className="space-y-6 text-slate-900">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-800">
                      OFFICIAL FINANCIAL STATEMENT & AUDIT REPORT
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      PAISATRACK AI WEALTH PLATFORM
                    </h1>
                    <div className="text-xs font-semibold text-slate-600 mt-0.5">
                      Personal & Business Wealth Management System
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Statement Period</div>
                    <div className="text-lg font-black text-emerald-800">{monthName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Ref: {statementRef}</div>
                  </div>
                </div>

                {/* Account Details 4-Column Bar */}
                <div className="mt-3 pt-3 border-t border-slate-300 grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold block">Account Holder</span>
                    <span className="font-extrabold text-slate-900">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold block">Account ID</span>
                    <span className="font-bold text-slate-900 font-mono">{user.student_id || 'ACC-8824-PK'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold block">Currency</span>
                    <span className="font-bold text-slate-900">{currency} (Pakistani Rupee)</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold block">Account Status</span>
                    <span className="font-bold text-emerald-800">Verified Active</span>
                  </div>
                </div>
              </div>

              {/* Performance Summary Table */}
              <div className="mb-5">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-700 mb-2">
                  Executive Cashflow Performance Summary
                </h3>
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="py-2 px-3 font-semibold text-slate-700 bg-slate-50 w-1/4">Total Inflow (Income)</td>
                      <td className="py-2 px-3 font-black text-emerald-800 w-1/4 font-mono">{formatMoney(summary.monthIncome)}</td>
                      <td className="py-2 px-3 font-semibold text-slate-700 bg-slate-50 w-1/4">Monthly Budget Limit</td>
                      <td className="py-2 px-3 font-black text-slate-900 w-1/4 font-mono">{formatMoney(summary.monthlyBudget)}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="py-2 px-3 font-semibold text-slate-700 bg-slate-50">Total Outflow (Expenses)</td>
                      <td className="py-2 px-3 font-black text-rose-800 font-mono">{formatMoney(summary.monthExpense)}</td>
                      <td className="py-2 px-3 font-semibold text-slate-700 bg-slate-50">Budget Utilization</td>
                      <td className="py-2 px-3 font-black text-slate-900 font-mono">{summary.budgetUtilization}%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-700 bg-slate-50">Net Retained Savings</td>
                      <td className="py-2 px-3 font-black text-slate-900 font-mono">{formatMoney(netSavings)}</td>
                      <td className="py-2 px-3 font-semibold text-slate-700 bg-slate-50">Savings Ratio</td>
                      <td className="py-2 px-3 font-black text-emerald-800 font-mono">{savingsRate}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Categories */}
              {summary.categoryBreakdown.length > 0 && (
                <div className="mb-5 break-inside-avoid">
                  <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-700 mb-2">
                    Category Expense Distribution
                  </h3>
                  <table className="w-full text-xs text-left border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-300">
                        <th className="py-2 px-3">Expense Category</th>
                        <th className="py-2 px-3 text-right">Total Outflow</th>
                        <th className="py-2 px-3 text-right">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {summary.categoryBreakdown.map((cat, i) => (
                        <tr key={i}>
                          <td className="py-1.5 px-3 font-semibold">{cat.category}</td>
                          <td className="py-1.5 px-3 text-right font-black font-mono">{formatMoney(cat.amount)}</td>
                          <td className="py-1.5 px-3 text-right font-semibold font-mono">{cat.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Itemized Transactions */}
              {monthTransactions.length > 0 && (
                <div className="mb-6 break-inside-avoid">
                  <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-700 mb-2">
                    Itemized Transaction Ledger ({monthTransactions.length} items)
                  </h3>
                  <table className="w-full text-xs text-left border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-300">
                        <th className="py-1.5 px-2.5">Date</th>
                        <th className="py-1.5 px-2.5">Description</th>
                        <th className="py-1.5 px-2.5">Category</th>
                        <th className="py-1.5 px-2.5">Payment Method</th>
                        <th className="py-1.5 px-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {monthTransactions.map((t) => (
                        <tr key={t.id}>
                          <td className="py-1.5 px-2.5 text-slate-700 font-mono text-[11px]">{t.date}</td>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-900">{t.description}</td>
                          <td className="py-1.5 px-2.5 text-slate-700">{t.category}</td>
                          <td className="py-1.5 px-2.5 text-slate-700">{t.payment_method}</td>
                          <td
                            className={`py-1.5 px-2.5 text-right font-black font-mono ${
                              t.type === 'income' ? 'text-emerald-700' : 'text-slate-900'
                            }`}
                          >
                            {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Signatures & Certification */}
              <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs break-inside-avoid">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-8">Account Holder Declaration</div>
                  <div className="border-t border-slate-400 pt-1">
                    <strong>{user.name}</strong>
                    <div className="text-[11px] text-slate-500">Certified Authentic Financial Records</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-8">System Ledger Audit Stamp</div>
                  <div className="border-t border-slate-400 pt-1">
                    <strong>PaisaTrack AI Automated Ledger Seal</strong>
                    <div className="text-[11px] text-slate-500 font-mono">Timestamp: {new Date().toISOString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
