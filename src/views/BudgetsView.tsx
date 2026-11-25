import React, { useState, useEffect } from 'react';
import { Budget, User } from '../types';
import { api } from '../services/api';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface BudgetsViewProps {
  user: User;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({ user }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal for creating/editing budget
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState('Food');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'semester' | 'custom'>('monthly');
  const [amount, setAmount] = useState('');
  const [thresholdPercent, setThresholdPercent] = useState('80');

  const categories = [
    'Overall',
    'Food',
    'Transport',
    'University fees',
    'Books and stationery',
    'Hostel and rent',
    'Internet and mobile',
    'Shopping',
    'Entertainment',
    'Health',
    'Bills',
    'Other',
  ];

  const currency = user.currency || 'PKR';
  const formatMoney = (amt: number) => {
    return `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amt).toLocaleString()}`;
  };

  const fetchBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getBudgets();
      setBudgets(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setCategory('Food');
    setPeriod('monthly');
    setAmount('');
    setThresholdPercent('80');
    setModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setCategory(b.category);
    setPeriod(b.period);
    setAmount(String(b.amount));
    setThresholdPercent(String(b.threshold_percent));
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this budget limit?')) return;
    try {
      await api.deleteBudget(id);
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Failed to remove budget');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      if (editingBudget) {
        await api.updateBudget(editingBudget.id, {
          amount: parsedAmount,
          threshold_percent: parseInt(thresholdPercent, 10),
        });
      } else {
        await api.createBudget({
          category,
          period,
          amount: parsedAmount,
          threshold_percent: parseInt(thresholdPercent, 10),
        });
      }
      setModalOpen(false);
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Failed to save budget');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Smart Budget Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure spending ceilings, track live utilization, and trigger early warning alerts.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm shadow-indigo-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Set Budget Limit</span>
        </button>
      </div>

      {/* Overspending warnings summary */}
      {budgets.some((b) => b.isExceeded) && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold">Budget Ceiling Exceeded!</div>
            <p className="text-xs text-rose-700 mt-0.5">
              One or more student spending limits have crossed 100%. Review cafeteria, dining, and discretionary purchases to avoid month-end cash deficit.
            </p>
          </div>
        </div>
      )}

      {/* Budgets Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading budget records...</div>
      ) : budgets.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <PieChart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">No Active Budgets Configured</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Set spending limits for your monthly allowance, cafeteria mess, transport, or books to monitor cashflow.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white"
          >
            Create First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const spent = b.spent || 0;
            const pct = b.percentage || 0;
            const isExceeded = b.isExceeded || spent > b.amount;
            const isWarning = b.isWarning || (!isExceeded && pct >= b.threshold_percent);

            return (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{b.category}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        {b.period} limit
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Edit limit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">Spent this month:</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatMoney(spent)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs mt-0.5">
                      <span className="text-slate-400">Ceiling limit:</span>
                      <span className="text-slate-600 font-semibold">{formatMoney(b.amount)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between text-[11px] mt-2 font-medium">
                    <span
                      className={`flex items-center gap-1 ${
                        isExceeded
                          ? 'text-rose-600 font-bold'
                          : isWarning
                          ? 'text-amber-600 font-bold'
                          : 'text-emerald-600'
                      }`}
                    >
                      {isExceeded ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" /> Exceeded by{' '}
                          {formatMoney(spent - b.amount)}
                        </>
                      ) : isWarning ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" /> Warning (Above {b.threshold_percent}%)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Normal ({formatMoney(b.amount - spent)} left)
                        </>
                      )}
                    </span>
                    <span className="text-slate-400 font-bold">{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingBudget ? 'Adjust Budget Limit' : 'Configure New Budget Limit'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Budget Category
                </label>
                <select
                  disabled={Boolean(editingBudget)}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'Overall' ? 'Overall Monthly Student Allowance' : c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ceiling Limit Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warning Alert Threshold (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="99"
                  value={thresholdPercent}
                  onChange={(e) => setThresholdPercent(e.target.value)}
                  placeholder="80"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Triggers amber warning when spending reaches this percentage.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Save Budget Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
