import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee ₹' },
  { code: 'USD', label: 'US Dollar $' },
  { code: 'EUR', label: 'Euro €' },
  { code: 'GBP', label: 'British Pound £' },
  { code: 'JPY', label: 'Japanese Yen ¥' },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', currency: user?.currency || 'INR' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) return toast.error('Passwords do not match');
    if (passwords.newPass.length < 6) return toast.error('Password must be 6+ characters');
    setChangingPass(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.newPass });
      toast.success('Password changed!');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setChangingPass(false); }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Profile</h1>
        <p className="text-gray-400 mt-1">Manage your account settings</p>
      </div>

      {/* Avatar & Name card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-900/30">
          <span className="text-white font-bold text-3xl">{user?.name?.[0]?.toUpperCase()}</span>
        </div>
        <div>
          <p className="text-white font-bold text-xl">{user?.name}</p>
          <p className="text-gray-400">{user?.email}</p>
          <p className="text-gray-500 text-sm mt-1">Member since {new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-5">Edit Profile</h2>
        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input type="email" disabled value={user?.email}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" />
            <p className="text-gray-600 text-xs mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Currency</label>
            <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold text-lg mb-5">Change Password</h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Current Password</label>
            <input type="password" required value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
            <input type="password" required value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm New Password</label>
            <input type="password" required value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={changingPass}
            className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
            {changingPass ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <h2 className="text-red-400 font-semibold text-lg mb-2">Danger Zone</h2>
        <p className="text-gray-500 text-sm mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
          onClick={() => toast.error('Contact support to delete your account')}>Delete Account</button>
      </div>
    </div>
  );
}
