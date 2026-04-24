"use client";

import { Chip } from "@heroui/react";

interface SectionBadgeProps {
  children: React.ReactNode;
  className?: string;
  /** Show the pulsing live-dot indicator (default: false) */
  live?: boolean;
  /** Optional icon to lead the badge */
  icon?: React.ReactNode;
  /** Custom text/dot color */
  color?: string;
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
  color,
}: SectionBadgeProps) {
  return (
    <Chip
      variant="bordered"
      classNames={{
        base: `backdrop-blur-md border border-slate-200/50 bg-white/40 h-auto py-1.5 px-4 rounded-full transition-all duration-300 hover:bg-white/60 cursor-default shadow-sm ${className}`,
        content:
          `text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.16em] leading-none px-0.5 ${color ? '' : 'text-slate-600'}`,
      }}
      style={color ? { color } : undefined}
      startContent={
        <span className="flex items-center">
          {icon && <span className="opacity-70 text-blue-600 mr-1.5">{icon}</span>}
          {live && (
            <span className="relative flex h-2 w-2 mr-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: color || '#3b82f6' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color || '#2563eb' }} />
            </span>
          )}
        </span>
      }
    >
      {children}
    </Chip>
  );
}
