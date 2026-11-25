import React, { useState, useEffect } from 'react';
import {
  User,
  FamilyHubResponse,
  FamilyMember,
  FamilyRelation,
  FamilyRole,
} from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import confetti from 'canvas-confetti';
import {
  Users,
  UserPlus,
  Plus,
  Copy,
  Check,
  Shield,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Trash2,
  Settings,
  X,
  RefreshCw,
  KeyRound,
  Split,
  CheckCircle2,
  AlertTriangle,
  Coins,
} from 'lucide-react';

interface FamilySharingViewProps {
  user: User;
  onDataChanged?: () => void;
}

export const FamilySharingView: React.FC<FamilySharingViewProps> = ({ user, onDataChanged }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [hub, setHub] = useState<FamilyHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Filters for shared ledger
  const [txFilterType, setTxFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [txFilterMember, setTxFilterMember] = useState<string>('all');

  // Create / Join onboarding state
  const [newHubName, setNewHubName] = useState(`${user.name.split(' ')[0]} Family Hub`);
  const [newHubBudget, setNewHubBudget] = useState('120000');
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Modals
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // Add Member Form
  const [memName, setMemName] = useState('');
  const [memEmail, setMemEmail] = useState('');
  const [memRelation, setMemRelation] = useState<FamilyRelation>('Spouse');
  const [memRole, setMemRole] = useState<FamilyRole>('contributor');
  const [memLimit, setMemLimit] = useState('25000');

  // Edit Member Limit inline
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editLimitVal, setEditLimitVal] = useState('');
  const [editRoleVal, setEditRoleVal] = useState<FamilyRole>('contributor');

  // Add Shared Transaction Form
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txMemberId, setTxMemberId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Groceries & Mart');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txMethod, setTxMethod] = useState('EasyPaisa');
  const [txSplitEqually, setTxSplitEqually] = useState(true);
  const [txSyncPersonal, setTxSyncPersonal] = useState(false);

  // Add Shared Goal Form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalInitial, setGoalInitial] = useState('0');
  const [goalDate, setGoalDate] = useState(`${new Date().getFullYear() + 1}-06-30`);

  // Contribute Goal Form
  const [contribAmount, setContribAmount] = useState('');
  const [contribMemberId, setContribMemberId] = useState('');

  // Hub Settings Form
  const [editHubName, setEditHubName] = useState('');
  const [editHubBudget, setEditHubBudget] = useState('');

  const currency = hub?.family?.currency || user.currency || 'PKR';
  const formatMoney = (amt: number) =>
    `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amt).toLocaleString()}`;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadHub = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFamilyHub();
      setHub(data);
      if (data.members.length > 0) {
        const selfMem = data.members.find((m) => m.user_id === user.id) || data.members[0];
        setTxMemberId(selfMem.id);
        setContribMemberId(selfMem.id);
      }
      if (data.family) {
        setEditHubName(data.family.name);
        setEditHubBudget(String(data.family.shared_monthly_budget));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Family Sharing Hub');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHub();
  }, []);

  const handleCopyCode = () => {
    if (!hub?.family) return;
    navigator.clipboard.writeText(hub.family.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createFamilyHub({
        name: newHubName,
        shared_monthly_budget: Number(newHubBudget) || 100000,
      });
      setHub(res);
      showToast(res.message);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleJoinHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    try {
      const res = await api.joinFamilyHub(joinCodeInput.trim());
      setHub(res);
      setJoinCodeInput('');
      setJoinModalOpen(false);
      showToast(res.message);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateHubSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateFamilyHub({
        name: editHubName,
        shared_monthly_budget: Number(editHubBudget) || 100000,
      });
      setHub(res);
      setSettingsOpen(false);
      showToast(res.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRegenerateCode = async () => {
    try {
      const res = await api.updateFamilyHub({ regenerate_code: true });
      setHub(res);
      showToast(isEn ? 'Invite code regenerated!' : 'نیا دعوتی کوڈ بن گیا!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName.trim()) return;
    try {
      const res = await api.addFamilyMember({
        name: memName.trim(),
        email: memEmail.trim() || undefined,
        relation: memRelation,
        role: memRole,
        spending_limit: Number(memLimit) || 20000,
      });
      setHub(res);
      setAddMemberOpen(false);
      setMemName('');
      setMemEmail('');
      setMemLimit('25000');
      showToast(res.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const res = await api.updateFamilyMember(editingMember.id, {
        role: editRoleVal,
        spending_limit: Number(editLimitVal) || 0,
      });
      setHub(res);
      setEditingMember(null);
      showToast(res.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the family hub?`)) return;
    try {
      const res = await api.removeFamilyMember(memberId);
      setHub(res);
      showToast(res.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddFamilyTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      alert(isEn ? 'Enter a valid amount greater than zero.' : 'درست رقم درج کریں۔');
      return;
    }
    try {
      const res = await api.addFamilyTransaction({
        member_id: txMemberId,
        type: txType,
        amount: amt,
        category: txCategory,
        description: txDescription.trim() || (txType === 'income' ? 'Family pool contribution' : 'Household expense'),
        date: txDate,
        payment_method: txMethod,
        split_equally: txType === 'expense' ? txSplitEqually : false,
        sync_to_personal: txSyncPersonal,
      });
      setHub(res);
      setAddTxOpen(false);
      setTxAmount('');
      setTxDescription('');
      showToast(res.message);
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.85 } });
      if (txSyncPersonal && onDataChanged) {
        onDataChanged();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteFamilyTx = async (txId: string) => {
    if (!confirm(isEn ? 'Delete this shared record?' : 'کیا آپ یہ ریکارڈ حذف کرنا چاہتے ہیں؟')) return;
    try {
      const res = await api.deleteFamilyTransaction(txId);
      setHub(res);
      showToast(res.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTarget);
    if (!goalTitle.trim() || isNaN(target) || target <= 0) return;
    try {
      const res = await api.createFamilyGoal({
        title: goalTitle.trim(),
        target_amount: target,
        current_amount: parseFloat(goalInitial) || 0,
        target_date: goalDate,
      });
      setHub(res);
      setAddGoalOpen(false);
      setGoalTitle('');
      setGoalTarget('');
      setGoalInitial('0');
      showToast(res.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleContributeGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoalId) return;
    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0) return;
    try {
      const res = await api.contributeFamilyGoal(contributeGoalId, {
        amount: amt,
        member_id: contribMemberId,
      });
      setHub(res);
      setContributeGoalId(null);
      setContribAmount('');
      showToast(res.message);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm(isEn ? 'Delete this shared family goal?' : 'یہ مشترکہ ہدف حذف کریں؟')) return;
    try {
      const res = await api.deleteFamilyGoal(goalId);
      setHub(res);
      showToast(res.message);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading && !hub) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 mt-3 font-semibold">
          {isEn ? 'Loading Family Sharing Hub...' : 'فیملی شیئرنگ لوڈ ہو رہا ہے...'}
        </p>
      </div>
    );
  }

  // Onboarding if user has no family group yet
  if (!hub?.family) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            {isEn ? 'Family Sharing & Household Hub' : 'فیملی شیئرنگ ہب'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {isEn ? 'Manage Household Finances Together' : 'گھر کے مالیات ایک ساتھ سنبھالیں'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            {isEn
              ? 'Create a shared family budget hub, invite parents, spouse, or siblings, set individual spending allowances, split household bills, and save toward joint goals.'
              : 'مشترکہ فیملی بجٹ بنائیں، اہلِ خانہ کو شامل کریں، اخراجات تقسیم کریں اور مشترکہ بچت اہداف حاصل کریں۔'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create New Family Hub */}
          <form
            onSubmit={handleCreateHub}
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                {isEn ? 'Create a Family Hub' : 'نیا فیملی ہب بنائیں'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn ? 'Start a shared household space and invite members.' : 'گھر کے افراد کو مدعو کرنے کے لیے نیا ہب شروع کریں۔'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEn ? 'Family Hub Name' : 'فیملی ہب کا نام'}
              </label>
              <input
                type="text"
                required
                value={newHubName}
                onChange={(e) => setNewHubName(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEn ? `Monthly Household Budget (${currency})` : `ماہانہ مشترکہ بجٹ (${currency})`}
              </label>
              <input
                type="number"
                required
                value={newHubBudget}
                onChange={(e) => setNewHubBudget(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              {isEn ? 'Create Family Hub' : 'فیملی ہب بنائیں'}
            </button>
          </form>

          {/* Join by Invite Code */}
          <form
            onSubmit={handleJoinHub}
            className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">
                  {isEn ? 'Join Existing Family Hub' : 'موجودہ فیملی ہب میں شامل ہوں'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEn ? 'Enter the invite code shared by your family admin.' : 'فیملی ایڈمن کی طرف سے دیا گیا دعوتی کوڈ درج کریں۔'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? 'Family Invite Code' : 'فیملی دعوتی کوڈ'}
                </label>
                <input
                  type="text"
                  required
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. FAM-8842-PK"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold uppercase"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              {isEn ? 'Join Family Hub' : 'شامل ہوں'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { family, members, transactions, goals, summary } = hub;
  const activeMembersCount = Math.max(1, members.length);
  const filteredTransactions = transactions.filter((t) => {
    if (txFilterType !== 'all' && t.type !== txFilterType) return false;
    if (txFilterMember !== 'all' && t.member_id !== txFilterMember) return false;
    return true;
  });

  const parsedTxAmt = parseFloat(txAmount) || 0;
  const splitSharePreview =
    parsedTxAmt > 0 && txSplitEqually ? Math.round(parsedTxAmt / activeMembersCount) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 1. Header & Invite Code Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {family.name}
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {members.length} {isEn ? 'Members' : 'افراد'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {isEn
              ? 'Shared household budgets, member spending allowances, bill splitting & joint family goals.'
              : 'مشترکہ گھریلو بجٹ، اخراجات کی حد، بلوں کی تقسیم اور مشترکہ بچت کے اہداف۔'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Invite Code Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-400 font-semibold">{isEn ? 'Invite:' : 'کوڈ:'}</span>
            <span className="font-mono font-black text-slate-800">{family.invite_code}</span>
            <button
              onClick={handleCopyCode}
              title={isEn ? 'Copy Invite Code' : 'کوڈ کاپی کریں'}
              className="text-indigo-600 hover:text-indigo-800 p-0.5 rounded"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isEn ? 'Join Hub' : 'کوڈ سے جڑیں'}</span>
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>{isEn ? 'Hub Settings' : 'سیٹنگز'}</span>
          </button>

          <button
            onClick={() => setAddMemberOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isEn ? 'Invite Member' : 'ممبر شامل کریں'}</span>
          </button>

          <button
            onClick={() => {
              setTxType('expense');
              setAddTxOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEn ? 'Log Shared Entry' : 'مشترکہ اندراج'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 3 Family Financial Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Family Pool Income */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/60 border-2 border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
                  {isEn ? 'Family Pool Income' : 'مشترکہ فیملی فنڈ'}
                </span>
                <div className="text-[11px] text-slate-500">
                  {isEn ? 'Monthly contributions from members' : 'اراکین کی ماہانہ جمع شدہ رقم'}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-emerald-700 font-mono">
            {formatMoney(summary.totalPoolIncome)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">{isEn ? 'Shared pool inflow' : 'اس ماہ کی آمدنی'}</span>
            <button
              onClick={() => {
                setTxType('income');
                setTxCategory('Household Pool');
                setAddTxOpen(true);
              }}
              className="font-bold text-emerald-700 hover:underline"
            >
              {isEn ? '+ Add Contribution' : '+ فنڈ شامل کریں'}
            </button>
          </div>
        </div>

        {/* Card 2: Shared Household Expenses */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-500/10 via-white to-rose-50/60 border-2 border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-rose-800">
                  {isEn ? 'Shared Expenses' : 'مشترکہ اخراجات'}
                </span>
                <div className="text-[11px] text-slate-500">
                  {isEn ? `Monthly budget: ${formatMoney(family.shared_monthly_budget)}` : `ماہانہ بجٹ: ${formatMoney(family.shared_monthly_budget)}`}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono">
              {summary.budgetUtilization}%
            </span>
          </div>
          <div className="mt-4 text-3xl font-black text-rose-700 font-mono">
            {formatMoney(summary.totalSharedExpense)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-rose-100">
            <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  summary.budgetUtilization >= 90 ? 'bg-rose-600' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, summary.budgetUtilization)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Net Family Balance */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-white to-sky-50/60 border-2 border-indigo-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-900">
                  {isEn ? 'Net Family Balance' : 'خالص فیملی بچت'}
                </span>
                <div className="text-[11px] text-slate-500">
                  {isEn ? 'Pool surplus after shared expenses' : 'اخراجات کے بعد باقی رقم'}
                </div>
              </div>
            </div>
          </div>
          <div
            className={`mt-4 text-3xl font-black font-mono ${
              summary.netFamilySavings >= 0 ? 'text-indigo-900' : 'text-rose-700'
            }`}
          >
            {formatMoney(summary.netFamilySavings)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-indigo-100 flex items-center justify-between text-xs text-slate-600">
            <span>{isEn ? 'Remaining Budget:' : 'باقی بجٹ:'}</span>
            <span className="font-mono font-bold text-indigo-700">
              {formatMoney(summary.remainingBudget)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Family Members & Spending Allowance Grid */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              {isEn ? 'Family Members & Monthly Allowances' : 'خاندان کے اراکین اور ماہانہ حد'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEn
                ? 'Track each member’s monthly spending against their allowance and manage permissions.'
                : 'ہر رکن کے اخراجات، جمع کردہ رقم اور اجازتوں کو کنٹرول کریں۔'}
            </p>
          </div>
          <button
            onClick={() => setAddMemberOpen(true)}
            className="self-start sm:self-auto text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isEn ? '+ Add Member' : '+ نیا رکن'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map((m) => {
            const spent = m.spent_this_month || 0;
            const contributed = m.contributed_this_month || 0;
            const pct = m.spending_limit > 0 ? Math.round((spent / m.spending_limit) * 100) : 0;
            const overLimit = m.spending_limit > 0 && spent > m.spending_limit;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  overLimit ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl ${m.avatar_color || 'bg-indigo-600'} text-white font-black flex items-center justify-center text-sm shrink-0`}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate">{m.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <span className="font-semibold text-indigo-700">{m.relation}</span>
                          <span>·</span>
                          <span className="capitalize">{m.role}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        m.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {m.status === 'active' ? (isEn ? 'Active' : 'فعال') : isEn ? 'Invited' : 'مدعو'}
                    </span>
                  </div>

                  {m.email && (
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-2">{m.email}</div>
                  )}

                  {/* Monthly Spending Progress */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">{isEn ? 'Spent:' : 'خرچ:'}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatMoney(spent)} / {formatMoney(m.spending_limit)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          overLimit ? 'bg-rose-600' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    {overLimit && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 pt-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{isEn ? 'Allowance exceeded' : 'حد سے تجاوز'}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/70">
                    <span className="text-slate-500">{isEn ? 'Contributed:' : 'جمع کرائے:'}</span>
                    <span className="font-mono font-bold text-emerald-700">{formatMoney(contributed)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 flex items-center justify-between gap-2 border-t border-slate-200/70">
                  <button
                    onClick={() => {
                      setEditingMember(m);
                      setEditLimitVal(String(m.spending_limit));
                      setEditRoleVal(m.role);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    {isEn ? 'Edit Limit / Role' : 'حد / کردار بدلیں'}
                  </button>
                  {m.relation !== 'Owner' && (
                    <button
                      onClick={() => handleRemoveMember(m.id, m.name)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      title={isEn ? 'Remove member' : 'ہٹائیں'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Shared Family Savings Goals */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              {isEn ? 'Shared Family Savings Vaults' : 'مشترکہ خاندانی بچت کے اہداف'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEn
                ? 'Pool contributions together for household reserves, home upgrades, or family milestones.'
                : 'گھریلو ایمرجنسی فنڈ اور بڑے اہداف کے لیے مل کر بچت کریں۔'}
            </p>
          </div>
          <button
            onClick={() => setAddGoalOpen(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEn ? 'New Shared Goal' : 'نیا مشترکہ ہدف'}</span>
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
            {isEn ? 'No shared family savings goals yet.' : 'ابھی کوئی مشترکہ بچت ہدف نہیں بنایا گیا۔'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => {
              const pct = g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0;
              return (
                <div key={g.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{g.title}</h3>
                      <span className="text-[11px] text-slate-500">
                        {isEn ? 'Target Date:' : 'ہدف کی تاریخ:'} {g.target_date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg font-mono">
                        {pct}%
                      </span>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-slate-800">{formatMoney(g.current_amount)}</span>
                      <span className="font-mono text-slate-500">{formatMoney(g.target_amount)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {g.contributors && g.contributors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {g.contributors.map((c, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                        >
                          {c.member_name}: <strong className="font-mono">{formatMoney(c.amount)}</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setContributeGoalId(g.id);
                      setContribAmount('');
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Contribute to Vault' : 'رقم جمع کرائیں'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Shared Family Ledger */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base">
              {isEn ? 'Shared Family Ledger' : 'مشترکہ فیملی کھاتہ'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEn
                ? 'All household pool deposits, shared expenses, and equal split calculations.'
                : 'تمام مشترکہ آمدنی، گھریلو اخراجات اور بلوں کی تفصیلات۔'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs">
              {(['all', 'expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTxFilterType(t)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                    txFilterType === t ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  {t === 'all'
                    ? isEn
                      ? 'All'
                      : 'تمام'
                    : t === 'expense'
                    ? isEn
                      ? 'Expenses'
                      : 'اخراجات'
                    : isEn
                    ? 'Contributions'
                    : 'فنڈز'}
                </button>
              ))}
            </div>

            <select
              value={txFilterMember}
              onChange={(e) => setTxFilterMember(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <option value="all">{isEn ? 'All Members' : 'تمام اراکین'}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                <th className="pb-3 px-3">{isEn ? 'Member' : 'رکن'}</th>
                <th className="pb-3 px-3">{isEn ? 'Description' : 'تفصیل'}</th>
                <th className="pb-3 px-3">{isEn ? 'Category' : 'کیٹیگری'}</th>
                <th className="pb-3 px-3">{isEn ? 'Split / Method' : 'طریقہ / تقسیم'}</th>
                <th className="pb-3 px-3">{isEn ? 'Date' : 'تاریخ'}</th>
                <th className="pb-3 px-3 text-right">{isEn ? 'Amount' : 'رقم'}</th>
                <th className="pb-3 px-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {isEn ? 'No shared family transactions recorded yet.' : 'ابھی کوئی مشترکہ لین دین درج نہیں ہوا۔'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-800">{tx.member_name}</td>
                    <td className="py-3 px-3 font-medium text-slate-700">{tx.description}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{tx.payment_method}</span>
                        {tx.split_equally && tx.type === 'expense' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                            <Split className="w-2.5 h-2.5" />
                            {formatMoney(tx.amount / activeMembersCount)}/ea
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{tx.date}</td>
                    <td
                      className={`py-3 px-3 text-right font-black font-mono ${
                        tx.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {formatMoney(tx.amount)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleDeleteFamilyTx(tx.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* Add Member Modal */}
      {addMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleAddMember}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isEn ? 'Invite / Add Family Member' : 'فیملی ممبر شامل کریں'}
              </h3>
              <button type="button" onClick={() => setAddMemberOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? 'Full Name *' : 'پورا نام *'}
                </label>
                <input
                  type="text"
                  required
                  value={memName}
                  onChange={(e) => setMemName(e.target.value)}
                  placeholder="e.g. Sara Ahmad"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? 'Email (Optional — links account if registered)' : 'ای میل (اختیاری)'}
                </label>
                <input
                  type="email"
                  value={memEmail}
                  onChange={(e) => setMemEmail(e.target.value)}
                  placeholder="member@gmail.com"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? 'Relation' : 'رشتہ'}
                  </label>
                  <select
                    value={memRelation}
                    onChange={(e) => setMemRelation(e.target.value as FamilyRelation)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? 'Access Role' : 'اختیارات'}
                  </label>
                  <select
                    value={memRole}
                    onChange={(e) => setMemRole(e.target.value as FamilyRole)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  >
                    <option value="admin">Admin</option>
                    <option value="contributor">Contributor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? `Monthly Spending Allowance (${currency})` : `ماہانہ اخراجات کی حد (${currency})`}
                </label>
                <input
                  type="number"
                  required
                  value={memLimit}
                  onChange={(e) => setMemLimit(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddMemberOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                {isEn ? 'Add Member' : 'شامل کریں'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Member Limit/Role Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveMemberEdit}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isEn ? `Edit ${editingMember.name}` : editingMember.name}
              </h3>
              <button type="button" onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEn ? `Monthly Allowance (${currency})` : 'ماہانہ حد'}
              </label>
              <input
                type="number"
                required
                value={editLimitVal}
                onChange={(e) => setEditLimitVal(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEn ? 'Role' : 'کردار'}
              </label>
              <select
                value={editRoleVal}
                onChange={(e) => setEditRoleVal(e.target.value as FamilyRole)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="admin">Admin</option>
                <option value="contributor">Contributor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingMember(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                {isEn ? 'Save' : 'محفوظ کریں'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Shared Family Transaction Modal */}
      {addTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleAddFamilyTx}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-100 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isEn ? 'Log Shared Family Entry' : 'مشترکہ فیملی اندراج'}
              </h3>
              <button type="button" onClick={() => setAddTxOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  setTxType('expense');
                  setTxCategory('Groceries & Mart');
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold ${
                  txType === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-600'
                }`}
              >
                {isEn ? 'Shared Expense (-)' : 'مشترکہ خرچ (-)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTxType('income');
                  setTxCategory('Household Pool');
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold ${
                  txType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                {isEn ? 'Pool Contribution (+)' : 'فیملی فنڈ (+)'}
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? 'Member' : 'رکن'}
                  </label>
                  <select
                    value={txMemberId}
                    onChange={(e) => setTxMemberId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.relation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? `Amount (${currency}) *` : `رقم (${currency}) *`}
                  </label>
                  <input
                    type="number"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? 'Category' : 'کیٹیگری'}
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  >
                    {txType === 'expense' ? (
                      <>
                        <option value="Groceries & Mart">Groceries & Mart</option>
                        <option value="Bills & Utilities">Bills & Utilities</option>
                        <option value="House Rent & Maintenance">House Rent & Maintenance</option>
                        <option value="Transport & Fuel">Transport & Fuel</option>
                        <option value="Medical & Health">Medical & Health</option>
                        <option value="Education & Fees">Education & Fees</option>
                        <option value="Dining & Family Outing">Dining & Family Outing</option>
                        <option value="Other">Other</option>
                      </>
                    ) : (
                      <>
                        <option value="Household Pool">Household Pool</option>
                        <option value="Salary Contribution">Salary Contribution</option>
                        <option value="Bonus / Reserve">Bonus / Reserve</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? 'Date' : 'تاریخ'}
                  </label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? 'Description *' : 'تفصیل *'}
                </label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder={txType === 'expense' ? 'e.g. Monthly electricity bill & groceries' : 'e.g. Monthly household contribution'}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? 'Payment Method' : 'طریقہ ادائیگی'}
                </label>
                <select
                  value={txMethod}
                  onChange={(e) => setTxMethod(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              {txType === 'expense' && (
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={txSplitEqually}
                      onChange={(e) => setTxSplitEqually(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span className="font-semibold text-indigo-950">
                      {isEn ? `Split equally (${activeMembersCount} members)` : `برابر تقسیم کریں (${activeMembersCount} افراد)`}
                    </span>
                  </div>
                  {splitSharePreview > 0 && (
                    <span className="font-mono font-bold text-indigo-700">
                      {formatMoney(splitSharePreview)}/ea
                    </span>
                  )}
                </label>
              )}

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={txSyncPersonal}
                  onChange={(e) => setTxSyncPersonal(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="font-medium text-slate-700">
                  {isEn ? 'Also record in my personal ledger' : 'میرے ذاتی کھاتے میں بھی درج کریں'}
                </span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setAddTxOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold">
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                {isEn ? 'Save Shared Entry' : 'محفوظ کریں'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Shared Goal Modal */}
      {addGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateGoal}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isEn ? 'Create Shared Family Goal' : 'نیا مشترکہ بچت ہدف'}
              </h3>
              <button type="button" onClick={() => setAddGoalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? 'Goal Title *' : 'ہدف کا عنوان *'}
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Family Emergency Reserve or Home Upgrade"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? `Target (${currency}) *` : `مطلوبہ رقم (${currency}) *`}
                  </label>
                  <input
                    type="number"
                    required
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isEn ? `Initial Deposit (${currency})` : 'ابتدائی رقم'}
                  </label>
                  <input
                    type="number"
                    value={goalInitial}
                    onChange={(e) => setGoalInitial(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEn ? 'Target Date' : 'ہدف کی تاریخ'}
                </label>
                <input
                  type="date"
                  required
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAddGoalOpen(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                {isEn ? 'Create Goal' : 'ہدف بنائیں'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contribute to Shared Goal Modal */}
      {contributeGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleContributeGoal}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isEn ? 'Contribute to Shared Vault' : 'مشترکہ بچت میں رقم جمع کرائیں'}
              </h3>
              <button type="button" onClick={() => setContributeGoalId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEn ? 'Contributor' : 'جمع کرانے والا رکن'}
              </label>
              <select
                value={contribMemberId}
                onChange={(e) => setContribMemberId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.relation})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEn ? `Amount (${currency}) *` : `رقم (${currency}) *`}
              </label>
              <input
                type="number"
                required
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                placeholder="5000"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setContributeGoalId(null)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                {isEn ? 'Deposit Now' : 'جمع کرائیں'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hub Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleUpdateHubSettings}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isEn ? 'Family Hub Settings' : 'فیملی ہب سیٹنگز'}
              </h3>
              <button type="button" onClick={() => setSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEn ? 'Family Hub Name' : 'فیملی ہب کا نام'}
              </label>
              <input
                type="text"
                required
                value={editHubName}
                onChange={(e) => setEditHubName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEn ? `Shared Monthly Budget (${currency})` : `ماہانہ مشترکہ بجٹ (${currency})`}
              </label>
              <input
                type="number"
                required
                value={editHubBudget}
                onChange={(e) => setEditHubBudget(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-700">{isEn ? 'Invite Code' : 'دعوتی کوڈ'}</div>
                <div className="font-mono text-xs font-black text-indigo-700">{family.invite_code}</div>
              </div>
              <button
                type="button"
                onClick={handleRegenerateCode}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-indigo-700 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{isEn ? 'Regenerate' : 'نیا کوڈ'}</span>
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSettingsOpen(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                {isEn ? 'Save Changes' : 'محفوظ کریں'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Join Hub by Code Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleJoinHub}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isEn ? 'Join a Family Hub by Code' : 'کوڈ کے ذریعے فیملی ہب میں شامل ہوں'}
              </h3>
              <button type="button" onClick={() => setJoinModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isEn ? 'Invite Code *' : 'دعوتی کوڈ *'}
              </label>
              <input
                type="text"
                required
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="FAM-8842-PK"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold uppercase"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setJoinModalOpen(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold">
                {isEn ? 'Cancel' : 'منسوخ'}
              </button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                {isEn ? 'Join Hub' : 'شامل ہوں'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
