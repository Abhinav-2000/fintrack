import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function TransactionModal({ transaction, onClose, onSaved }) {
  const isEdit = !!transaction?._id;
  const [form, setForm] = useState({
    amount: '', type: 'expense', category: '', date: new Date().toISOString().split('T')[0],
    notes: '', tags: '', isRecurring: false, recurringFrequency: 'monthly'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.categories));
    if (transaction) {
      setForm({
        amount: transaction.amount || '',
        type: transaction.type || 'expense',
        category: transaction.category || '',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: transaction.notes || '',
        tags: (transaction.tags || []).join(', '),
        isRecurring: transaction.isRecurring || false,
        recurringFrequency: transaction.recurringFrequency || 'monthly'
      });
    }
  }, [transaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Please select a category');
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      let res;
      if (isEdit) res = await api.put(`/transactions/${transaction._id}`, payload);
      else res = await api.post('/transactions', payload);

      if (res.data.budgetExceeded) {
        toast.error(`⚠️ Budget exceeded for ${form.category}! Limit: ₹${res.data.budgetAmount}`, { duration: 5000 });
      } else {
        toast.success(isEdit ? 'Transaction updated!' : 'Transaction added!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const filteredCats = categories.filter(c => c.type === form.type || c.type === 'both');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">{isEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-700">
            {['expense', 'income'].map(t => (
              <button key={t} type="button" onClick={() => setForm({...form, type: t, category: ''})}
                className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-all ${
                  form.type === t
                    ? t === 'income' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}>{t}</button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
              <input type="number" min="0.01" step="0.01" required value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pl-8 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="0.00" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredCats.map(c => (
                <button key={c._id} type="button" onClick={() => setForm({...form, category: c.name})}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all border ${
                    form.category === c.name
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
                  }`}>
                  <span className="text-lg">{c.icon}</span>
                  <span className="truncate w-full text-center">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Date</label>
            <input type="date" required value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes <span className="text-gray-500">(optional)</span></label>
            <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. Lunch at office" />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Tags <span className="text-gray-500">(comma-separated)</span></label>
            <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="work, personal, urgent" />
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm({...form, isRecurring: !form.isRecurring})}
              className={`relative w-10 h-6 rounded-full transition-colors ${form.isRecurring ? 'bg-emerald-500' : 'bg-gray-700'}`}>
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isRecurring ? 'translate-x-4' : ''}`} />
            </button>
            <span className="text-gray-300 text-sm">Recurring</span>
            {form.isRecurring && (
              <select value={form.recurringFrequency} onChange={e => setForm({...form, recurringFrequency: e.target.value})}
                className="ml-auto bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-emerald-500">
                {['daily','weekly','monthly','yearly'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
