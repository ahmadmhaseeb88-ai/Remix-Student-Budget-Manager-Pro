import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Logo } from './Logo';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Lock, Mail, User as UserIcon, Building2, Wallet } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login form default to Haseeb Ahmad
  const [loginEmail, setLoginEmail] = useState('ahmadmhaseeb88@gmail.com');
  const [loginPassword, setLoginPassword] = useState('11223344');

  // Register Onboarding Steps (1 to 2 — clean & universal for any new Gmail user)
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    university: '',
    currency: 'PKR',
    monthly_budget: '35000',
    financial_goals: '',
  });

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep(1);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: 'haseeb' | 'student' | 'admin') => {
    if (type === 'haseeb') {
      setLoginEmail('ahmadmhaseeb88@gmail.com');
      setLoginPassword('11223344');
    } else if (type === 'student') {
      setLoginEmail('student@fast.edu.pk');
      setLoginPassword('student123');
    } else {
      setLoginEmail('admin@budgetpro.edu');
      setLoginPassword('admin123');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Full name and email address are required.');
      setStep(1);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setStep(1);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirm_password: formData.confirm_password,
        university: formData.university.trim() || 'Personal & Business',
        semester: 'Active',
        currency: formData.currency,
        monthly_budget: Number(formData.monthly_budget) || 35000,
        financial_goals: formData.financial_goals.trim() || undefined,
      });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword(loginEmail.trim());
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to process password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <Logo />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium">
              {successMessage}
            </div>
          )}

          {/* ================= LOGIN VIEW ================= */}
          {mode === 'login' && (
            <div>
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">Sign In to PaisaTrack AI</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Access your real-time cashflow, income & expense ledger, family sharing, and AI advisor.
                </p>
              </div>

              {/* Fast 1-Click Demo Buttons */}
              <div className="mb-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Quick 1-Click Login:
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillDemo('haseeb')}
                    className="text-left p-2 rounded-lg bg-white border border-emerald-300 hover:border-emerald-500 text-xs text-slate-700 transition-all shadow-xs"
                  >
                    <div className="font-bold text-emerald-800">Ahmad Haseeb</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">ahmadmhaseeb88@gmail.com</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillDemo('student')}
                    className="text-left p-2 rounded-lg bg-white border border-indigo-200/60 hover:border-indigo-400 text-xs text-slate-700 transition-all shadow-xs"
                  >
                    <div className="font-bold text-indigo-700">Hamza Khan</div>
                    <div className="text-[10px] text-slate-400 truncate">student@fast.edu.pk</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillDemo('admin')}
                    className="text-left p-2 rounded-lg bg-white border border-indigo-200/60 hover:border-indigo-400 text-xs text-slate-700 transition-all shadow-xs"
                  >
                    <div className="font-bold text-slate-800">Admin</div>
                    <div className="text-[10px] text-slate-400 truncate">admin@budgetpro.edu</div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email / Gmail Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-lg shadow-sm shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-slate-500">
                New user?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('register');
                    setStep(1);
                  }}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Create a free account with Gmail
                </button>
              </div>
            </div>
          )}

          {/* ================= REGISTER & 2-STEP ONBOARDING ================= */}
          {mode === 'register' && (
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Create Your Account</h2>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    Step {step} of 2
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${(step / 2) * 100}%` }}
                  />
                </div>
              </div>

              <form onSubmit={handleRegister}>
                {/* Step 1: Credentials */}
                {step === 1 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Step 1: Enter your name, Gmail/email address, and password.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Ayesha Malik"
                          className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gmail / Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="yourname@gmail.com"
                          className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password (Min 6 characters) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          value={formData.confirm_password}
                          onChange={(e) =>
                            setFormData({ ...formData, confirm_password: e.target.value })
                          }
                          placeholder="••••••••"
                          className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
                          setError('Please enter your name, email address, and password.');
                          return;
                        }
                        if (formData.password.length < 6) {
                          setError('Password must be at least 6 characters long.');
                          return;
                        }
                        if (formData.password !== formData.confirm_password) {
                          setError('Passwords do not match.');
                          return;
                        }
                        setError(null);
                        setStep(2);
                      }}
                      className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                    >
                      Next: Budget Preferences <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Step 2: Financial Setup */}
                {step === 2 && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Step 2: Set your currency and monthly budget target.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Primary Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-bold"
                      >
                        <option value="PKR">Pakistani Rupee (PKR - Rs)</option>
                        <option value="USD">US Dollar (USD - $)</option>
                        <option value="EUR">Euro (EUR - €)</option>
                        <option value="GBP">British Pound (GBP - £)</option>
                        <option value="AED">UAE Dirham (AED)</option>
                        <option value="SAR">Saudi Riyal (SAR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Monthly Budget Target ({formData.currency})
                      </label>
                      <div className="relative">
                        <Wallet className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="number"
                          required
                          value={formData.monthly_budget}
                          onChange={(e) =>
                            setFormData({ ...formData, monthly_budget: e.target.value })
                          }
                          placeholder="35000"
                          className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Profession / Organization (Optional)
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={formData.university}
                          onChange={(e) =>
                            setFormData({ ...formData, university: e.target.value })
                          }
                          placeholder="e.g. Freelancer, Business, Household, Student"
                          className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Top Savings Goal (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.financial_goals}
                        onChange={(e) =>
                          setFormData({ ...formData, financial_goals: e.target.value })
                        }
                        placeholder="e.g. Emergency Fund, Home Solar, Laptop Upgrade"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-600">
                      <div className="font-semibold text-slate-900">Account Summary:</div>
                      <div>Name: {formData.name}</div>
                      <div>Email: {formData.email}</div>
                      <div>
                        Monthly Budget: {formData.currency} {Number(formData.monthly_budget || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20"
                      >
                        <Check className="w-4 h-4" />
                        {loading ? 'Creating Account...' : 'Complete Registration'}
                      </button>
                    </div>
                  </div>
                )}
              </form>

              <div className="mt-4 text-center text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Sign In instead
                </button>
              </div>
            </div>
          )}

          {/* ================= FORGOT PASSWORD ================= */}
          {mode === 'forgot' && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered email address.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email / Gmail Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-all"
                >
                  {loading ? 'Sending link...' : 'Send Password Reset Link'}
                </button>
              </form>

              <div className="mt-4 text-center text-xs text-slate-500">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
