import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  RefreshCw,
  Search,
  Activity,
  UserPlus,
  Smartphone,
  Check,
  X,
} from 'lucide-react';

interface AdminViewProps {
  user: User;
}

export const AdminView: React.FC<AdminViewProps> = ({ user }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isOwnerOrAdmin = user.role === 'admin';

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

  useEffect(() => {
    if (isOwnerOrAdmin) {
      fetchAdminStats();
    } else {
      setLoading(false);
    }
  }, [isOwnerOrAdmin]);

  const handleApproveSub = async (subId: string) => {
    setActionMsg(null);
    try {
      const res = await api.approveSubscription(subId);
      setActionMsg(res.message);
      fetchAdminStats();
    } catch (err: any) {
      setError(err.message || 'Failed to approve subscription');
    }
  };

  const handleRejectSub = async (subId: string) => {
    setActionMsg(null);
    try {
      const res = await api.rejectSubscription(subId);
      setActionMsg(res.message);
      fetchAdminStats();
    } catch (err: any) {
      setError(err.message || 'Failed to reject subscription');
    }
  };

  if (!isOwnerOrAdmin) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs">
        {isEn
          ? 'Administrator privilege required. Access denied.'
          : 'ایڈمن رسائی درکار ہے۔'}
      </div>
    );
  }

  const formatLastActive = (iso?: string) => {
    if (!iso) return { label: isEn ? 'Seeded / Pending' : 'رجسٹرڈ', isOnline: false };
    const diffMs = Date.now() - new Date(iso).getTime();
    if (diffMs < 15 * 60 * 1000) {
      return { label: isEn ? 'Online Now' : 'ابھی آن لائن', isOnline: true };
    }
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) {
      return { label: `${mins}m ago`, isOnline: false };
    }
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) {
      return { label: `${hrs}h ago`, isOnline: false };
    }
    return { label: iso.split('T')[0], isOnline: false };
  };

  const filteredUsers = (data?.users || []).filter((u: any) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(u.name || '').toLowerCase().includes(q) ||
      String(u.email || '').toLowerCase().includes(q) ||
      String(u.university || '').toLowerCase().includes(q)
    );
  });

  const subRequests = data?.subscriptions || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {isEn ? 'Users & Administration Console' : 'صارفین و ایڈمن کنسول'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isEn
              ? 'Live count of all users using PaisaTrack AI, active sessions, and EasyPaisa payment approvals.'
              : 'پیسہ ٹریک AI استعمال کرنے والے تمام صارفین، فعال سیشنز اور ایزی پیسہ ادائیگیوں کی تصدیق۔'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchAdminStats}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isEn ? 'Refresh' : 'ریفریش'}</span>
          </button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            Admin / Owner
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {actionMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {actionMsg}
        </div>
      )}

      {loading || !data ? (
        <div className="py-16 text-center text-xs text-slate-400">
          {isEn ? 'Loading user analytics...' : 'صارفین کا ڈیٹا لوڈ ہو رہا ہے...'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Admin KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {isEn ? 'Total Registered Users' : 'کل رجسٹرڈ صارفین'}
                </span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {data.stats.totalUsers}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                +{data.stats.newToday || 0} {isEn ? 'joined today' : 'آج شامل ہوئے'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {isEn ? 'Active Users' : 'فعال صارفین'}
                </span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1 flex items-baseline gap-2">
                <span>{data.stats.activeToday ?? 0}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {data.stats.activeNow ?? 0} {isEn ? 'online now' : 'آن لائن'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {isEn ? 'Active in last 24 hours' : 'گزشتہ 24 گھنٹوں میں فعال'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {isEn ? 'Paid Subscriptions' : 'پیڈ پلانز'}
                </span>
                <UserPlus className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {data.stats.paidSubscriptions}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {isEn ? 'Premium & Pro tiers' : 'پریمیم اور پرو ممبرز'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">
                {isEn ? 'Total Transactions' : 'کل اندراجات'}
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {data.stats.totalTransactionsRecorded}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {data.stats.totalFamilyHubs || 0} {isEn ? 'family hubs' : 'فیملی ہبز'} · {data.stats.totalReceiptsProcessed} {isEn ? 'receipts' : 'رسیدیں'}
              </span>
            </div>
          </div>

          {/* EasyPaisa Payment Verification Queue */}
          <div className="rounded-2xl bg-white border border-emerald-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-emerald-100 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {isEn
                    ? `EasyPaisa Upgrade Payments (Receiver: ${data.paymentReceiver?.accountNumber || '03707481051'})`
                    : `ایزی پیسہ ادائیگیاں (${data.paymentReceiver?.accountNumber || '03707481051'})`}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                {subRequests.filter((s: any) => s.status === 'pending').length} {isEn ? 'Pending' : 'زیرِ التواء'}
              </span>
            </div>

            {subRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {isEn ? 'No upgrade payment submissions yet.' : 'ابھی تک کوئی اپ گریڈ ادائیگی موصول نہیں ہوئی۔'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4">Plan & Amount</th>
                      <th className="py-2.5 px-4">Sender</th>
                      <th className="py-2.5 px-4">EasyPaisa TID</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subRequests.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900">{s.user_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.user_email}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold uppercase text-indigo-700">{s.plan}</span>
                          <span className="text-slate-500 ml-1.5 font-mono">Rs {s.amount_pkr}</span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{s.sender_number || s.payment_method}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                          {s.transaction_tid || s.reference_no}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              s.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : s.status === 'pending'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          {s.status === 'pending' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleApproveSub(s.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectSub(s.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {s.verified_by ? `By ${s.verified_by}` : 'Processed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* System Health */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              {isEn ? 'System & Runtime Environment' : 'سسٹم اور سرور اسٹیٹس'}
            </h3>
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
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isEn ? `Registered Accounts Roster (${filteredUsers.length})` : `تمام صارفین کی فہرست (${filteredUsers.length})`}
                </h3>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEn ? 'Search name or Gmail...' : 'نام یا ای میل تلاش کریں...'}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">{isEn ? 'Name' : 'نام'}</th>
                    <th className="py-2.5 px-4">{isEn ? 'Email / Gmail' : 'ای میل'}</th>
                    <th className="py-2.5 px-4">{isEn ? 'Status' : 'اسٹیٹس'}</th>
                    <th className="py-2.5 px-4">{isEn ? 'Workspace / Org' : 'شعبہ'}</th>
                    <th className="py-2.5 px-4">{isEn ? 'Plan' : 'پلان'}</th>
                    <th className="py-2.5 px-4">{isEn ? 'Joined' : 'شمولیت'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u: any) => {
                    const status = formatLastActive(u.last_active_at);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{u.name}</td>
                        <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                        <td className="py-2.5 px-4">
                          {status.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {status.label}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">
                              {status.label}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{u.university}</td>
                        <td className="py-2.5 px-4">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            {u.plan}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                          {(u.created_at || '').split('T')[0]}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
