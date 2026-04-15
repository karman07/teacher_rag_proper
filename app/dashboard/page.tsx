'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Skeleton, Chip } from '@heroui/react';
import {
  LayoutDashboard, TrendingUp, MessageCircle, FolderOpen,
  Upload, RefreshCw, Cpu, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import UploadDropzone from '../components/dashboard/UploadDropzone';
import SourceConnectors from '../components/dashboard/SourceConnectors';
import { knowledgeBaseApi, KnowledgeBaseStats, KnowledgeFile, formatBytes } from '../lib/knowledgeBase';
import { analyticsApi, AnalyticsSummary } from '../lib/analyticsApi';
import { subjectsApi, Subject } from '../lib/subjects';
import { COLORS } from '../constants/colors';
import { BookOpen as SubjectIcon, ChevronDown } from 'lucide-react';
import {
  LineChart, Line, ResponsiveContainer, Tooltip as ReTooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';

const C = { blue: COLORS.primary[600], violet: COLORS.accent.violet };

function QuickStat({ label, value, sub, loading }: { label: string; value: string; sub?: string; loading: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      {loading ? <Skeleton className="h-8 w-20 rounded-lg" /> : (
        <p className="text-2xl font-black text-foreground tabular-nums">{value}</p>
      )}
      <p className="text-xs font-semibold text-foreground">{label}</p>
      {sub && <p className="text-[10px] text-default-400">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [stats,    setStats]    = useState<KnowledgeBaseStats | null>(null);
  const [summary,  setSummary]  = useState<AnalyticsSummary | null>(null);
  const [files,    setFiles]    = useState<KnowledgeFile[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [uploading, setUploading] = useState(false);
  const [subjects,  setSubjects]   = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  // Cache: skip re-fetch if data is less than 30 s old (avoids hammering DB on every nav)
  const lastFetchRef = useRef<number>(0);
  const CACHE_MS = 30_000;

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]); // intentionally omit router — its reference is unstable

  const fetchAll = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetchRef.current < CACHE_MS) return;
    try {
      const [s, an, f, sb] = await Promise.all([
        knowledgeBaseApi.getStats(),
        analyticsApi.getSummary(),
        knowledgeBaseApi.listFiles(),
        subjectsApi.list(),
      ]);
      setStats(s);
      setSummary(an);
      setFiles(f);
      setSubjects(sb);
      lastFetchRef.current = Date.now();
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  const handleNewFile = (file: KnowledgeFile) => {
    setFiles((p) => [file, ...p]);
    // Force-refresh stats after a new upload, bypassing the cache
    knowledgeBaseApi.getStats().then(setStats).catch(() => {});
    lastFetchRef.current = 0; // invalidate cache so next nav re-fetches
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const processingCount = files.filter((f) => f.status === 'processing' || f.status === 'uploading').length;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* -- Welcome & Subject Selector -- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-foreground">
              Welcome back, {user?.name?.split(' ')[0] ?? 'Teacher'} 👋
            </h1>
            <p className="text-xs text-default-400 mt-0.5">
              Your personal AI knowledge base is ready
            </p>
          </div>

          <div className="flex items-center gap-2 bg-content1 border border-divider rounded-xl px-3 py-1.5 shadow-sm">
            <SubjectIcon size={14} className="text-primary" />
            <select 
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-transparent text-xs font-black outline-none cursor-pointer pr-4 appearance-none"
              style={{ color: 'var(--text)' }}
            >
              <option value="all">Global Knowledge Base</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="text-default-400 pointer-events-none -ml-3" />
          </div>
        </div>

        {/* -- Stat strip -- */}
        <Card classNames={{ base: 'border border-divider shadow-none bg-content1' }}>
          <CardBody className="px-6 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-divider">
              <QuickStat label="Total Files"    value={String(stats?.totalFiles ?? 0)}    sub={stats ? formatBytes(stats.totalSizeBytes) : undefined} loading={loading} />
              <div className="pl-6">
                <QuickStat label="Queries Asked" value={String(summary?.totalQueries ?? 0)} sub="all time" loading={loading} />
              </div>
              <div className="pl-6">
                <QuickStat label="Files Ready"   value={`${stats?.readyFiles ?? 0}/${stats?.totalFiles ?? 0}`} loading={loading} />
              </div>
              <div className="pl-6">
                <QuickStat label="Avg Response"  value={summary ? `${summary.avgResponseMs}ms` : '—'} sub="RAG latency" loading={loading} />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* -- Two column -- */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Upload — 2 cols */}
          <Card classNames={{ base: 'lg:col-span-2 border border-divider shadow-none bg-content1' }}>
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <Upload size={15} className="text-default-500" />
                <p className="text-sm font-bold text-foreground">Add Content</p>
              </div>
            </CardHeader>
            <CardBody className="px-5 pb-5">
              <UploadDropzone 
                onUploadComplete={handleNewFile} 
                subjectId={selectedSubjectId !== 'all' ? selectedSubjectId : undefined} 
              />
            </CardBody>
          </Card>

          {/* Mini activity chart — 3 cols */}
          <Card classNames={{ base: 'lg:col-span-3 border border-divider shadow-none bg-content1' }}>
            <CardHeader className="px-5 pt-5 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-default-500" />
                <p className="text-sm font-bold text-foreground">Query Activity</p>
              </div>
              <Link href="/dashboard/analytics">
                <Button size="sm" variant="light" endContent={<ArrowRight size={12} />}
                  className="text-[11px] font-bold text-default-400">
                  Full Analytics
                </Button>
              </Link>
            </CardHeader>
            <CardBody className="px-2 pb-4">
              {loading ? (
                <Skeleton className="h-40 rounded-xl mx-3" />
              ) : (
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart data={summary?.last7Days ?? []} margin={{ top: 5, right: 15, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.06)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <ReTooltip
                      contentStyle={{ background: 'var(--heroui-content1)', border: '1px solid var(--heroui-divider)', borderRadius: '12px', fontSize: 11 }}
                      labelStyle={{ fontWeight: 700 }}
                    />
                    <Line type="monotone" dataKey="queries" name="Queries" stroke={C.blue} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>
        </div>

        {/* -- Quick links -- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: '/dashboard/files',     icon: FolderOpen,    label: 'File Management',    sub: `${files.length} files` },
            { href: '/dashboard/analytics', icon: TrendingUp,    label: 'Analytics',          sub: `${summary?.totalQueries ?? 0} queries` },
            { href: '/dashboard/chat',      icon: MessageCircle, label: 'Ask AI',             sub: 'Chat with your KB' },
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href}>
              <motion.div whileHover={{ y: -2 }} className="p-4 rounded-2xl border border-divider bg-content1
                hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl border border-divider flex items-center justify-center group-hover:border-primary/30 transition-colors">
                    <Icon size={16} className="text-default-500 group-hover:text-primary transition-colors" />
                  </div>
                  <ArrowRight size={14} className="text-default-300 group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm font-bold text-foreground mt-3">{label}</p>
                <p className="text-xs text-default-400 mt-0.5">{sub}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* -- Cloud sources -- */}
        <Card classNames={{ base: 'border border-divider shadow-none bg-content1' }}>
          <CardHeader className="px-5 pt-5 pb-3">
            <p className="text-sm font-bold text-foreground">Import from Cloud</p>
          </CardHeader>
          <CardBody className="px-5 pb-5">
            <SourceConnectors 
              onImportComplete={handleNewFile} 
              subjectId={selectedSubjectId !== 'all' ? selectedSubjectId : undefined} 
            />
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
