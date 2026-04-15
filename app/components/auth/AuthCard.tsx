'use client';

import Link from 'next/link';
import { Card, CardHeader, CardBody, CardFooter, Divider } from '@heroui/react';
import { Zap } from 'lucide-react';
import { COLORS } from '../../constants/colors';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;       // form content
  footer: React.ReactNode;         // e.g. "Already have an account? Sign in"
  maxWidth?: string;
}

/**
 * AuthCard
 * Reusable HeroUI Card shell for all auth pages.
 * Contains: logo, title, subtitle, slot for form, divider, slot for footer.
 */
export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
  maxWidth = '430px',
}: AuthCardProps) {
  return (
    <Card
      className="w-full shadow-2xl"
      style={{ maxWidth }}
      classNames={{
        base: [
          'bg-white/90 dark:bg-[#0f1a2e]/90',
          'backdrop-blur-xl',
          'border border-slate-200/80 dark:border-slate-700/60',
        ].join(' '),
      }}
    >
      {/* -- Header: logo + title -- */}
      <CardHeader className="flex flex-col items-start gap-1 px-8 pt-8 pb-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: COLORS.primary[600] }}
          >
            <Zap size={17} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-xl text-slate-900 dark:text-white">
            Teach<span style={{ color: COLORS.primary[600] }}>AI</span>
          </span>
        </Link>

        <h1 className="text-[1.55rem] font-bold leading-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </CardHeader>

      {/* -- Body: form injected here -- */}
      <CardBody className="px-8 pt-6 pb-4">
        {children}
      </CardBody>

      <Divider />

      {/* -- Footer -- */}
      <CardFooter className="flex flex-col gap-3 px-8 py-5">
        {footer}
      </CardFooter>
    </Card>
  );
}
