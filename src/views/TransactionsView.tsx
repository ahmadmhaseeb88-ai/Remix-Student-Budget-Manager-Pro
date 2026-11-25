import React, { useState, useEffect } from 'react';
import { Transaction, User } from '../types';
import { api } from '../services/api';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Receipt as ReceiptIcon,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface TransactionsViewProps {
  user: User;
  onOpenQuickAdd: (type?: 'expense' | 'income') => void;
  onOpenScanner: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  user,
  onOpenQuickAdd,
  onOpenScanner,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  // Receipt preview modal
  const [previewReceiptId, setPreviewReceiptId] = useState<string | null>(null);

  // CSV Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const currency = user.currency || 'PKR';
  const formatMoney = (amount: number) => {
    return `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amount).toLocaleString()}`;
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTransactions({
        type: typeFilter,
        category: categoryFilter,
        payment_method: paymentMethodFilter,
        search,
        startDate,
        endDate,
        sort,
        page,
        limit: 15,
      });
      setTransactions(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, paymentMethodFilter, sort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await api.deleteTransaction(id);
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction');
    }
  };

  const handleExportCsv = () => {
    const token = api.getToken();
    window.open(`/api/transactions/export-csv?token=${token}`, '_blank');
  };

  const handleCsvImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvRawText.trim()) return;

    setImporting(true);
    setImportResult(null);

    try {
      // Simple CSV parser
      const lines = csvRawText.trim().split('\n');
      const rows: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().includes('amount'))) continue; // skip header
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          rows.push({
            date: parts[0] || new Date().toISOString().split('T')[0],
            type: parts[1]?.toLowerCase() === 'income' ? 'income' : 'expense',
            amount: parseFloat(parts[2]) || 0,
            category: parts[3] || 'Other',
            description: parts[4] || 'Imported transaction',
            payment_method: parts[5] || 'Cash',
          });
        }
      }

      const res = await api.importTransactionsCsv(rows);
      setImportResult(res.message);
      fetchTransactions();
      setTimeout(() => {
        setImportModalOpen(false);
        setCsvRawText('');
        setImportResult(null);
      }, 1500);
    } catch (err: any) {
      setImportResult(`Error: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Ledger & Transactions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit, search, filter, and export all recorded income, student allowances, and expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onOpenQuickAdd('expense')}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description, merchant, or category..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
            />
          </div>
          <button
            type="submit"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Type Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
              <option value="transfer">Transfers Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium"
            >
              <option value="all">All Categories</option>
              <option value="Food">Food & Mess</option>
              <option value="Transport">Transport & Metro</option>
              <option value="University fees">University Fees</option>
              <option value="Books and stationery">Books & Stationery</option>
              <option value="Hostel and rent">Hostel & Rent</option>
              <option value="Internet and mobile">Internet & Mobile</option>
              <option value="Pocket money">Pocket Money</option>
              <option value="Freelancing">Freelancing</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium"
            >
              <option value="all">All Methods</option>
              <option value="Cash">Cash in Hand</option>
              <option value="EasyPaisa">EasyPaisa</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Debit Card">Debit Card</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Sort By</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium"
            >
              <option value="date_desc">Newest Date First</option>
              <option value="date_asc">Oldest Date First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading ledger records...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No transactions match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Merchant / Source</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tx.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-600 font-medium">{tx.category}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {tx.payment_method}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {tx.merchant || '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-bold ${
                          tx.type === 'income'
                            ? 'text-emerald-600'
                            : tx.type === 'transfer'
                            ? 'text-indigo-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '⇄ ' : '- '}
                        {formatMoney(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {tx.receipt_id ? (
                        <button
                          onClick={() => setPreviewReceiptId(tx.receipt_id!)}
                          className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                          title="View attached receipt document"
                        >
                          <ReceiptIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[10px]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total records)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CSV Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Bulk Import Transactions (CSV)</h3>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCsvImportSubmit} className="mt-4 space-y-3">
              <p className="text-xs text-slate-500">
                Paste CSV data formatted as:
                <br />
                <code className="bg-slate-100 px-2 py-0.5 rounded text-[11px] block mt-1 font-mono">
                  Date,Type,Amount,Category,Description,PaymentMethod
                </code>
              </p>

              <textarea
                rows={6}
                value={csvRawText}
                onChange={(e) => setCsvRawText(e.target.value)}
                placeholder={`2026-10-10,expense,350,Food,Campus cafeteria meal,Cash\n2026-10-11,expense,150,Transport,Metro bus recharge,EasyPaisa\n2026-10-12,income,5000,Freelancing,Bug fix for web client,Bank Transfer`}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
              />

              {importResult && (
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-semibold">
                  {importResult}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !csvRawText.trim()}
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {importing ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
