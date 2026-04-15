'use client';

import { AlertCircle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
}

/**
 * ErrorBanner
 * Inline error alert for auth form failures.
 */
export default function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 rounded-xl px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
      <AlertCircle size={15} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}
