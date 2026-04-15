'use client';

import { Button } from '@heroui/react';
import { COLORS } from '../../constants/colors';

interface GoogleButtonProps {
  label: string;
  isLoading?: boolean;
  onClick: () => void;
}

/**
 * GoogleButton
 * HeroUI Button with Google "G" branded SVG icon.
 */
export default function GoogleButton({ label, isLoading, onClick }: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="bordered"
      size="lg"
      fullWidth
      isLoading={isLoading}
      onClick={onClick}
      className="
        font-extrabold rounded-2xl h-14
        border-2 border-slate-200 dark:border-slate-800
        text-slate-700 dark:text-slate-200
        hover:bg-slate-50 dark:hover:bg-slate-800/40
        hover:border-slate-300 dark:hover:border-slate-700
        shadow-sm hover:shadow-md
        transition-all duration-300
        gap-4
      "
      startContent={
        !isLoading && (
          <div className="bg-white p-1.5 rounded-lg shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
        )
      }
    >
      {!isLoading && <span className="tracking-tight">{label}</span>}
    </Button>
  );
}
