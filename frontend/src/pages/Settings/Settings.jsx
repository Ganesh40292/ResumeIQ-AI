import React, { useState } from 'react';
import { Trash2, Moon, Bell, Globe, Sparkles } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import userService from '../../services/userService';

export default function Settings() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Settings states (UI only)
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  const handleDeleteAccount = async () => {
    try {
      const response = await userService.deleteAccount();
      if (response.success) {
        logout();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 text-slate-100 text-left">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
        <p className="text-slate-400 text-xs mt-1">Configure user preferences, appearance, and account status</p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-950/40 border border-rose-800/40 p-3 text-xs text-rose-400">
          <span>{error}</span>
        </div>
      )}

      {/* Preferences Section */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6">
        <h2 className="text-sm font-bold border-b border-white/10 pb-3 text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Moon size={16} className="text-indigo-400" /> System Preferences
        </h2>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon size={18} className="text-indigo-400" />
            <div>
              <h4 className="font-semibold text-xs text-slate-100">Dark Mode Theme</h4>
              <p className="text-[11px] text-slate-400">Deep Space UI layout theme styling</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-800'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Email Alerts Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-indigo-400" />
            <div>
              <h4 className="font-semibold text-xs text-slate-100">Notification Reminders</h4>
              <p className="text-[11px] text-slate-400">Receive ATS score checkpoints and updates</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${notifications ? 'bg-indigo-600' : 'bg-slate-800'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-indigo-400" />
            <div>
              <h4 className="font-semibold text-xs text-slate-100">Analysis Language</h4>
              <p className="text-[11px] text-slate-400">Set preferred language for AI feedback</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#050816]/70 border border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="en">English (US)</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>

        {/* Replay Intro Toggle */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-indigo-400" />
            <div>
              <h4 className="font-semibold text-xs text-slate-100">Welcome Animation</h4>
              <p className="text-[11px] text-slate-400">Replay the cinematic welcome intro sequence</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('resumeiq_welcome_shown');
              sessionStorage.removeItem('resumeiq_welcome_shown');
              window.location.reload();
            }}
            className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-500/20"
          >
            Replay Intro
          </button>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="glass-card rounded-3xl p-6 border border-rose-500/20 shadow-2xl space-y-6">
        <h2 className="text-xs font-bold border-b border-rose-500/20 pb-3 text-rose-400 uppercase tracking-wider">Danger Zone</h2>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-xs text-slate-200">Delete Account</h4>
            <p className="text-[11px] text-slate-400 max-w-md">
              Permanently delete all files, analysis profiles, and resume records. This action is irreversible.
            </p>
          </div>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-rose-500/10 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              Delete...
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold py-1.5 px-3 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-1.5 px-3 rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
