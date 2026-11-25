import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import {
  ShieldCheck,
  Users,
  CreditCard,
  Receipt,
  Server,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface AdminViewProps {
  user: User;
}

export const AdminView: React.FC<AdminViewProps> = ({ user }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getAdminStats();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load administrator data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (user.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
        Administrator privilege required. Access denied.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Administration Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            System health, active student accounts, database status, and subscription telemetry.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60 self-start sm:self-auto">
          Role: System Administrator
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading admin metrics...</div>
      ) : (
        <div className="space-y-6">
          {/* Admin KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Registered Students</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {data.stats.totalUsers}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Across all universities</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Paid Subscriptions</span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {data.stats.paidSubscriptions}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Premium & Pro tiers</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Transactions</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {data.stats.totalTransactionsRecorded}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Recorded user ledger entries</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Receipts Digitized</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                {data.stats.totalReceiptsProcessed}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Via CamScanner OCR engine</span>
            </div>
          </div>

          {/* System Health */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">System & Runtime Environment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Database Architecture</span>
                <span className="font-bold text-slate-800">{data.system.database}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Node Engine</span>
                <span className="font-bold text-slate-800">{data.system.node_version}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Host Platform</span>
                <span className="font-bold text-slate-800 capitalize">{data.system.platform}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Operational Status</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {data.system.status}
                </span>
              </div>
            </div>
          </div>

          {/* User Accounts Roster */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Registered Accounts Roster</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">University</th>
                    <th className="py-2.5 px-4">Plan</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{u.email}</td>
                      <td className="py-2.5 px-4 text-slate-600">{u.university}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {u.plan}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 capitalize font-medium text-slate-600">{u.role}</td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                        {u.created_at.split('T')[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
