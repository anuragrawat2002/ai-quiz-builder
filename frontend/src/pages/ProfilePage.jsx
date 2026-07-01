import { useState } from 'react';
import { User, Mail, Lock, Save, Shield, BookOpen, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return toast.error('Name required');
    setSavingProfile(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account details</p>
      </div>

      {/* Avatar & role */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-black text-white shadow-lg">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{user?.name}</h2>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border mt-1.5 font-medium
            ${user?.role === 'teacher' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-violet-500/10 text-violet-400 border-violet-500/30'}`}>
            <Shield className="w-3 h-3" />
            {user?.role === 'teacher' ? 'Educator' : 'Student'}
          </span>
        </div>

        <div className="ml-auto grid grid-cols-2 gap-3 text-center">
          {user?.role === 'teacher' ? (
            <>
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xl font-bold text-white">{user?.totalQuizzesCreated || 0}</p>
                <p className="text-xs text-gray-500">Quizzes</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xl font-bold text-white">{user?.totalQuizzesTaken || 0}</p>
                <p className="text-xs text-gray-500">Attempts</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xl font-bold text-white">{user?.averageScore?.toFixed(0) || 0}%</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleProfileSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2"><User className="w-4 h-4 text-indigo-400" /> Personal Information</h3>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
          <input
            type="text"
            value={profileForm.name}
            onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Email (read-only)</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full bg-gray-800/50 border border-gray-700 text-gray-500 rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Bio</label>
          <textarea
            value={profileForm.bio}
            onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Tell us a little about yourself..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none placeholder-gray-600"
          />
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="flex items-center gap-2 gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {savingProfile ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={handlePasswordSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2"><Lock className="w-4 h-4 text-indigo-400" /> Change Password</h3>

        {[
          { key: 'currentPassword', label: 'Current Password' },
          { key: 'newPassword', label: 'New Password' },
          { key: 'confirmPassword', label: 'Confirm New Password' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
            <input
              type="password"
              value={pwForm[key]}
              onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={savingPw}
          className="flex items-center gap-2 bg-gray-800 border border-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-60 transition-colors"
        >
          {savingPw ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
          Update Password
        </button>
      </form>
    </div>
  );
}
