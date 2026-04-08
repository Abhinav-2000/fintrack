import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', amount: '', month: new Date().getMonth(), year: new Date().getFullYear() });

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        api.get(`/budgets?month=${viewMonth}&year=${viewYear}`),
        api.get('/categories')
      ]);
      setBudgets(b.data.budgets);
      setCategories(c.data.categories.filter(c => c.type !== 'income'));
    } catch { toast.error('Failed to load budgets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudgets(); }, [viewMonth, viewYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/budgets', { ...form, amount: parseFloat(form.amount) });
      toast.success('Budget saved!');
      setShowForm(false);
      setForm({ category: '', amount: '', month: viewMonth, year: viewYear });
      fetchBudgets();
    } catch { toast.error('Failed to save budget'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget removed');
      fetchBudgets();
    } catch { toast.error('Delete failed'); }
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Budgets</h1>
          <p className="text-gray-400 mt-1">Set monthly spending limits per category</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/30">
          + Set Budget
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); }}
          className="bg-gray-800 hover:bg-gray-700 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-colors">←</button>
        <p className="text-white font-semibold text-lg min-w-36 text-center">{months[viewMonth]} {viewYear}</p>
        <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); }}
          className="bg-gray-800 hover:bg-gray-700 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-colors">→</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-300 font-medium">No budgets set for {months[viewMonth]}</p>
          <p className="text-gray-500 text-sm mt-1">Set spending limits to stay on track</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm">Create your first budget →</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {budgets.map(b => {
            const pct = Math.min((b.spent / b.amount) * 100, 100);
            const exceeded = b.exceeded;
            return (
              <div key={b._id} className={`bg-gray-900 border rounded-2xl p-6 ${exceeded ? 'border-red-500/30' : 'border-gray-800'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-semibold">{b.category}</p>
                    <p className="text-gray-400 text-sm mt-0.5">
                      {formatCurrency(b.spent, user?.currency)} of {formatCurrency(b.amount, user?.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {exceeded && <span className="text-xs bg-red-500/15 text-red-400 px-2 py-1 rounded-lg font-medium">Exceeded ⚠️</span>}
                    <button onClick={() => handleDelete(b._id)} className="text-gray-600 hover:text-red-400 transition-colors text-lg">×</button>
                  </div>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${exceeded ? 'bg-red-500' : pct > 75 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
                <p className={`text-xs mt-2 text-right font-medium ${exceeded ? 'text-red-400' : pct > 75 ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {Math.round(pct)}% used
                  {exceeded ? ` · Over by ${formatCurrency(b.spent - b.amount, user?.currency)}` : ` · ${formatCurrency(b.amount - b.spent, user?.currency)} remaining`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Budget Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-white font-semibold">Set Budget</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Monthly Limit (₹)</label>
                <input type="number" min="1" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. 5000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Month</label>
                  <select value={form.month} onChange={e => setForm({...form, month: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Year</label>
                  <input type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl transition-all">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
