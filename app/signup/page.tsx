'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Chip, Divider } from '@heroui/react';
import { Eye, EyeOff, CheckCircle2, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/colors';

import AuthShell        from '../components/auth/AuthShell';
import AuthCard         from '../components/auth/AuthCard';
import AuthSubmitButton from '../components/auth/AuthSubmitButton';
import GoogleButton     from '../components/auth/GoogleButton';
import ErrorBanner      from '../components/auth/ErrorBanner';

type FieldErrors = { name?: string; email?: string; password?: string; confirm?: string };

const PWD_RULES = [
  { label: '8+ chars',  test: (p: string) => p.length >= 8 },
  { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Number',    test: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [showCfm, setShowCfm]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const clearField = (f: keyof FieldErrors) =>
    setFieldErrors((p) => ({ ...p, [f]: undefined }));

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!name.trim())  e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password)     e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Minimum 8 characters';
    if (!confirm)      e.confirm = 'Please confirm your password';
    else if (confirm !== password) e.confirm = 'Passwords do not match';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try { await signup(name.trim(), email.trim(), password); router.push('/dashboard'); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Registration failed.'); }
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
        title="Create your account"
        subtitle="Join thousands of teachers using AI in their classroom"
        maxWidth="460px"
        footer={
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold hover:underline underline-offset-2"
              style={{ color: COLORS.primary[600] }}
            >
              Sign in
            </Link>
          </p>
        }
      >
        <div className="flex flex-col gap-4">
          <ErrorBanner message={error} />

          {/* Google first (preferred flow) */}
          <div className="space-y-3">
            <GoogleButton
              label="Sign up with Google"
              isLoading={gLoading}
              onClick={handleGoogle}
            />
            <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-medium">
              Join with Google to sync your Drive automatically
            </p>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">
              or use email
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Name */}
            <Input
              id="signup-name"
              type="text"
              label="Full Name"
              labelPlacement="outside"
              placeholder="Dr. Jane Smith"
              value={name}
              onValueChange={(v) => { setName(v); clearField('name'); }}
              isInvalid={!!fieldErrors.name}
              errorMessage={fieldErrors.name}
              autoComplete="name"
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
                  "rounded-2xl h-14 px-4 transition-all duration-300"
                ].join(" "),
                input: "text-slate-900 dark:text-white placeholder:text-slate-400 text-[15px]",
              }}
              startContent={<User size={18} className="text-slate-400 shrink-0 mr-1" />}
            />

            {/* Email */}
            <Input
              id="signup-email"
              type="email"
              label="Email Address"
              labelPlacement="outside"
              placeholder="you@school.edu"
              value={email}
              onValueChange={(v) => { setEmail(v); clearField('email'); }}
              isInvalid={!!fieldErrors.email}
              errorMessage={fieldErrors.email}
              autoComplete="email"
              variant="flat"
              classNames={{
                label: "text-slate-700 dark:text-slate-200 font-bold mb-1.5",
                inputWrapper: [
                  "bg-slate-100/40 dark:bg-slate-800/40",
                  "border border-slate-200/50 dark:border-slate-700/50",
                  "hover:bg-slate-200/40 dark:hover:bg-slate-700/40",
                  "group-data-[focus=true]:bg-white dark:group-data-[focus=true]:bg-slate-900",
                  "group-data-[focus=true]:border-primary-500",
                  "rounded-2xl h-14 px-4 transition-all duration-300"
                ].join(" "),
                input: "text-slate-900 dark:text-white placeholder:text-slate-400 text-[15px]",
              }}
              startContent={<Mail size={18} className="text-slate-400 shrink-0 mr-1" />}
            />

            {/* Password */}
            <Input
              id="signup-password"
              type={showPwd ? 'text' : 'password'}
              label="Password"
              labelPlacement="outside"
              placeholder="••••••••"
              value={password}
              onValueChange={(v) => { setPassword(v); clearField('password'); }}
              isInvalid={!!fieldErrors.password}
              errorMessage={fieldErrors.password}
              autoComplete="new-password"
              variant="flat"
              classNames={{
                label: "text-slate-700 dark:text-slate-200 font-bold mb-1.5",
                inputWrapper: [
                  "bg-slate-100/40 dark:bg-slate-800/40",
                  "border border-slate-200/50 dark:border-slate-700/50",
                  "hover:bg-slate-200/40 dark:hover:bg-slate-700/40",
                  "group-data-[focus=true]:bg-white dark:group-data-[focus=true]:bg-slate-900",
                  "group-data-[focus=true]:border-primary-500",
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

            {/* Password strength pills */}
            {password.length > 0 && (
              <div className="flex flex-wrap gap-1.5 -mt-2">
                {PWD_RULES.map(({ label, test }) => {
                  const ok = test(password);
                  return (
                    <Chip
                      key={label}
                      size="sm"
                      variant="flat"
                      color={ok ? 'success' : 'default'}
                      startContent={<CheckCircle2 size={11} />}
                      className="text-xs"
                    >
                      {label}
                    </Chip>
                  );
                })}
              </div>
            )}

            {/* Confirm password */}
            <Input
              id="signup-confirm"
              type={showCfm ? 'text' : 'password'}
              label="Confirm Password"
              labelPlacement="outside"
              placeholder="••••••••"
              value={confirm}
              onValueChange={(v) => { setConfirm(v); clearField('confirm'); }}
              isInvalid={!!fieldErrors.confirm}
              errorMessage={fieldErrors.confirm}
              autoComplete="new-password"
              variant="flat"
              classNames={{
                label: "text-slate-700 dark:text-slate-200 font-bold mb-1.5",
                inputWrapper: [
                  "bg-slate-100/40 dark:bg-slate-800/40",
                  "border border-slate-200/50 dark:border-slate-700/50",
                  "hover:bg-slate-200/40 dark:hover:bg-slate-700/40",
                  "group-data-[focus=true]:bg-white dark:group-data-[focus=true]:bg-slate-900",
                  "group-data-[focus=true]:border-primary-500",
                  "rounded-2xl h-14 px-4 transition-all duration-300"
                ].join(" "),
                input: "text-slate-900 dark:text-white placeholder:text-slate-400 text-[15px]",
              }}
              startContent={<Lock size={18} className="text-slate-400 shrink-0 mr-1" />}
              endContent={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCfm(!showCfm)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 outline-none transition-colors"
                  aria-label={showCfm ? 'Hide' : 'Show'}
                >
                  {showCfm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {/* Terms */}
            <p className="text-center text-[12px] text-slate-400 dark:text-slate-500 leading-tight py-2">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="hover:underline underline-offset-2 font-medium" style={{ color: COLORS.primary[600] }}>Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="hover:underline underline-offset-2 font-medium" style={{ color: COLORS.primary[600] }}>Privacy Policy</Link>.
            </p>

            <AuthSubmitButton label="Create Teacher Account" isLoading={loading} />
          </form>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
