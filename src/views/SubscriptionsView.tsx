import React, { useState, useEffect } from 'react';
import { User, SubscriptionPlan } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  Crown,
  Check,
  X,
  ShieldCheck,
  Copy,
  Smartphone,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface SubscriptionsViewProps {
  user: User;
  onPlanUpdated: (newPlan: 'free' | 'premium' | 'pro') => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  user,
  onPlanUpdated,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [receiver, setReceiver] = useState<{ method: string; accountNumber: string; accountTitle: string }>({
    method: 'EasyPaisa',
    accountNumber: '03707481051',
    accountTitle: 'PaisaTrack AI Official',
  });
  const [loading, setLoading] = useState(true);

  // Upgrade Modal
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EasyPaisa' | 'JazzCash' | 'Bank Transfer'>('EasyPaisa');
  const [accountOrCardNumber, setAccountOrCardNumber] = useState('');
  const [transactionTid, setTransactionTid] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const fetchSubscriptionInfo = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.getSubscriptionPlans(),
        api.getCurrentSubscription(),
      ]);
      setPlans(pRes.plans);
      if (pRes.paymentReceiver) setReceiver(pRes.paymentReceiver);
      setCurrentSub(cRes);
    } catch (err: any) {
      console.error('Failed to load subscription plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const handleOpenUpgrade = (plan: SubscriptionPlan) => {
    if (plan.id === user.plan) return;
    setSelectedPlan(plan);
    setPaymentMethod('EasyPaisa');
    setAccountOrCardNumber('');
    setTransactionTid('');
    setPaymentError(null);
    setSuccessMessage(null);
    setIsPendingApproval(false);
  };

  const handleCopyReceiver = () => {
    navigator.clipboard.writeText(receiver.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setPaymentError(null);
    setProcessing(true);
    try {
      const res = await api.upgradeSubscription({
        plan_id: selectedPlan.id,
        payment_method: paymentMethod,
        mobile_or_card_no: accountOrCardNumber.trim(),
        transaction_tid: transactionTid.trim(),
      });

      setSuccessMessage(res.message);
      setIsPendingApproval(Boolean(res.pending));
      if (!res.pending) {
        onPlanUpdated(selectedPlan.id);
      }
      setTimeout(() => {
        setSelectedPlan(null);
        fetchSubscriptionInfo();
      }, 2200);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment verification failed. Please check your details.');
    } finally {
      setProcessing(false);
    }
  };

  const pendingSubmissions = (currentSub?.history || []).filter((h: any) => h.status === 'pending');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          PaisaTrack AI VIP Membership
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEn ? 'Transparent, High-Value Pricing' : 'شفاف اور کم قیمت ممبرشپ پلانز'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {isEn ? (
            <>
              Premium at <strong className="text-slate-800">Rs 525/month</strong> and Pro VIP at{' '}
              <strong className="text-slate-800">Rs 775/month</strong>. Pay directly via EasyPaisa to{' '}
              <strong className="text-emerald-700 font-mono">{receiver.accountNumber}</strong> and submit your Transaction ID (TID).
            </>
          ) : (
            <>
              پریمیم <strong className="text-slate-800">525 روپے ماہانہ</strong> اور پرو وی آئی پی{' '}
              <strong className="text-slate-800">775 روپے ماہانہ</strong>۔ ایزی پیسہ نمبر{' '}
              <strong className="text-emerald-700 font-mono">{receiver.accountNumber}</strong> پر رقم بھیج کر TID درج کریں۔
            </>
          )}
        </p>
      </div>

      {/* Official EasyPaisa Receiver & Active Plan Card */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {isEn ? 'Your Active Membership:' : 'آپ کا موجودہ پلان:'}
            </span>
            <span className="text-sm font-extrabold text-slate-900 capitalize">
              {user.plan} Plan
            </span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
            {isEn ? 'Active Status' : 'فعال'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] text-emerald-800 uppercase font-bold flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              {isEn ? 'Official EasyPaisa Account:' : 'آفیشل ایزی پیسہ اکاؤنٹ:'}
            </span>
            <span className="text-sm font-black text-emerald-950 font-mono block">
              {receiver.accountNumber}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyReceiver}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors"
          >
            {copiedAccount ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copiedAccount ? (isEn ? 'Copied' : 'کاپی ہو گیا') : isEn ? 'Copy' : 'کاپی'}</span>
          </button>
        </div>
      </div>

      {/* Pending Payment Verification Banner */}
      {pendingSubmissions.length > 0 && (
        <div className="max-w-3xl mx-auto p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">
              {isEn
                ? `Payment Pending Verification (${pendingSubmissions.length})`
                : `ادائیگی کی تصدیق جاری ہے (${pendingSubmissions.length})`}
            </div>
            <div className="text-[11px] text-amber-800 mt-0.5">
              {isEn
                ? `Latest TID: ${pendingSubmissions[0].transaction_tid || pendingSubmissions[0].reference_no} · Rs ${pendingSubmissions[0].amount_pkr} (${pendingSubmissions[0].plan.toUpperCase()}) sent to EasyPaisa ${receiver.accountNumber}.`
                : `TID: ${pendingSubmissions[0].transaction_tid || pendingSubmissions[0].reference_no} · Rs ${pendingSubmissions[0].amount_pkr} کی تصدیق ہوتے ہی آپ کا پلان خودکار فعال ہو جائے گا۔`}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Tiers Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((p) => {
            const isCurrent = user.plan === p.id;

            return (
              <div
                key={p.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between relative bg-white ${
                  p.popular
                    ? 'border-indigo-600 shadow-lg shadow-indigo-600/10 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                    Most Popular · Rs 525/mo
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-base">{p.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{p.tagline}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {p.price_pkr === 0 ? 'Free' : `Rs ${p.price_pkr}`}
                    </span>
                    {p.price_pkr > 0 && (
                      <span className="text-xs text-slate-400 font-medium">/{p.billing_period}</span>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-6 space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Included Features:
                    </span>
                    {p.features.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}

                    {p.limitations && (
                      <div className="pt-2 space-y-1.5 border-t border-slate-100">
                        {p.limitations.map((l, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                            <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                            <span>{l}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <button
                    disabled={isCurrent}
                    onClick={() => handleOpenUpgrade(p)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : p.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isCurrent ? 'Active Plan' : `Upgrade to ${p.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment History Table (if user has any submitted payments) */}
      {currentSub?.history?.length > 0 && (
        <div className="max-w-4xl mx-auto rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-bold text-xs text-slate-900">
            {isEn ? 'Your Payment & Upgrade History' : 'آپ کی ادائیگیوں کا ریکارڈ'}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-4">Plan</th>
                  <th className="py-2 px-4">Amount</th>
                  <th className="py-2 px-4">TID / Reference</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentSub.history.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-2 px-4 font-bold uppercase text-slate-800">{item.plan}</td>
                    <td className="py-2 px-4 font-mono">Rs {item.amount_pkr}</td>
                    <td className="py-2 px-4 font-mono text-slate-600">{item.transaction_tid || item.reference_no}</td>
                    <td className="py-2 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-slate-400 font-mono text-[11px]">
                      {(item.created_at || '').split('T')[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Real EasyPaisa Transfer + TID Verification Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {isEn ? `Upgrade to ${selectedPlan.name}` : `${selectedPlan.name} میں اپ گریڈ کریں`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMessage ? (
              <div className="py-8 text-center space-y-2.5">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                    isPendingApproval ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {isPendingApproval ? <Clock className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {isPendingApproval
                    ? isEn
                      ? 'Payment Proof Submitted!'
                      : 'ادائیگی کا ثبوت جمع ہو گیا!'
                    : isEn
                    ? 'Upgrade Verified & Active!'
                    : 'اپ گریڈ فعال ہو گیا!'}
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="mt-4 space-y-4">
                {paymentError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{selectedPlan.name}</span>
                    <span className="text-[11px] text-slate-500">Monthly membership</span>
                  </div>
                  <span className="text-base font-extrabold text-indigo-600">
                    Rs {selectedPlan.price_pkr}
                  </span>
                </div>

                {/* Automatic EasyPaisa Receiver Account Box */}
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase text-emerald-800 tracking-wide">
                      Step 1: Send Rs {selectedPlan.price_pkr} to EasyPaisa
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      Official Receiver
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-200">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">EasyPaisa Account Number</div>
                      <div className="text-base font-black text-slate-900 font-mono tracking-wide">
                        {receiver.accountNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyReceiver}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAccount ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Open your EasyPaisa app, send <strong>Rs {selectedPlan.price_pkr}</strong> to{' '}
                    <strong className="font-mono">{receiver.accountNumber}</strong>, then enter your sender number and the Transaction ID (TID) below.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Sent Via:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'EasyPaisa', label: 'EasyPaisa' },
                      { id: 'JazzCash', label: 'JazzCash' },
                      { id: 'Bank Transfer', label: 'Bank / Raast' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                          paymentMethod === m.id
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Sender {paymentMethod} Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountOrCardNumber}
                    onChange={(e) => setAccountOrCardNumber(e.target.value)}
                    placeholder="03XX 1234567"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    EasyPaisa Transaction ID (TID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionTid}
                    onChange={(e) => setTransactionTid(e.target.value)}
                    placeholder="e.g. 29481047291"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-mono uppercase"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Found in your EasyPaisa receipt or confirmation SMS.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 shadow-sm"
                  >
                    {processing ? 'Submitting TID...' : `Submit TID for Rs ${selectedPlan.price_pkr}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
