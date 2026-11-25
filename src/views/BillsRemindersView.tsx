import React, { useState, useEffect } from 'react';
import { BillReminder, User } from '../types';
import { api } from '../services/api';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  X,
  CreditCard,
} from 'lucide-react';

interface BillsRemindersViewProps {
  user: User;
}

export const BillsRemindersView: React.FC<BillsRemindersViewProps> = ({ user }) => {
  const [bills, setBills] = useState<BillReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Bill Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Hostel and rent');
  const [dueDate, setDueDate] = useState('');
  const [recurringFrequency, setRecurringFrequency] = useState<'none' | 'monthly' | 'semester' | 'annual'>('monthly');
  const [reminderDaysBefore, setReminderDaysBefore] = useState('3');

  const currency = user.currency || 'PKR';
  const formatMoney = (amt: number) => {
    return `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amt).toLocaleString()}`;
  };

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.getBills();
      setBills(res.data);
    } catch (err: any) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handlePay = async (bill: BillReminder) => {
    const recordExpense = confirm(`Pay "${bill.title}" of ${formatMoney(bill.amount)}?\n\nClick OK to also record this as an expense in your transactions ledger.`);
    try {
      await api.payBill(bill.id, recordExpense, 'Cash');
      fetchBills();
    } catch (err: any) {
      alert(err.message || 'Failed to mark bill as paid');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bill reminder?')) return;
    try {
      await api.deleteBill(id);
      fetchBills();
    } catch (err: any) {
      alert(err.message || 'Failed to delete bill');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      await api.createBill({
        title,
        amount: parsedAmount,
        category,
        due_date: dueDate,
        recurring_frequency: recurringFrequency,
        reminder_days_before: parseInt(reminderDaysBefore, 10),
      });

      setModalOpen(false);
      setTitle('');
      setAmount('');
      setDueDate('');
      fetchBills();
    } catch (err: any) {
      alert(err.message || 'Failed to create bill reminder');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Bill & Payment Reminders
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Never miss hostel rent, semester tuition deadlines, internet packages, or exam fees.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm shadow-indigo-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Bill List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading bills and deadlines...</div>
      ) : bills.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">No Pending Bill Reminders</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Add recurring deadlines for hostel rent, university exam fees, and mobile packages.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white"
          >
            Create Reminder
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((b) => {
            const isOverdue = !b.is_paid && b.due_date < today;
            const isDueSoon = !b.is_paid && !isOverdue;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  b.is_paid
                    ? 'bg-white border-slate-200 opacity-80'
                    : isOverdue
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{b.title}</h3>
                      <span className="text-[11px] text-slate-400">{b.category}</span>
                    </div>

                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-slate-900">
                      {formatMoney(b.amount)}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {b.recurring_frequency !== 'none' ? `Repeats ${b.recurring_frequency}` : 'One-time'}
                    </span>
                  </div>

                  <div className="mt-2 text-xs flex items-center gap-1.5 font-medium">
                    {b.is_paid ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid on {b.last_paid_at}
                      </span>
                    ) : isOverdue ? (
                      <span className="text-rose-600 flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Overdue since {b.due_date}
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Due: {b.due_date}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Alert {b.reminder_days_before} days before
                  </span>

                  {!b.is_paid && (
                    <button
                      onClick={() => handlePay(b)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Bill / Fee Reminder</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bill / Fee Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Hostel Room Rent or Semester Midterm Fee"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="8500"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  >
                    <option value="Hostel and rent">Hostel and Rent</option>
                    <option value="University fees">University Fees</option>
                    <option value="Internet and mobile">Internet & Mobile</option>
                    <option value="Bills">Utility Bills</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Repeat Schedule
                  </label>
                  <select
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                  >
                    <option value="none">One-time only</option>
                    <option value="monthly">Every Month</option>
                    <option value="semester">Every Semester (6 mo)</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  In-App Reminder Alert (Days Before)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={reminderDaysBefore}
                  onChange={(e) => setReminderDaysBefore(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                />
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
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
