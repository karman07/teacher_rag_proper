"use client";

import { Chip } from "@heroui/react";

interface SectionBadgeProps {
  children: React.ReactNode;
  className?: string;
  /** Show the pulsing live-dot indicator (default: false) */
  live?: boolean;
  /** Optional icon to lead the badge */
  icon?: React.ReactNode;
}

/**
 * Pill-style label used at the top of every landing page section.
 * Uses HeroUI Chip with primary-color border styling.
 */
export default function SectionBadge({
  children,
  className = "",
  live = false,
  icon,
}: SectionBadgeProps) {
  return (
    <Chip
      variant="bordered"
      classNames={{
        base: `backdrop-blur-md border border-slate-200/50 dark:border-slate-800/40 bg-white/40 dark:bg-white/5 h-auto py-1.5 px-4 rounded-full transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10 cursor-default shadow-sm ${className}`,
        content:
          "text-[10px] md:text-[11px] text-slate-600 dark:text-blue-400 font-extrabold uppercase tracking-[0.16em] leading-none px-0.5",
      }}
      startContent={
        <span className="flex items-center">
          {icon && <span className="opacity-70 dark:opacity-100 text-blue-600 dark:text-blue-400 mr-1.5">{icon}</span>}
          {live && (
            <span className="relative flex h-2 w-2 mr-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400" />
            </span>
          )}
        </span>
      }
    >
      {children}
    </Chip>
  );
}
