import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Shield, Save, Edit2, Lock, AlertCircle, Check } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import userService from '../../services/userService';

export default function Profile() {
  const { user, setUser, logout } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  
  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await userService.updateProfile({ fullName, phoneNumber, profilePicture });
      if (response.success) {
        setUser(response.data);
        setSuccess('Profile updated successfully!');
        setEditMode(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await userService.changePassword({ oldPassword, newPassword });
      if (response.success) {
        setSuccess('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Manage public profile details and password settings</p>
        </div>
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-500 text-white font-semibold py-1.5 px-4 rounded-lg text-sm transition-all cursor-pointer"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-950/50 border border-red-800/50 p-3 text-sm text-red-400">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-800/50 p-3 text-sm text-emerald-400">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Card: Summary */}
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 border border-white/10 shadow-2xl">
          <div className="relative">
            <img
              src={profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
              alt="Avatar"
              className="h-28 w-28 rounded-full object-cover border-2 border-indigo-500 shadow-lg shadow-indigo-500/20"
            />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-100">{user.fullName}</h3>
            <span className="inline-block mt-1 bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs px-3 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {user.role}
            </span>
          </div>

          <div className="w-full border-t border-white/10 pt-4 space-y-2.5 text-xs text-slate-350">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-slate-400" />
              <span>{user.email}</span>
            </div>
            {user.phoneNumber && (
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-slate-400" />
                <span>{user.phoneNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-slate-400" />
              <span>
                Joined {
                  user.createdAt && !isNaN(new Date(user.createdAt).getTime()) && new Date(user.createdAt).getFullYear() > 1970
                    ? new Date(user.createdAt).toLocaleDateString()
                    : new Date().toLocaleDateString()
                }
              </span>
            </div>
          </div>
        </div>

        {/* Right Tab: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Details Form */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <User size={18} className="text-indigo-400" />
                Personal Details
              </h2>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 size={14} />
                {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 disabled:opacity-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Phone Number</label>
                <input
                  type="tel"
                  disabled={!editMode}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 disabled:opacity-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Profile Picture URL</label>
                <input
                  type="text"
                  disabled={!editMode}
                  value={profilePicture}
                  onChange={(e) => setProfilePicture(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 disabled:opacity-50 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="https://image-link.com"
                />
              </div>

              {editMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              )}
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Lock size={18} className="text-indigo-400" />
              Change Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg text-sm cursor-pointer"
              >
                Change Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
