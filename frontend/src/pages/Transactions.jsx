import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import TransactionModal from '../components/TransactionModal';
import toast from 'react-hot-toast';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '', tag: '' });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, sort: '-date', ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) });
      const { data } = await api.get(`/transactions?${params}`);
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.categories)); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted');
      fetchTransactions();
    } catch { toast.error('Delete failed'); }
  };

  const handleExport = () => window.open('/api/transactions/export/csv', '_blank');

  const resetFilters = () => { setFilters({ type: '', category: '', startDate: '', endDate: '', tag: '' }); setPage(1); };

  const pages = Math.ceil(total / 15);

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Transactions</h1>
          <p className="text-gray-400 mt-1">{total} total transactions</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            📥 Export CSV
          </button>
          <button onClick={() => { setEditItem(null); setModal(true); }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/30">
            + Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <select value={filters.type} onChange={e => { setFilters({...filters, type: e.target.value}); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={filters.category} onChange={e => { setFilters({...filters, category: e.target.value}); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
          <input type="date" value={filters.startDate} onChange={e => { setFilters({...filters, startDate: e.target.value}); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            placeholder="Start date" />
          <input type="date" value={filters.endDate} onChange={e => { setFilters({...filters, endDate: e.target.value}); setPage(1); }}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500" />
          <div className="flex gap-2">
            <input type="text" value={filters.tag} onChange={e => { setFilters({...filters, tag: e.target.value}); setPage(1); }}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              placeholder="Tag filter" />
            {Object.values(filters).some(v => v) && (
              <button onClick={resetFilters} className="bg-red-500/15 text-red-400 hover:bg-red-500/25 px-3 rounded-xl text-sm transition-colors">✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400 font-medium">No transactions found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Date</th>
                    <th className="text-left text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Category</th>
                    <th className="text-left text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Type</th>
                    <th className="text-left text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Notes</th>
                    <th className="text-left text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Tags</th>
                    <th className="text-right text-gray-400 text-xs font-medium px-6 py-4 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {transactions.map(t => (
                    <tr key={t._id} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(t.date)}</td>
                      <td className="px-6 py-4 text-white font-medium text-sm">{t.category}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          t.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          {t.type === 'income' ? '↑' : '↓'} {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm max-w-xs truncate">{t.notes || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(t.tags || []).map(tag => (
                            <span key={tag} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-md">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold font-mono text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, user?.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button onClick={() => { setEditItem(t); setModal(true); }}
                            className="text-gray-400 hover:text-white text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                          <button onClick={() => handleDelete(t._id)}
                            className="text-red-400 hover:text-red-300 text-sm bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-800">
              {transactions.map(t => (
                <div key={t._id} className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                    {t.type === 'income' ? '💚' : '🔴'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{t.category}</p>
                    <p className="text-gray-500 text-xs">{formatDate(t.date)}{t.notes ? ` · ${t.notes}` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold font-mono text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, user?.currency)}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => { setEditItem(t); setModal(true); }} className="text-gray-500 text-xs hover:text-white">Edit</button>
                      <button onClick={() => handleDelete(t._id)} className="text-red-500 text-xs hover:text-red-400">Del</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-800">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm transition-colors">← Prev</button>
                <span className="text-gray-400 text-sm">Page {page} of {pages}</span>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                  className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm transition-colors">Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {modal && <TransactionModal transaction={editItem} onClose={() => { setModal(false); setEditItem(null); }} onSaved={fetchTransactions} />}
    </div>
  );
}
