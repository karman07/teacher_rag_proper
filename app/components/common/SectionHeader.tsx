import React from "react";
import SectionBadge from "./SectionBadge";

interface SectionHeaderProps {
  /** Short pill label above the heading */
  badge: string;
  /** Main heading content — can include JSX for gradient spans */
  title: React.ReactNode;
  /** Supporting subtitle paragraph */
  subtitle: string;
  /** Center-align everything (default: true) */
  centered?: boolean;
  /** Extra classes on the wrapper */
  className?: string;
  /** Max width applied to the subtitle paragraph */
  subtitleMaxWidth?: string;
}

/**
 * Reusable section header used across all landing-page sections.
 * Renders: badge → h2 → subtitle, with optional centering.
 */
export default function SectionHeader({
  badge,
  title,
  subtitle,
  centered = true,
  className = "",
  subtitleMaxWidth = "max-w-2xl",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col mb-16 lg:mb-20 ${
        centered ? "items-center text-center" : "items-start text-left"
      } ${className}`}
    >
      <SectionBadge className="mb-5">{badge}</SectionBadge>

      <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-5 leading-tight">
        {title}
      </h2>

      <p
        className={`text-xl text-slate-600 dark:text-slate-400 leading-relaxed ${
          centered ? `${subtitleMaxWidth} mx-auto` : subtitleMaxWidth
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
}
