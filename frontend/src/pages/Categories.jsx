import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ICONS = ['🍔','🏠','✈️','🛍️','⚡','🏥','🎬','📚','💼','💻','📈','🎮','🚗','☕','🏋️','🐾','🎁','💡','🍕','🍣'];
const COLORS = ['#f97316','#8b5cf6','#06b6d4','#ec4899','#eab308','#ef4444','#a855f7','#3b82f6','#10b981','#14b8a6','#22c55e','#6b7280'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '💰', color: '#10b981', type: 'expense' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', form);
      toast.success('Category created!');
      setShowForm(false);
      setForm({ name: '', icon: '💰', color: '#10b981', type: 'expense' });
      fetchCategories();
    } catch { toast.error('Failed to create category'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const myCategories = categories.filter(c => c.userId);
  const defaultCategories = categories.filter(c => !c.userId);

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Categories</h1>
          <p className="text-gray-400 mt-1">Manage your transaction categories</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/30">
          + New Category
        </button>
      </div>

      {/* My Custom Categories */}
      <div className="mb-8">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-emerald-400">●</span> My Categories
          <span className="text-gray-600 font-normal normal-case tracking-normal">({myCategories.length})</span>
        </h2>
        {myCategories.length === 0 ? (
          <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-8 text-center">
            <p className="text-gray-500 text-sm">No custom categories yet.</p>
            <button onClick={() => setShowForm(true)} className="text-emerald-400 text-sm hover:text-emerald-300 mt-1">Create one →</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {myCategories.map(c => (
              <div key={c._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3 group hover:border-gray-700 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${c.color}20` }}>{c.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{c.name}</p>
                  <p className="text-gray-500 text-xs capitalize">{c.type}</p>
                </div>
                <button onClick={() => handleDelete(c._id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-lg">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default Categories */}
      <div>
        <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-gray-500">●</span> Default Categories
          <span className="text-gray-600 font-normal normal-case tracking-normal">({defaultCategories.length})</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {defaultCategories.map(c => (
            <div key={c._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3 opacity-75">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${c.color}20` }}>{c.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{c.name}</p>
                <p className="text-gray-500 text-xs capitalize">{c.type}</p>
              </div>
              <span className="text-xs text-gray-600">default</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-white font-semibold">New Category</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Gym, Coffee..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-700">
                  {['expense','income','both'].map(t => (
                    <button key={t} type="button" onClick={() => setForm({...form, type: t})}
                      className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${form.type === t ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm({...form, icon})}
                      className={`w-10 h-10 rounded-xl text-xl transition-all ${form.icon === icon ? 'bg-emerald-500/20 ring-2 ring-emerald-500' : 'bg-gray-800 hover:bg-gray-700'}`}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm({...form, color})}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''}`}
                      style={{ background: color }} />
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${form.color}20` }}>{form.icon}</div>
                <div>
                  <p className="text-white text-sm font-medium">{form.name || 'Category name'}</p>
                  <p className="text-gray-500 text-xs capitalize">{form.type}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl transition-all">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
