'use client';

import { useState } from 'react';
import { Mail, Lock, GraduationCap, ArrowRight, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function StudentLogin() {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      router.push(callbackUrl);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      router.push(callbackUrl);
    } catch (err: any) {
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <GraduationCap size={30} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
            Welcome back
          </h1>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--muted)' }}>
            Sign in to continue your AI-powered learning journey
          </p>
        </div>

        {/* Card */}
        <div className="surface-card p-8 bg-white">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 mb-6 bg-white"
            style={{ border: "2px solid var(--card-border)", color: "var(--foreground)" }}
            onMouseOver={e => (e.currentTarget.style.borderColor = "var(--primary-light)")}
            onMouseOut={e => (e.currentTarget.style.borderColor = "var(--card-border)")}
          >
            {/* Google SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
            <span className="label-caps">or with email</span>
            <div className="flex-1 h-px" style={{ background: "var(--card-border)" }} />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="label-caps px-1">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }}>
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="student@university.edu"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-bold outline-none transition-all"
                  style={{ background: "var(--surface-2)", border: "2px solid transparent", color: "var(--foreground)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--primary-light)", e.target.style.background = "var(--surface)")}
                  onBlur={e => (e.target.style.borderColor = "transparent", e.target.style.background = "var(--surface-2)")}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="label-caps px-1">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full pl-10 pr-10 py-3.5 rounded-xl text-sm font-bold outline-none transition-all"
                  style={{ background: "var(--surface-2)", border: "2px solid transparent", color: "var(--foreground)" }}
                  onFocus={e => (e.target.style.borderColor = "var(--primary-light)", e.target.style.background = "var(--surface)")}
                  onBlur={e => (e.target.style.borderColor = "transparent", e.target.style.background = "var(--surface-2)")}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 transition-colors" style={{ color: "var(--muted)" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all duration-200 mt-2 shadow-md"
              style={{ background: "var(--primary)", color: "white", opacity: loading ? 0.7 : 1 }}
              onMouseOver={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = "var(--primary-dark)")}
              onMouseOut={e  => !loading && ((e.currentTarget as HTMLButtonElement).style.background = "var(--primary)")}
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium" style={{ color: "var(--muted)" }}>
            New to Multimodal Student?{' '}
            <Link href="/signup" className="font-bold hover:underline" style={{ color: "var(--primary)" }}>
              Create account
            </Link>
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors" style={{ color: "var(--muted)" }}
            onMouseOver={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)"}
            onMouseOut={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)"}
          >
            <ChevronLeft size={16} /> Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
