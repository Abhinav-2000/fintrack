import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import api from '../utils/api';
import { formatCurrency, getMonthName } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  plugins: { legend: { labels: { color: '#9ca3af', font: { size: 12 } } } },
  scales: { x: { ticks: { color: '#9ca3af' }, grid: { color: '#1f2937' } }, y: { ticks: { color: '#9ca3af' }, grid: { color: '#1f2937' } } }
};

export default function Analytics() {
  const { user } = useAuth();
  const [monthly, setMonthly] = useState([]);
  const [catData, setCatData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [catType, setCatType] = useState('expense');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [m, c, i] = await Promise.all([
        api.get('/analytics/monthly'),
        api.get(`/analytics/categories?type=${catType}`),
        api.get('/analytics/insights')
      ]);
      setMonthly(m.data.data);
      setCatData(c.data.data);
      setInsights(i.data.insights);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [catType]);

  // Process monthly data into chart format
  const months = [];
  const incomeData = {};
  const expenseData = {};
  monthly.forEach(({ _id, total }) => {
    const key = `${getMonthName(_id.month - 1)} ${_id.year}`;
    if (!months.includes(key)) months.push(key);
    if (_id.type === 'income') incomeData[key] = total;
    else expenseData[key] = total;
  });

  const barData = {
    labels: months,
    datasets: [
      { label: 'Income', data: months.map(m => incomeData[m] || 0), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
      { label: 'Expenses', data: months.map(m => expenseData[m] || 0), backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 }
    ]
  };

  const colors = ['#f97316','#8b5cf6','#06b6d4','#ec4899','#eab308','#ef4444','#a855f7','#3b82f6','#10b981','#14b8a6','#22c55e','#6b7280'];
  const pieData = {
    labels: catData.map(d => d._id),
    datasets: [{ data: catData.map(d => d.total), backgroundColor: colors.slice(0, catData.length), borderWidth: 0 }]
  };

  const netData = {
    labels: months,
    datasets: [{
      label: 'Net Balance',
      data: months.map(m => (incomeData[m] || 0) - (expenseData[m] || 0)),
      borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#10b981'
    }]
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Analytics</h1>
        <p className="text-gray-400 mt-1">Understand your spending patterns</p>
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">🧠 Smart Insights</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight, i) => (
              <div key={i} className={`rounded-xl p-4 border ${
                insight.type === 'increase' ? 'bg-red-500/10 border-red-500/20' :
                insight.type === 'decrease' ? 'bg-emerald-500/10 border-emerald-500/20' :
                'bg-gray-800 border-gray-700'}`}>
                <span className="text-2xl">{insight.icon}</span>
                <p className="text-gray-300 text-sm mt-2">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Bar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Monthly Income vs Expenses</h2>
          {months.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500">No data yet</div>
          ) : (
            <Bar data={barData} options={{ ...chartDefaults, responsive: true, maintainAspectRatio: true }} />
          )}
        </div>

        {/* Category Pie */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Category Breakdown</h2>
            <div className="flex rounded-xl overflow-hidden border border-gray-700">
              {['expense','income'].map(t => (
                <button key={t} onClick={() => setCatType(t)} className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${catType === t ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
              ))}
            </div>
          </div>
          {catData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500">No data yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-48 h-48">
                <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
              <div className="flex-1 space-y-2">
                {catData.slice(0,6).map((d, i) => (
                  <div key={d._id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colors[i] }} />
                    <span className="text-gray-400 text-xs flex-1 truncate">{d._id}</span>
                    <span className="text-white text-xs font-mono font-medium">{formatCurrency(d.total, user?.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Net Balance Trend */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-white font-semibold mb-4">Net Balance Trend</h2>
          {months.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500">No data yet</div>
          ) : (
            <Line data={netData} options={{ ...chartDefaults, responsive: true, maintainAspectRatio: false, aspectRatio: 4 }} height={120} />
          )}
        </div>
      </div>
    </div>
  );
}
