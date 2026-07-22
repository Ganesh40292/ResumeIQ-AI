import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import NeuralBackground from '../../components/common/NeuralBackground';

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!terms) {
      setError('You must accept the terms and conditions');
      return;
    }

    setLoading(true);
    const result = await register({ fullName, email, password });
    if (result.success) {
      localStorage.setItem('resumeiq_is_new_user', 'true');
      navigate('/dashboard');
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');
    const demoEmail = `demo_${provider.toLowerCase()}@example.com`;
    let result = await register({ fullName: `${provider} User`, email: demoEmail, password: 'password' });
    if (result && result.success) {
      localStorage.setItem('resumeiq_is_new_user', 'true');
      navigate('/dashboard');
      return;
    }
    // If user already exists, login instead
    let loginResult = await login({ email: demoEmail, password: 'password' });
    if (loginResult && loginResult.success) {
      navigate('/dashboard');
      return;
    }
    setError(`Failed to sign up with ${provider}`);
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050816] px-4 py-12 text-slate-100 overflow-hidden font-sans">
      <NeuralBackground />
      {/* Ambient background glowing orbs & mesh grid */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1e264a_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

      {/* Card container */}
      <div className="relative z-10 w-full max-w-[440px] rounded-3xl bg-[#0c1024]/85 p-8 border border-slate-800/80 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl">
        
        {/* Header with Circular Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60 blur-sm" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0a0d1f] border border-indigo-500/40 p-2 shadow-inner">
              <svg viewBox="0 0 40 40" className="h-full w-full">
                <defs>
                  <linearGradient id="logoGradReg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <circle cx="20" cy="20" r="18" fill="none" stroke="url(#logoGradReg)" strokeWidth="2.5" strokeDasharray="3 2" />
                <path d="M12 12 h16 v18 h-16 z" fill="none" stroke="#60a5fa" strokeWidth="2" rx="2" />
                <line x1="16" y1="17" x2="24" y2="17" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="16" y1="21" x2="22" y2="21" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="24" cy="25" r="4" fill="#6366f1" />
                <text x="24" y="26.5" fontSize="5" fontWeight="bold" fill="#ffffff" textAnchor="middle">IQ</text>
              </svg>
            </div>
          </div>
          
          <h2 className="flex items-center gap-1 text-2xl font-black tracking-tight text-white">
            Resume<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">IQ</span> AI
          </h2>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5 tracking-wide">
            Smart Resume. Smarter Career.
          </p>
        </div>

        {/* Section title */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
            Create Account <span className="text-indigo-400 text-sm">✨</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xs mx-auto">
            Join thousands of professionals building their better future with AI
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-800/40 p-3 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full bg-[#12162e]/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-[#12162e]/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full bg-[#12162e]/90 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3.5 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full bg-[#12162e]/90 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-center gap-2 pt-1 text-[11px]">
            <input
              type="checkbox"
              id="terms"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="h-3.5 w-3.5 rounded bg-[#12162e] border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="terms" className="text-slate-400 select-none cursor-pointer">
              I agree to the{' '}
              <span className="text-indigo-400 hover:underline">Terms of Service</span> and{' '}
              <span className="text-indigo-400 hover:underline">Privacy Policy</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-slate-800/80" />
          <span className="absolute bg-[#0c1024] px-3 text-[11px] font-medium text-slate-500">
            or sign up with
          </span>
        </div>

        {/* Social Logins (Google, LinkedIn & GitHub - 3 Columns) */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="flex items-center justify-center gap-1.5 bg-[#12162e]/80 hover:bg-[#1a2042] border border-slate-800/90 py-2.5 px-2 rounded-xl text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="truncate">Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('LinkedIn')}
            className="flex items-center justify-center gap-1.5 bg-[#12162e]/80 hover:bg-[#1a2042] border border-slate-800/90 py-2.5 px-2 rounded-xl text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <svg className="h-3.5 w-3.5 fill-[#0A66C2]" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.77a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
            </svg>
            <span className="truncate">LinkedIn</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('GitHub')}
            className="flex items-center justify-center gap-1.5 bg-[#12162e]/80 hover:bg-[#1a2042] border border-slate-800/90 py-2.5 px-2 rounded-xl text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <svg className="h-3.5 w-3.5 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="truncate">GitHub</span>
          </button>
        </div>

        {/* Footer link */}
        <p className="mt-5 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
