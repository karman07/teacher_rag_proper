'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Chip } from '@heroui/react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import {
  TrendingUp, MessageCircle, FileText, Star, Hash, Layers
} from 'lucide-react';
import { KnowledgeFile, formatBytes } from '../../lib/knowledgeBase';
import { AnalyticsSummary, TopQuestion } from '../../lib/analyticsApi';

const CHART_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#ef4444', '#ec4899'];

interface Props {
  files: KnowledgeFile[];
  summary?: AnalyticsSummary | null;
  topQuestions?: TopQuestion[];
}

/* --- Custom tooltip ------------------------------------------------------- */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-content1 border border-divider rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard({ files, summary, topQuestions = [] }: Props) {
  /* Derive file type distribution */
  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    files.forEach((f) => {
      const ext = f.originalName.split('.').pop()?.toUpperCase() ?? 'OTHER';
      counts[ext] = (counts[ext] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [files]);

  /* Source distribution */
  const sourceDistribution = useMemo(() => {
    const SOURCE_LABEL: Record<string, string> = {
      upload: 'Direct', google_drive: 'Drive', dropbox: 'Dropbox'
    };
    const counts: Record<string, number> = {};
    files.forEach((f) => {
      const label = SOURCE_LABEL[f.source] ?? f.source;
      counts[label] = (counts[label] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [files]);

  /* File size bar data */
  const fileSizeData = useMemo(() =>
    [...files]
      .sort((a, b) => b.sizeBytes - a.sizeBytes)
      .slice(0, 8)
      .map((f) => ({
        name: f.originalName.length > 18 ? f.originalName.slice(0, 18) + '…' : f.originalName,
        size: Math.round(f.sizeBytes / 1024), // KB
      })),
  [files]);

  const totalChunks = files.reduce((acc, f) => acc + (f.chunkCount ?? 0), 0);
  const readyFiles  = files.filter((f) => f.status === 'ready').length;

  return (
    <div className="space-y-6">

      {/* -- Quick stats -- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Queries',   value: summary?.totalQueries ?? '—', icon: MessageCircle, color: '#2563eb', bg: '#eff6ff' },
          { label: 'Indexed Chunks',  value: totalChunks || '—',           icon: Layers,         color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Files Ready',     value: `${readyFiles}/${files.length}`, icon: FileText,    color: '#059669', bg: '#f0fdf4' },
          { label: 'Top Question',    value: topQuestions[0]?.count ?? '—', icon: Star,          color: '#d97706', bg: '#fffbeb' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card className="border border-divider shadow-none" classNames={{ base: 'bg-content1' }}>
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: s.bg }}>
                      <Icon size={18} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-foreground leading-none">{String(s.value)}</p>
                      <p className="text-[11px] text-default-400 mt-0.5">{s.label}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* -- Weekly activity (2/3 width) -- */}
        <Card className="lg:col-span-2 border border-divider shadow-none" classNames={{ base: 'bg-content1' }}>
          <CardHeader className="flex items-center gap-2 px-5 pt-5 pb-1">
            <TrendingUp size={16} className="text-primary" />
            <p className="text-sm font-bold text-foreground">Weekly Activity</p>
            {summary && <Chip size="sm" color="primary" variant="flat" className="ml-auto text-[10px] font-bold">Live</Chip>}
          </CardHeader>
          <CardBody className="px-2 pb-4">
            {(summary?.last7Days?.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={summary!.last7Days} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="teacherQ" name="Teacher"  stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="studentQ" name="Student" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-default-400">No query activity yet</div>
            )}
          </CardBody>
        </Card>

        {/* -- Source distribution (1/3 width) -- */}
        <Card className="border border-divider shadow-none" classNames={{ base: 'bg-content1' }}>
          <CardHeader className="px-5 pt-5 pb-1">
            <p className="text-sm font-bold text-foreground">File Sources</p>
          </CardHeader>
          <CardBody className="flex flex-col items-center pb-4">
            {sourceDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={sourceDistribution}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {sourceDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {sourceDistribution.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-[11px] text-default-500">{s.name} ({s.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-default-400">No data yet</div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* -- Top questions -- */}
        <Card className="border border-divider shadow-none" classNames={{ base: 'bg-content1' }}>
          <CardHeader className="flex items-center gap-2 px-5 pt-5 pb-3">
            <Hash size={16} className="text-primary" />
            <p className="text-sm font-bold text-foreground">Top Questions Asked</p>
          </CardHeader>
          <CardBody className="px-5 pb-5 space-y-2.5">
            {topQuestions.length === 0 ? (
              <p className="text-xs text-default-400 py-4 text-center">No queries logged yet</p>
            ) : (
              topQuestions.map((q, i) => {
                const max = topQuestions[0]?.count ?? 1;
                return (
                  <div key={i} className="flex items-center gap-3 group">
                    <span className={`text-xs font-black w-4 flex-shrink-0 ${
                      i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-600' : 'text-default-300'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate font-medium">{q.question}</p>
                      <div className="mt-1 h-1.5 bg-default-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(q.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-foreground tabular-nums flex-shrink-0">{q.count}</span>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>

        {/* -- File size bar chart -- */}
        <Card className="border border-divider shadow-none" classNames={{ base: 'bg-content1' }}>
          <CardHeader className="px-5 pt-5 pb-1">
            <p className="text-sm font-bold text-foreground">File Sizes (KB)</p>
          </CardHeader>
          <CardBody className="pb-4 px-1">
            {fileSizeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={fileSizeData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(100,116,139,0.1)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
                  <ReTooltip content={<CustomTooltip />} formatter={(v: any) => [`${v} KB`, 'Size']} />
                  <Bar dataKey="size" fill="#2563eb" radius={[0, 6, 6, 0]}>
                    {fileSizeData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-default-400">
                Upload files to see size distribution
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* -- File type distribution -- */}
      <Card className="border border-divider shadow-none" classNames={{ base: 'bg-content1' }}>
        <CardHeader className="px-5 pt-5 pb-1">
          <p className="text-sm font-bold text-foreground">Content Type Breakdown</p>
        </CardHeader>
        <CardBody className="pb-4 px-2">
          {typeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={typeDistribution} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <ReTooltip content={<CustomTooltip />} formatter={(v: any) => [v, 'Files']} />
                <Bar dataKey="value" name="Files" radius={[6, 6, 0, 0]}>
                  {typeDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-24 flex items-center justify-center text-xs text-default-400">
              Upload files to see breakdown
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
