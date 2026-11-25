import React, { useState, useEffect } from 'react';
import { SavingsGoal, User } from '../types';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Trash2,
  X,
  Coins,
  Sparkles,
  Laptop,
} from 'lucide-react';

interface SavingsGoalsViewProps {
  user: User;
}

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({ user }) => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [deductFromCash, setDeductFromCash] = useState(true);

  // Create form state
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [notes, setNotes] = useState('');

  const currency = user.currency || 'PKR';
  const formatMoney = (amt: number) => {
    return `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amt).toLocaleString()}`;
  };

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.getGoals();
      setGoals(res.data);
    } catch (err: any) {
      console.error('Failed to load savings goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenDeposit = (g: SavingsGoal) => {
    setSelectedGoal(g);
    setDepositAmount('');
    setDepositModalOpen(true);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }

    try {
      const res = await api.depositGoal(selectedGoal.id, amt, deductFromCash);
      if (res.isCompleted) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      setDepositModalOpen(false);
      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Deposit failed');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    try {
      await api.createGoal({
        title,
        target_amount: parsedTarget,
        current_amount: parseFloat(currentAmount) || 0,
        target_date: targetDate,
        priority,
        notes,
      });
      setCreateModalOpen(false);
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('');
      setNotes('');
      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to create goal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this savings goal?')) return;
    try {
      await api.deleteGoal(id);
      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Savings Goal Studio
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track student milestones (FYP laptop, cloud exam vouchers, emergency cushion) with pace recommendations.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm shadow-indigo-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading savings goals...</div>
      ) : goals.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">No Savings Goals Set Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Set a target for your final year project equipment, certification voucher, or semester trip.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const isCompleted = g.current_amount >= g.target_amount || g.status === 'completed';
            const pct = g.percentage || 0;

            return (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{g.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due {g.target_date}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold capitalize ${
                            g.priority === 'high'
                              ? 'text-rose-600'
                              : g.priority === 'medium'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {g.priority} priority
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Target and current amount */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Accumulated
                      </span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {formatMoney(g.current_amount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Target
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {formatMoney(g.target_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] mt-1.5 font-medium">
                    <span className="text-slate-400">{pct}% Complete</span>
                    <span className="text-slate-600 font-semibold">
                      {isCompleted ? 'Target Achieved! 🎉' : `${formatMoney(g.remaining || 0)} left`}
                    </span>
                  </div>

                  {/* Suggested pace */}
                  {!isCompleted && g.suggestedWeeklySavings && (
                    <div className="mt-3 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80 text-[11px] text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        Save <strong>{formatMoney(g.suggestedWeeklySavings)}/week</strong> to complete on time.
                      </span>
                    </div>
                  )}

                  {g.notes && (
                    <p className="text-[11px] text-slate-500 mt-2 italic line-clamp-2">
                      "{g.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-[11px] font-semibold ${
                      isCompleted ? 'text-emerald-600 flex items-center gap-1' : 'text-slate-400'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {isCompleted ? 'Completed' : `${g.daysRemaining} days left`}
                  </span>

                  <button
                    onClick={() => handleOpenDeposit(g)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Deposit Funds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deposit Modal */}
      {depositModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add Savings Deposit</h3>
              </div>
              <button
                onClick={() => setDepositModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="mt-4 space-y-3.5">
              <p className="text-xs text-slate-600">
                Deposit to: <strong className="text-slate-900">{selectedGoal.title}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deposit Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full text-base font-bold px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={deductFromCash}
                  onChange={(e) => setDeductFromCash(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Also record as expense transaction to deduct from active wallet cash</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Create New Savings Goal</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. M2 MacBook for Deep Learning Project"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="150000"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Deposit ({currency})
                  </label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Price quotes checked at Hafeez Center / Dubai Plaza"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
