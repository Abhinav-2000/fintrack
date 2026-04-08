import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${color}`}>{icon}</div>
    </div>
    <p className="text-gray-400 text-sm mb-1">{label}</p>
    <p className="text-white text-2xl font-bold font-mono">{value}</p>
    {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [insights, setInsights] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/transactions/summary'),
      api.get('/transactions?limit=5&sort=-date'),
      api.get('/analytics/insights'),
      api.get('/budgets')
    ]).then(([s, t, i, b]) => {
      setSummary(s.data);
      setRecent(t.data.transactions);
      setInsights(i.data.insights);
      setBudgets(b.data.budgets.filter(b => b.exceeded));
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const currency = user?.currency || 'INR';
  const balance = (summary?.totalIncome || 0) - (summary?.totalExpense || 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1">Here's your financial overview</p>
        </div>
        <Link to="/transactions"
          className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/30">
          <span>+ Add Transaction</span>
        </Link>
      </div>

      {/* Budget alerts */}
      {budgets.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-400 font-semibold">Budget Exceeded!</p>
            <p className="text-gray-400 text-sm mt-1">
              {budgets.map(b => b.category).join(', ')} budget{budgets.length > 1 ? 's have' : ' has'} been exceeded this month.
              <Link to="/budgets" className="text-red-400 ml-1 hover:underline">Review budgets →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Balance" value={formatCurrency(balance, currency)} icon="💎"
          color="bg-emerald-500/15 text-emerald-400" sub="All time" />
        <StatCard label="Total Income" value={formatCurrency(summary?.totalIncome || 0, currency)} icon="📈"
          color="bg-blue-500/15 text-blue-400" sub="All time" />
        <StatCard label="Total Expenses" value={formatCurrency(summary?.totalExpense || 0, currency)} icon="📉"
          color="bg-red-500/15 text-red-400" sub="All time" />
        <StatCard label="This Month" value={formatCurrency((summary?.monthIncome || 0) - (summary?.monthExpense || 0), currency)}
          icon="📅" color="bg-purple-500/15 text-purple-400"
          sub={`In: ${formatCurrency(summary?.monthIncome||0,currency)} | Out: ${formatCurrency(summary?.monthExpense||0,currency)}`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold text-lg">Recent Transactions</h2>
            <Link to="/transactions" className="text-emerald-400 text-sm hover:text-emerald-300">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-gray-400">No transactions yet</p>
              <Link to="/transactions" className="text-emerald-400 text-sm hover:underline mt-1 inline-block">Add your first transaction</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(t => (
                <div key={t._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800/50 transition-colors group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                    t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                    {t.type === 'income' ? '💚' : '🔴'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{t.category}</p>
                    <p className="text-gray-500 text-xs">{formatDate(t.date)}{t.notes ? ` · ${t.notes}` : ''}</p>
                  </div>
                  <p className={`font-bold font-mono text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Insights */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-6">Smart Insights 🧠</h2>
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-gray-400 text-sm">Add more transactions to get insights</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                  <span className="text-2xl">{insight.icon}</span>
                  <p className="text-gray-300 text-sm mt-2 leading-relaxed">{insight.message}</p>
                </div>
              ))}
            </div>
          )}
          <Link to="/analytics"
            className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-xl py-2.5 hover:bg-emerald-500/5 transition-colors">
            View Full Analytics →
          </Link>
        </div>
      </div>
    </div>
  );
}
