import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-emerald-500/10"
              style={{ width: `${Math.random()*200+50}px`, height: `${Math.random()*200+50}px`,
                top: `${Math.random()*100}%`, left: `${Math.random()*100}%`,
                transform: 'translate(-50%,-50%)' }} />
          ))}
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-900/50">
            <span className="text-white font-bold text-4xl">₹</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 font-display">Take Control of Your Money</h2>
          <p className="text-gray-400 text-lg leading-relaxed">Track income, expenses, budgets and get smart insights to build better financial habits.</p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[['💰','Smart Tracking'],['📊','Analytics'],['🎯','Budgets']].map(([icon, label]) => (
              <div key={label} className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700/50">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-gray-300 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">₹</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-display">Welcome back</h1>
          <p className="text-gray-400 mb-8">Sign in to your FinTrack account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
