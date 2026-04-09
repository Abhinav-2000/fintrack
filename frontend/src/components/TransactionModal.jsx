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
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div style={{
        background: '#111827',
        border: '1px solid #374151',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '440px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>

        {/* HEADER - fixed, never scrolls */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #1f2937',
          flexShrink: 0
        }}>
          <span style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>
            {isEdit ? 'Edit Transaction' : 'New Transaction'}
          </span>
          <button onClick={onClose} style={{
            color: '#6b7280', background: 'none', border: 'none',
            fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px'
          }}>×</button>
        </div>

        {/* BODY - scrolls */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px' }}>
          <form onSubmit={handleSubmit} id="tx-form">

            {/* Type toggle */}
            <div style={{
              display: 'flex', borderRadius: '10px', overflow: 'hidden',
              border: '1px solid #374151', marginBottom: '10px'
            }}>
              {['expense', 'income'].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm({...form, type: t, category: ''})}
                  style={{
                    flex: 1, padding: '8px', fontSize: '13px', fontWeight: 600,
                    textTransform: 'capitalize', border: 'none', cursor: 'pointer',
                    background: form.type === t
                      ? (t === 'income' ? '#10b981' : '#ef4444')
                      : 'transparent',
                    color: form.type === t ? 'white' : '#9ca3af'
                  }}>{t}</button>
              ))}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: 500 }}>Amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px' }}>₹</span>
                <input type="number" min="0.01" step="0.01" required value={form.amount}
                  onChange={e => setForm({...form, amount: e.target.value})}
                  placeholder="0.00"
                  style={{
                    width: '100%', background: '#1f2937', border: '1px solid #374151',
                    borderRadius: '10px', padding: '8px 10px 8px 26px',
                    color: 'white', fontSize: '13px', boxSizing: 'border-box',
                    outline: 'none'
                  }} />
              </div>
            </div>

            {/* Category grid */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: 500 }}>Category</label>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px', maxHeight: '130px', overflowY: 'auto'
              }}>
                {filteredCats.map(c => (
                  <button key={c._id} type="button"
                    onClick={() => setForm({...form, category: c.name})}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: '2px', padding: '7px 4px', borderRadius: '10px',
                      fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                      border: form.category === c.name ? '1px solid #10b981' : '1px solid #374151',
                      background: form.category === c.name ? 'rgba(16,185,129,0.1)' : 'transparent',
                      color: form.category === c.name ? '#34d399' : '#9ca3af'
                    }}>
                    <span style={{ fontSize: '15px' }}>{c.icon}</span>
                    <span style={{ textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }}>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Notes row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: 500 }}>Date</label>
                <input type="date" required value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  style={{
                    width: '100%', background: '#1f2937', border: '1px solid #374151',
                    borderRadius: '10px', padding: '8px 10px', color: 'white',
                    fontSize: '12px', boxSizing: 'border-box', outline: 'none'
                  }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: 500 }}>Notes <span style={{ color: '#4b5563' }}>(optional)</span></label>
                <input type="text" value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="e.g. Lunch"
                  style={{
                    width: '100%', background: '#1f2937', border: '1px solid #374151',
                    borderRadius: '10px', padding: '8px 10px', color: 'white',
                    fontSize: '12px', boxSizing: 'border-box', outline: 'none'
                  }} />
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: 500 }}>
                Tags <span style={{ color: '#4b5563' }}>(comma-separated)</span>
              </label>
              <input type="text" value={form.tags}
                onChange={e => setForm({...form, tags: e.target.value})}
                placeholder="work, personal, urgent"
                style={{
                  width: '100%', background: '#1f2937', border: '1px solid #374151',
                  borderRadius: '10px', padding: '8px 10px', color: 'white',
                  fontSize: '12px', boxSizing: 'border-box', outline: 'none'
                }} />
            </div>

            {/* Recurring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button type="button"
                onClick={() => setForm({...form, isRecurring: !form.isRecurring})}
                style={{
                  position: 'relative', width: '36px', height: '20px',
                  borderRadius: '99px', border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: form.isRecurring ? '#10b981' : '#374151', transition: 'background 0.2s'
                }}>
                <span style={{
                  position: 'absolute', top: '2px',
                  left: form.isRecurring ? '18px' : '2px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s'
                }} />
              </button>
              <span style={{ color: '#d1d5db', fontSize: '13px' }}>Recurring</span>
              {form.isRecurring && (
                <select value={form.recurringFrequency}
                  onChange={e => setForm({...form, recurringFrequency: e.target.value})}
                  style={{
                    marginLeft: 'auto', background: '#1f2937', border: '1px solid #374151',
                    borderRadius: '8px', padding: '4px 8px', color: 'white', fontSize: '12px', outline: 'none'
                  }}>
                  {['daily','weekly','monthly','yearly'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              )}
            </div>

          </form>
        </div>

        {/* FOOTER - fixed, never scrolls */}
        <div style={{
          display: 'flex', gap: '10px',
          padding: '12px 16px',
          borderTop: '1px solid #1f2937',
          flexShrink: 0
        }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, background: '#1f2937', border: '1px solid #374151',
            color: 'white', fontWeight: 500, padding: '10px',
            borderRadius: '10px', cursor: 'pointer', fontSize: '13px'
          }}>Cancel</button>
          <button type="submit" form="tx-form" disabled={loading} style={{
            flex: 1,
            background: loading ? '#065f46' : 'linear-gradient(135deg, #10b981, #0d9488)',
            border: 'none', color: 'white', fontWeight: 600,
            padding: '10px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px'
          }}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Transaction'}
          </button>
        </div>

      </div>
    </div>
  );
}
