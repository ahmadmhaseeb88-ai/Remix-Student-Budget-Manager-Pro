import React, { useState, useEffect } from 'react';
import { User, SmsLog } from '../types';
import { api } from '../services/api';
import {
  Smartphone,
  Send,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Target,
  PieChart,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SmsSyncViewProps {
  user: User;
  onRefreshUserData?: () => void;
}

export const SmsSyncView: React.FC<SmsSyncViewProps> = ({ user, onRefreshUserData }) => {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [smsInput, setSmsInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Configuration state
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || '+923001234567');
  const [webhookToken, setWebhookToken] = useState(user.sms_webhook_token || 'student_sms_sec_9941');
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const currency = user.currency || 'PKR';
  const formatMoney = (amt: number) => {
    return `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amt).toLocaleString()}`;
  };

  // Build full webhook URL
  const webhookUrl = `${window.location.origin}/api/sms/inbound?token=${webhookToken}`;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getSmsLogs();
      setLogs(res.data);
    } catch (err: any) {
      console.error('Failed to load SMS logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleProcessSms = async (textToProcess?: string) => {
    const text = (textToProcess || smsInput).trim();
    if (!text) return;

    setProcessing(true);
    setResultMessage(null);

    try {
      const res = await api.simulateSms(text, phoneNumber);
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });

        setResultMessage({
          text: res.message || 'SMS processed and expense/budget updated successfully!',
          success: true,
        });
        setSmsInput('');
        fetchLogs();
        if (onRefreshUserData) onRefreshUserData();
      } else {
        setResultMessage({
          text: res.error || 'Could not parse SMS.',
          success: false,
        });
      }
    } catch (err: any) {
      setResultMessage({
        text: err?.message || 'Error communicating with SMS parser.',
        success: false,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(webhookToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.updateSmsConfig({ phone_number: phoneNumber });
      if (res.sms_webhook_token) {
        setWebhookToken(res.sms_webhook_token);
      }
      setResultMessage({
        text: 'Phone number and SMS settings updated successfully!',
        success: true,
      });
    } catch (err: any) {
      setResultMessage({
        text: err?.message || 'Failed to update SMS settings.',
        success: false,
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!confirm('Regenerate secret webhook token? You will need to update your mobile SMS app with the new URL.')) {
      return;
    }
    setSavingConfig(true);
    try {
      const res = await api.updateSmsConfig({ regenerate_token: true });
      if (res.sms_webhook_token) {
        setWebhookToken(res.sms_webhook_token);
      }
      setResultMessage({
        text: 'New secret webhook token generated!',
        success: true,
      });
    } catch (err: any) {
      setResultMessage({
        text: err?.message || 'Failed to regenerate token.',
        success: false,
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await api.deleteSmsLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      console.error('Failed to delete SMS log:', err);
    }
  };

  // Sample quick templates
  const SAMPLE_TEMPLATES = [
    {
      label: 'MCKRU Cafeteria EasyPaisa',
      text: 'Payment of Rs. 350 to MCKRU Cafeteria Biryani was successful on EasyPaisa. Balance Rs 14,500.',
    },
    {
      label: 'MCKRU Bookshop JazzCash',
      text: 'Paid Rs 1,200 to MCKRU Bookshop via JazzCash Till. TID: 994821. Fee: Rs 0.',
    },
    {
      label: 'SadaPay Online',
      text: 'Rs. 850 spent at Steam Games with SadaPay Debit Card. Remaining: Rs. 4,150.',
    },
    {
      label: 'Hostel Rent Cash',
      text: 'Paid Rs 6,000 hostel shared room & mess rent to warden in cash',
    },
    {
      label: 'Photostat & Lab Manual',
      text: 'Spent 150 on campus photocopy and lab manual prints',
    },
    {
      label: 'Set Food Budget',
      text: 'Budget Food 10000',
    },
    {
      label: 'Save for FYP Laptop',
      text: 'Save 3000 Laptop',
    },
    {
      label: 'Monthly Pocket Money',
      text: 'You have received Rs. 30,000 monthly student allowance from family via Bank Transfer',
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Mobile SMS Expense & Budget Sync
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            موبائل سے ایس ایم ایس کے ذریعے ایکسپنس اور بجٹ خودکار سیو کریں (Automate logging expenses, budgets, and savings goals from mobile SMS & banking alerts)
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>Refresh SMS Logs</span>
        </button>
      </div>

      {/* Result Toast / Alert */}
      {resultMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs ${
            resultMessage.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {resultMessage.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{resultMessage.text}</span>
          </div>
          <button
            onClick={() => setResultMessage(null)}
            className="text-xs font-bold px-2 py-1 rounded-lg hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Two Column Layout: Quick Tester & Webhook Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Direct SMS Paste & Live Parser */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Paste & Process Mobile SMS (ایس ایم ایس درج کریں)
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                AI & NLP Powered
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Copy any bank transactional alert (EasyPaisa, JazzCash, SadaPay, HBL, Meezan) or write a quick note like{' '}
              <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono">Spent 450 biryani</code> or{' '}
              <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono">Budget Food 10000</code>.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessSms();
              }}
              className="space-y-3"
            >
              <textarea
                value={smsInput}
                onChange={(e) => setSmsInput(e.target.value)}
                placeholder="Example: 'Payment of Rs. 850 to FAST Cafeteria was successful on EasyPaisa' or 'Paid 6000 hostel mess cash'"
                rows={3}
                className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder:text-slate-400 font-mono resize-none"
              />

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-400">
                  Auto-categorizes Food, Rent, Commute, Books, and updates Budgets
                </span>
                <button
                  type="submit"
                  disabled={!smsInput.trim() || processing}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{processing ? 'Processing SMS...' : 'Process & Save SMS'}</span>
                </button>
              </div>
            </form>

            {/* Quick 1-Click Test Templates */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Try Sample Student SMS Templates:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSmsInput(tmpl.text);
                      handleProcessSms(tmpl.text);
                    }}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors text-left"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Webhook Endpoint & Real-time Integration Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Your Mobile SMS Webhook URL (موبائل ویب ہک لنک)
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Use this unique Webhook URL in Android SMS forwarding apps (such as <strong>SMS Forwarder</strong>,{' '}
              <strong>Tasker</strong>, or <strong>MacroDroid</strong>). When your phone receives an SMS from EasyPaisa or JazzCash, it is forwarded here and automatically logged!
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Inbound Webhook Endpoint:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 shrink-0 border border-slate-200"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Secret Webhook Token:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookToken}
                    className="flex-1 text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 shrink-0 border border-slate-200"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerateToken}
                    className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 shrink-0"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Mobile Phone Setup & Guide */}
        <div className="lg:col-span-5 space-y-5">
          {/* Phone Number Verification & Setup */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Registered Mobile Phone (موبائل نمبر درج کریں)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Register your mobile number so SMS forwarded from your SIM is automatically matched to your account.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Mobile Number (e.g. +92 300 1234567):
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+923001234567"
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {savingConfig ? 'Saving Number...' : 'Save Mobile Number'}
              </button>
            </form>
          </div>

          {/* Quick Setup Tutorial */}
          <div className="p-5 sm:p-6 rounded-3xl bg-indigo-50/70 border border-indigo-100 shadow-xs space-y-3 text-xs text-slate-700">
            <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-1.5">
              <span>Android SMS Forwarding Setup (آسان 3 طریقے)</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-2 text-slate-600 leading-relaxed">
              <li>
                <strong>Free App "SMS Forwarder" on Play Store</strong>: Add a Webhook Rule. Set URL to your Webhook URL above. Filter by Sender: <code>EasyPaisa</code>, <code>JazzCash</code>, or your bank.
              </li>
              <li>
                <strong>Tasker / MacroDroid</strong>: On SMS Received, trigger HTTP POST request with <code>message: %SMSRB</code>.
              </li>
              <li>
                <strong>Direct Mobile Browser Shortcut</strong>: Bookmark this page or the Webhook URL on your mobile home screen to quickly paste expenses while having tea or canteen lunch!
              </li>
            </ol>
          </div>

          {/* Supported Formats Cheat Sheet */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Supported SMS Syntax Cheat Sheet
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 block">Expense:</span>
                <span className="text-slate-500 font-mono text-[11px]">"Spent 450 biryani" · "Paid 6000 hostel mess cash"</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 block">Budget Configuration:</span>
                <span className="text-slate-500 font-mono text-[11px]">"Budget Food 12000" · "Budget Transport 3500"</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 block">Savings Goal Deposit:</span>
                <span className="text-slate-500 font-mono text-[11px]">"Save 2000 Laptop" · "Goal 1500 Exam"</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-800 block">Banking Transaction Alerts:</span>
                <span className="text-slate-500 font-mono text-[11px]">EasyPaisa Trx, JazzCash SMS, SadaPay alerts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS Logs & History Table */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Recent Mobile SMS Ingestion Logs ({logs.length})
            </h3>
            <p className="text-xs text-slate-500">
              Audit trail of all SMS received from mobile devices and automatically digitized into your ledger
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {logs.length} logged records
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading SMS history...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Smartphone className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No SMS messages logged yet. Use the quick box above to test your first mobile expense SMS!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Extracted Details</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Original SMS Message</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          log.parsed_type === 'expense'
                            ? 'bg-rose-100 text-rose-800'
                            : log.parsed_type === 'income'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.parsed_type === 'budget'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.parsed_type === 'expense' && <TrendingDown className="w-3 h-3" />}
                        {log.parsed_type === 'income' && <TrendingUp className="w-3 h-3" />}
                        {log.parsed_type === 'budget' && <PieChart className="w-3 h-3" />}
                        {log.parsed_type === 'goal' && <Target className="w-3 h-3" />}
                        <span>{log.parsed_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.parsed_description}</div>
                      <div className="text-[11px] text-slate-400">Category: {log.parsed_category}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{log.payment_method}</span>
                      {log.sender_number && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {log.sender_number}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]" title={log.raw_text}>
                      {log.raw_text}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-black text-xs ${
                          log.parsed_type === 'income'
                            ? 'text-emerald-700'
                            : log.parsed_type === 'expense'
                            ? 'text-rose-700'
                            : 'text-indigo-700'
                        }`}
                      >
                        {log.parsed_type === 'income' ? '+' : log.parsed_type === 'expense' ? '-' : ''}
                        {formatMoney(log.parsed_amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
