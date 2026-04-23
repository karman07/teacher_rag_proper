'use client';

import { useState } from 'react';
import { Mail, Lock, User, GraduationCap, ArrowRight, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

import React, { Suspense } from 'react';

function SignupContent() {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signup(formData.name, formData.email, formData.password);
      router.push(callbackUrl);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
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
            Create account
          </h1>
          <p className="mt-2 text-sm font-medium" style={{ color: 'var(--muted)' }}>
            Join thousands of students learning with AI
          </p>
        </div>

        <div className="surface-card p-8 bg-white">
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

          <form onSubmit={handleSignup} className="space-y-5">
            {[
              { key: 'name',     label: 'Full Name',  type: 'text',     icon: <User size={18} />,     placeholder: 'Jane Doe' },
              { key: 'email',    label: 'Email',       type: 'email',    icon: <Mail size={18} />,     placeholder: 'student@university.edu' },
            ].map(field => (
              <div key={field.key} className="space-y-2">
                <label className="label-caps px-1">{field.label}</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }}>
                    {field.icon}
                  </div>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(formData as any)[field.key]}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    required
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm font-bold outline-none transition-all"
                    style={{ background: "var(--surface-2)", border: "2px solid transparent", color: "var(--foreground)" }}
                    onFocus={e => (e.target.style.borderColor = "var(--primary-light)", e.target.style.background = "var(--surface)")}
                    onBlur={e => (e.target.style.borderColor = "transparent", e.target.style.background = "var(--surface-2)")}
                  />
                </div>
              </div>
            ))}

            {/* Password */}
            <div className="space-y-2">
              <label className="label-caps px-1">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Min. 6 characters"
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
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium" style={{ color: "var(--muted)" }}>
            Already have an account?{' '}
            <Link href="/login" className="font-bold hover:underline" style={{ color: "var(--primary)" }}>
              Sign in
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

export default function StudentSignup() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
