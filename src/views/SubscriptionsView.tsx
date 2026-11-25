import React, { useState, useEffect } from 'react';
import { User, SubscriptionPlan } from '../types';
import { api } from '../services/api';
import {
  Crown,
  Check,
  X,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface SubscriptionsViewProps {
  user: User;
  onPlanUpdated: (newPlan: 'free' | 'premium' | 'pro') => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  user,
  onPlanUpdated,
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Upgrade Modal
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'EasyPaisa' | 'JazzCash' | 'Debit Card'>('EasyPaisa');
  const [accountOrCardNumber, setAccountOrCardNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSubscriptionInfo = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        api.getSubscriptionPlans(),
        api.getCurrentSubscription(),
      ]);
      setPlans(pRes.plans);
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
    setAccountOrCardNumber('');
    setSuccessMessage(null);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setProcessing(true);
    try {
      const res = await api.upgradeSubscription({
        plan_id: selectedPlan.id,
        payment_method: paymentMethod,
        mobile_or_card_no: accountOrCardNumber,
      });

      setSuccessMessage(res.message);
      onPlanUpdated(selectedPlan.id);
      setTimeout(() => {
        setSelectedPlan(null);
        fetchSubscriptionInfo();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          PaisaTrack AI VIP Membership
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Transparent, High-Value Pricing
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Premium at <strong className="text-slate-800">Rs 525/month</strong> and Pro VIP at <strong className="text-slate-800">Rs 775/month</strong>. Unlock full AI Financial Advisor intelligence, CamScanner OCR document digitization, and target wealth planning.
        </p>
      </div>

      {/* Current Active Plan Badge */}
      <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">
            Your Active Membership:
          </span>
          <span className="text-sm font-extrabold text-slate-900 capitalize">
            {user.plan} Plan
          </span>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
          Active Status
        </span>
      </div>

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

      {/* Payment Gateway Modal (JazzCash / EasyPaisa / Card Adapter) */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Subscribe to {selectedPlan.name}
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
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Upgrade Confirmed!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="mt-4 space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{selectedPlan.name}</span>
                    <span className="text-[11px] text-slate-500">Monthly renewal</span>
                  </div>
                  <span className="text-base font-extrabold text-indigo-600">
                    Rs {selectedPlan.price_pkr}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Pakistani Payment Gateway:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'EasyPaisa', label: 'EasyPaisa' },
                      { id: 'JazzCash', label: 'JazzCash' },
                      { id: 'Debit Card', label: 'Bank Card' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                          paymentMethod === m.id
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs'
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
                    {paymentMethod === 'Debit Card'
                      ? '16-Digit Card Number'
                      : `${paymentMethod} Mobile Account Number`}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountOrCardNumber}
                    onChange={(e) => setAccountOrCardNumber(e.target.value)}
                    placeholder={paymentMethod === 'Debit Card' ? '4111 2222 3333 4444' : '0300 1234567'}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Secure simulated test sandbox for development.
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
                    className="text-xs font-bold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 shadow-sm"
                  >
                    {processing ? 'Authorizing Payment...' : `Confirm & Pay Rs ${selectedPlan.price_pkr}`}
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
