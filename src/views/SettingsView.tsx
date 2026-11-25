import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import {
  Settings,
  User as UserIcon,
  Lock,
  Wallet,
  Download,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface SettingsViewProps {
  user: User;
  onUserUpdated: (u: User) => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onUserUpdated,
  onLogout,
}) => {
  // Profile form
  const [name, setName] = useState(user.name);
  const [university, setUniversity] = useState(user.university);
  const [semester, setSemester] = useState(user.semester);
  const [currency, setCurrency] = useState(user.currency || 'PKR');
  const [monthlyBudget, setMonthlyBudget] = useState(String(user.monthly_budget));
  const [studentId, setStudentId] = useState(user.student_id || '');
  const [financialGoals, setFinancialGoals] = useState(user.financial_goals || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Account deletion
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);

    try {
      const res = await api.updateProfile({
        name,
        university,
        semester,
        currency,
        monthly_budget: parseFloat(monthlyBudget) || 30000,
        student_id: studentId,
        financial_goals: financialGoals,
      });
      onUserUpdated(res.user);
      setProfileSuccess(res.message);
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPasswordSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportDataBackup = async () => {
    try {
      const summary = await api.getDashboardSummary();
      const tx = await api.getTransactions({ limit: 1000 });
      const budgets = await api.getBudgets();
      const goals = await api.getGoals();

      const backup = {
        user,
        summary,
        transactions: tx.data,
        budgets: budgets.data,
        goals: goals.data,
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_budget_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err: any) {
      alert('Backup export failed: ' + err.message);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Are you absolutely certain? This will delete your student account and all recorded transactions permanently.')) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteAccount(deletePassword);
      alert('Your account and financial data have been deleted.');
      onLogout();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Account & Preferences
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your personal profile, preferred currency, security passwords, and account privacy.
        </p>
      </div>

      {/* Profile Form */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Personal & Business Profile</h3>

        {profileSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{profileSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Email (Immutable)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profession / Business / Organization
              </label>
              <input
                type="text"
                required
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="Software / Business / Freelancer"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Category / Role
              </label>
              <input
                type="text"
                required
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Personal / Freelancer / Corporate"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account ID / Customer Reference
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="ACC-8824-PK"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold"
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
                Monthly Target Budget ({currency})
              </label>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Semester Goals / Notes
            </label>
            <input
              type="text"
              value={financialGoals}
              onChange={(e) => setFinancialGoals(e.target.value)}
              placeholder="e.g. Save for FYP hardware and cloud certification"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            {profileLoading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Security & Password</h3>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password (Min 6 chars)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Account Data Export & Danger Zone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Data */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Download Data Archive</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export all your transactions, budgets, semester plans, and goals into a portable JSON backup file.
            </p>
          </div>
          <button
            onClick={handleExportDataBackup}
            className="mt-4 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 self-start shadow-2xs"
          >
            Export JSON Archive
          </button>
        </div>

        {/* Delete Account */}
        <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-rose-900">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-sm">Delete Account & Data</h3>
            </div>
            <p className="text-xs text-rose-700/80 leading-relaxed">
              Permanently purge your account, transactions, bills, and receipts. This action is irreversible.
            </p>

            {deleteError && (
              <div className="mt-2 text-xs text-rose-800 font-semibold">{deleteError}</div>
            )}
          </div>

          <form onSubmit={handleDeleteAccount} className="mt-4 flex items-center gap-2">
            <input
              type="password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter password to confirm"
              className="text-xs px-3 py-2 rounded-xl border border-rose-200 bg-white text-slate-800 flex-1"
            />
            <button
              type="submit"
              disabled={deleting}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shrink-0 disabled:opacity-50"
            >
              {deleting ? 'Purging...' : 'Delete Forever'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
