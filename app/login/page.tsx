'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Chip, Divider } from '@heroui/react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

import AuthShell        from '../components/auth/AuthShell';
import AuthCard         from '../components/auth/AuthCard';
import AuthSubmitButton from '../components/auth/AuthSubmitButton';
import GoogleButton     from '../components/auth/GoogleButton';
import ErrorBanner      from '../components/auth/ErrorBanner';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const clearField = (f: 'email' | 'password') =>
    setFieldErrors((p) => ({ ...p, [f]: undefined }));

  function validate() {
    const e: typeof fieldErrors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try { await login(email, password); router.push('/dashboard'); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Login failed.'); }
    finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError('');
    setGLoading(true);
    try { await loginWithGoogle(); router.push('/dashboard'); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Google sign-in failed.'); }
    finally { setGLoading(false); }
  }

  return (
    <AuthShell>
      <AuthCard
        title="Welcome back, Teacher"
        subtitle="Sign in to your TeachAI account to continue"
        footer={
          <div className="flex flex-col gap-4">
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold hover:underline underline-offset-2"
                style={{ color: COLORS.primary[600] }}
              >
                Create one free
              </Link>
            </p>
            <p className="text-center text-[12px] text-slate-400 dark:text-slate-500 leading-tight">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="hover:underline underline-offset-2 font-medium" style={{ color: COLORS.primary[600] }}>Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="hover:underline underline-offset-2 font-medium" style={{ color: COLORS.primary[600] }}>Privacy Policy</Link>.
            </p>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <ErrorBanner message={error} />

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              id="login-email"
              type="email"
              label="Email Address"
              labelPlacement="outside"
              placeholder="Enter your email"
              value={email}
              onValueChange={(v) => { setEmail(v); clearField('email'); }}
              isInvalid={!!fieldErrors.email}
              errorMessage={fieldErrors.email}
              autoComplete="email"
              autoFocus
              variant="flat"
              classNames={{
                label: "text-slate-700 dark:text-slate-200 font-bold mb-1.5",
                inputWrapper: [
                  "bg-slate-100/40 dark:bg-slate-800/40",
                  "border border-slate-200/50 dark:border-slate-700/50",
                  "hover:bg-slate-200/40 dark:hover:bg-slate-700/40",
                  "group-data-[focus=true]:bg-white dark:group-data-[focus=true]:bg-slate-900",
                  "group-data-[focus=true]:border-primary-500",
                  "shadow-none",
                  "rounded-2xl h-14 px-4 transition-all duration-300"
                ].join(" "),
                input: "text-slate-900 dark:text-white placeholder:text-slate-400 text-[15px]",
              }}
              startContent={<Mail size={18} className="text-slate-400 shrink-0 mr-1" />}
            />

            <Input
              id="login-password"
              type={showPwd ? 'text' : 'password'}
              label="Password"
              labelPlacement="outside"
              placeholder="••••••••"
              value={password}
              onValueChange={(v) => { setPassword(v); clearField('password'); }}
              isInvalid={!!fieldErrors.password}
              errorMessage={fieldErrors.password}
              autoComplete="current-password"
              variant="flat"
              classNames={{
                label: "text-slate-700 dark:text-slate-200 font-bold mb-1.5",
                inputWrapper: [
                  "bg-slate-100/40 dark:bg-slate-800/40",
                  "border border-slate-200/50 dark:border-slate-700/50",
                  "hover:bg-slate-200/40 dark:hover:bg-slate-700/40",
                  "group-data-[focus=true]:bg-white dark:group-data-[focus=true]:bg-slate-900",
                  "group-data-[focus=true]:border-primary-500",
                  "shadow-none",
                  "rounded-2xl h-14 px-4 transition-all duration-300"
                ].join(" "),
                input: "text-slate-900 dark:text-white placeholder:text-slate-400 text-[15px]",
              }}
              startContent={<Lock size={18} className="text-slate-400 shrink-0 mr-1" />}
              endContent={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(!showPwd)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 outline-none transition-colors"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <div className="flex justify-end -mt-2">
              <a
                href="#"
                className="text-xs font-semibold hover:underline underline-offset-2"
                style={{ color: COLORS.primary[600] }}
              >
                Forgot password?
              </a>
            </div>

            <AuthSubmitButton label="Sign in to TeachAI" isLoading={loading} />
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <Divider className="flex-1" />
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">or</span>
            <Divider className="flex-1" />
          </div>

          {/* Google */}
          <GoogleButton
            label="Continue with Google"
            isLoading={gLoading}
            onClick={handleGoogle}
          />
        </div>
      </AuthCard>
    </AuthShell>
  );
}
