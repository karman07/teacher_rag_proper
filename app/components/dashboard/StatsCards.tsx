'use client';

import { motion } from 'framer-motion';
import { Card, CardBody, Skeleton } from '@heroui/react';
import { FileText, HardDrive, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { formatBytes, KnowledgeBaseStats } from '../../lib/knowledgeBase';
import { COLORS } from '../../constants/colors';

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' as const } }),
};

// All accent colors from COLORS constants — no gradients
const ACCENT = [
  { iconColor: COLORS.primary[600] },             // blue
  { iconColor: COLORS.accent.violet },             // violet
  { iconColor: COLORS.accent.emerald },            // emerald
  { iconColor: COLORS.accent.amber },              // amber
];

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accentColor: string;
  badge?: string;
  index: number;
  isLoading: boolean;
}

function StatCard({ label, value, sub, icon: Icon, accentColor, badge, index, isLoading }: StatCardProps) {
  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={CARD_VARIANTS}>
      <Card shadow="none" classNames={{ base: 'bg-content1' }}
        className="border border-divider overflow-hidden">
        {/* 2px solid top accent line — no gradient */}
        <div className="h-[2px] w-full" style={{ backgroundColor: accentColor }} />

        <CardBody className="p-5">
          <div className="flex items-start justify-between mb-4">
            {/* Icon with very faint bg */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}12` }}>
              <Icon size={18} style={{ color: accentColor }} strokeWidth={2} />
            </div>
            {badge && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border"
                style={{ borderColor: `${accentColor}30`, color: accentColor }}>
                {badge}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-14 rounded-lg" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-black text-foreground tracking-tight leading-none mb-1">
                {String(value)}
              </p>
              <p className="text-xs font-semibold text-default-500">{label}</p>
              <p className="text-[11px] text-default-400 mt-0.5">{sub}</p>
            </>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}

interface Props {
  stats: KnowledgeBaseStats | null;
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: Props) {
  const healthPct = stats && stats.totalFiles > 0
    ? Math.round((stats.readyFiles / stats.totalFiles) * 100)
    : 0;

  const cards: Omit<StatCardProps, 'index' | 'isLoading'>[] = [
    {
      label: 'Total Documents',
      value: stats?.totalFiles ?? 0,
      sub: 'In your knowledge base',
      icon: FileText,
      accentColor: COLORS.primary[600],
    },
    {
      label: 'Storage Used',
      value: stats ? formatBytes(stats.totalSizeBytes) : '0 B',
      sub: 'Across all sources',
      icon: HardDrive,
      accentColor: COLORS.accent.violet,
    },
    {
      label: 'Ready for RAG',
      value: stats?.readyFiles ?? 0,
      sub: 'Available for Q&A',
      icon: CheckCircle2,
      accentColor: COLORS.accent.emerald,
      badge: stats?.readyFiles ? 'Active' : undefined,
    },
    {
      label: 'KB Health',
      value: stats?.errorFiles ? `${stats.errorFiles} failed` : `${healthPct}%`,
      sub: stats?.processingFiles ? `${stats.processingFiles} processing…` : 'All files indexed',
      icon: stats?.errorFiles ? AlertCircle : TrendingUp,
      accentColor: stats?.errorFiles ? '#f43f5e' : COLORS.accent.amber,
      badge: stats?.errorFiles ? `${stats.errorFiles} error${stats.errorFiles > 1 ? 's' : ''}` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <StatCard key={card.label} {...card} index={i} isLoading={isLoading} />
      ))}
    </div>
  );
}
