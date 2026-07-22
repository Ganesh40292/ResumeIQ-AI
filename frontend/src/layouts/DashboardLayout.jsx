import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileUp, FileCheck, Award, Target, FileSignature, 
  Bot, GraduationCap, History, User, Settings, LogOut, Menu, X, 
  Search, Bell, Sun, Moon, HelpCircle, Sparkles, Command
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import CommandPalette from '../components/common/CommandPalette';
import NeuralBackground from '../components/common/NeuralBackground';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Resume Upload', path: '/upload', icon: FileUp },
    { name: 'Resume Analysis', path: '/analysis', icon: FileCheck },
    { name: 'ATS Report', path: '/ats', icon: Award },
    { name: 'Job Matcher', path: '/job-matcher', icon: Target },
    { name: 'Resume Builder', path: '/builder', icon: FileSignature },
    { name: 'AI Review', path: '/ai-review', icon: Bot },
    { name: 'Interview Prep', path: '/interview-prep', icon: GraduationCap },
    { name: 'History', path: '/history', icon: History },
  ];

  const adminItems = [
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="relative flex h-screen bg-[#050816] text-slate-100 overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Animated Neural Glass Matrix Background */}
      <NeuralBackground />

      {/* 2. Glass Sidebar Navigation */}
      <aside className={`relative z-40 flex flex-col bg-[#0f172a]/70 backdrop-blur-2xl border-r border-white/10 transition-all duration-300 md:static ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 font-black text-white text-base shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              IQ
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                ResumeIQ AI
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-3 py-5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} shrink-0 transition-colors`} />
                {sidebarOpen && <span>{item.name}</span>}
                {isActive && sidebarOpen && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                )}
              </Link>
            );
          })}

          <div className="border-t border-white/10 my-4 pt-4">
            {adminItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                  title={!sidebarOpen ? item.name : undefined}
                >
                  <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} shrink-0 transition-colors`} />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer User Badge */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between bg-slate-900/40">
          {sidebarOpen && user && (
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40&q=80'}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover border border-indigo-500/50 shrink-0"
              />
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate">{user.fullName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* 3. Main Shell Workspace */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Sticky Glass Top Navigation */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 bg-[#0f172a]/60 border-b border-white/10 backdrop-blur-xl">
          {/* Left Controls & Search */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-white/5"
            >
              <Menu size={20} />
            </button>

            {/* Global Search Bar */}
            <div className="hidden sm:flex items-center gap-2 bg-[#050816]/70 border border-white/10 px-3.5 py-1.5 rounded-xl w-72 backdrop-blur-md focus-within:border-indigo-500/50 transition-all">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search tools, resumes, matches..."
                className="bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
              />
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                <Command size={10} /> K
              </div>
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* AI Assistant Quick Trigger */}
            <button
              onClick={() => navigate('/ai-review')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Sparkles size={14} className="text-indigo-400" />
              <span>AI Copilot</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all relative cursor-pointer"
              >
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 shadow-sm" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-[#0f172a]/95 border border-white/10 rounded-2xl shadow-2xl p-4 text-xs z-55 backdrop-blur-2xl">
                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <h4 className="font-bold text-slate-100">Live AI Insights</h4>
                    <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-800/40">2 New</span>
                  </div>
                  <div className="space-y-2.5 text-slate-300">
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                      <p className="font-medium text-slate-200">🚀 ATS compatibility score rose to 84%</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">Just now</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                      <p className="font-medium text-slate-200">✨ Mock Interview session logged</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full border border-white/10 hover:border-indigo-500/50 transition-all focus:outline-none cursor-pointer"
              >
                <img
                  src={user?.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=32&h=32&q=80'}
                  alt="Avatar"
                  className="h-7 w-7 rounded-full object-cover"
                />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-52 bg-[#0f172a]/95 border border-white/10 rounded-2xl shadow-2xl p-1.5 z-55 text-xs backdrop-blur-2xl">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="font-bold text-slate-100 truncate">{user?.fullName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={15} /> Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={15} /> Settings
                  </Link>
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Main Workspace Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

