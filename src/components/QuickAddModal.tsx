import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction } from '../types';
import { X, Check, Upload, Tag } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTx: Transaction) => void;
  initialType?: 'expense' | 'income' | 'transfer';
  currency?: string;
  prefill?: Partial<Transaction>;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'expense',
  currency = 'PKR',
  prefill,
}) => {
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(prefill?.type || initialType);
  const [amount, setAmount] = useState<string>(prefill?.amount ? String(prefill.amount) : '');
  const [category, setCategory] = useState<string>(
    prefill?.category || (initialType === 'income' ? 'Salary' : initialType === 'transfer' ? 'Savings Vault Transfer' : 'Food')
  );
  const [description, setDescription] = useState<string>(prefill?.description || '');
  const [date, setDate] = useState<string>(prefill?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<any>(prefill?.payment_method || 'Cash');
  const [merchant, setMerchant] = useState<string>(prefill?.merchant || '');
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const nextType = prefill?.type || initialType;
      setType(nextType);
      setAmount(prefill?.amount ? String(prefill.amount) : '');
      setCategory(
        prefill?.category ||
          (nextType === 'income'
            ? 'Salary'
            : nextType === 'transfer'
            ? 'Savings Vault Transfer'
            : 'Food')
      );
      setDescription(prefill?.description || '');
      setDate(prefill?.date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(prefill?.payment_method || 'Cash');
      setMerchant(prefill?.merchant || '');
      setReceiptBase64(null);
      setError(null);
    }
  }, [isOpen, initialType, prefill]);

  if (!isOpen) return null;

  const expenseCategories = [
    'Food',
    'Grocery',
    'Transport',
    'Bills & Utilities',
    'Hostel and rent',
    'Internet and mobile',
    'Education & Fees',
    'Books and stationery',
    'Shopping',
    'Entertainment',
    'Health',
    'Other',
  ];

  const incomeCategories = [
    'Salary',
    'Business Revenue',
    'Freelancing',
    'Pocket money',
    'Investment & Dividends',
    'Bonus / Gift',
    'Other',
  ];

  const transferCategories = [
    'Savings Vault Transfer',
    'Family Sharing Pool',
    'Bank-to-Wallet',
    'Wallet-to-Cash',
    'Other',
  ];

  const quickPresets = [
    { label: 'Chai & Snacks', amt: '150', cat: 'Food', desc: 'Tea & bakery snacks' },
    { label: 'Lunch / Meal', amt: '450', cat: 'Food', desc: 'Daily lunch & beverage' },
    { label: 'Fuel / Ride', amt: '500', cat: 'Transport', desc: 'Fuel & local commute' },
    { label: 'Groceries', amt: '1200', cat: 'Grocery', desc: 'Household essentials' },
    { label: 'Mobile Bundle', amt: '1450', cat: 'Internet and mobile', desc: 'Monthly 4G / fiber package' },
  ];

  const handleApplyPreset = (p: typeof quickPresets[0]) => {
    setAmount(p.amt);
    setCategory(p.cat);
    setDescription(p.desc);
    setType('expense');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size too large. Please upload an image under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a brief description.');
      return;
    }

    setLoading(true);

    try {
      let receiptId: string | undefined = undefined;

      // If a receipt image was attached, upload it first
      if (receiptBase64) {
        try {
          const rcRes = await api.processReceipt({
            file_name: `receipt_${Date.now()}.jpg`,
            file_data_base64: receiptBase64,
            mime_type: 'image/jpeg',
            file_size: receiptBase64.length,
          });
          receiptId = rcRes.data.id;
        } catch (rcErr) {
          console.warn('Could not save receipt image attachment:', rcErr);
        }
      }

      const res = await api.createTransaction({
        type,
        amount: parsedAmount,
        category,
        description: description.trim(),
        date,
        payment_method: paymentMethod,
        merchant: merchant.trim() || undefined,
        receipt_id: receiptId,
      });

      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Record Financial Transaction
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Type Selector (Segmented control) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Food');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Salary');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income (+)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('transfer');
                setCategory('Savings Vault Transfer');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                type === 'transfer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transfer (⇄)
            </button>
          </div>

          {/* Quick Presets (Only on expense mode) */}
          {type === 'expense' && (
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Quick Expense Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-[11px] font-medium px-2 py-1 rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200/70 transition-colors"
                  >
                    {p.label} ({currency} {p.amt})
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount ({currency}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-base font-bold text-slate-400">
                  {currency === 'PKR' ? 'Rs' : currency}
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-lg font-bold pl-12 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>

            {/* Category and Date row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium"
                >
                  {(type === 'expense'
                    ? expenseCategories
                    : type === 'income'
                    ? incomeCategories
                    : transferCategories
                  ).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Purpose *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Biryani meal with batchmates at campus cafe"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
            </div>

            {/* Payment Method & Merchant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                >
                  <option value="Cash">Cash in Hand</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Bank Transfer">Bank Transfer (HBL/Nayapay/SadaPay)</option>
                  <option value="Debit Card">Debit / ATM Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merchant / Source (Optional)
                </label>
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. FAST Cafe, Zong, Book Bank"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
                />
              </div>
            </div>

            {/* Receipt Attachment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attach Receipt Photo (Optional)
              </label>
              {receiptBase64 ? (
                <div className="relative inline-block border border-slate-200 rounded-lg overflow-hidden">
                  <img
                    src={receiptBase64}
                    alt="Receipt preview"
                    className="h-20 w-auto object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setReceiptBase64(null)}
                    className="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border border-dashed border-slate-300 hover:border-indigo-400 p-2.5 rounded-xl cursor-pointer text-xs text-slate-600 bg-slate-50/50 hover:bg-indigo-50/30 transition-colors">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>Upload bill or receipt photo (JPEG/PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 text-xs font-semibold py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 text-xs font-semibold py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20"
              >
                <Check className="w-4 h-4" />
                {loading ? 'Recording...' : 'Record Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
