'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Button, Skeleton } from '@heroui/react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { analyticsApi, AnalyticsSummary, TopQuestion, RecentQuery, TopicStat } from '../../lib/analyticsApi';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie
} from 'recharts';
import {
  MessageCircle, TrendingUp, Clock, Hash,
  RefreshCw, BarChart3, Users, Eye, ArrowUpRight, Zap, ChevronDown, FolderOpen
} from 'lucide-react';
import { BookOpen as SubjectIcon } from 'lucide-react';
import { subjectsApi, Subject } from '../../lib/subjects';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-[11px] rounded-2xl px-4 py-3 shadow-2xl border border-divider bg-content1/80 backdrop-blur-md">
      <p className="font-black mb-2 text-foreground uppercase tracking-widest">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <p className="font-bold flex-1" style={{ color: p.color }}>
            {p.name}: <span className="text-foreground ml-1">{p.value}</span>
          </p>
        </div>
      ))}
    </div>
  );
};

function MiniSparkline({ data, color }: { data: any[], color: string }) {
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey="value" stroke={color} fill={`${color}20`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PremiumStatCard({ label, value, trend, icon: Icon, color, loading, sparkData }: any) {
  return (
    <Card className="border border-slate-200/50 dark:border-slate-800/50 shadow-sm bg-white dark:bg-slate-900/50 group overflow-hidden">
      <CardBody className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <Skeleton className="h-8 w-1/2 rounded-xl" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
          </div>
        ) : (
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-transform group-hover:scale-110">
                <Icon size={22} style={{ color }} />
              </div>
              {sparkData && <MiniSparkline data={sparkData} color={color} />}
            </div>
            
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">{value}</h3>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            </div>

            {trend && (
              <div className="mt-4 flex items-center gap-1.5 border-t border-slate-50 dark:border-slate-800 pt-4">
                <div className={`p-0.5 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  <ArrowUpRight size={10} className={trend < 0 ? 'rotate-90' : ''} />
                </div>
                <span className={`text-[10px] font-black ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {Math.abs(trend)}% {trend > 0 ? 'increase' : 'decrease'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 ml-auto">vs last period</span>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [subjects,   setSubjects]   = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [summary,      setSummary]      = useState<AnalyticsSummary | null>(null);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [recentQ,      setRecentQ]      = useState<RecentQuery[]>([]);
  const [topics,       setTopics]       = useState<TopicStat[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  const fetchAll = useCallback(async () => {
    try {
      const sid = selectedSubjectId === 'all' ? undefined : selectedSubjectId;
      const [s, tq, rq, top, sb] = await Promise.all([
        analyticsApi.getSummary(sid),
        analyticsApi.getTopQuestions(10, sid),
        analyticsApi.getRecentQueries(20, sid),
        analyticsApi.getTopics(sid),
        subjectsApi.list(),
      ]);
      setSummary(s);
      setTopQuestions(tq);
      setRecentQ(rq);
      setTopics(top);
      setSubjects(sb);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSubjectId]);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  const chartData = summary?.last7Days.map(d => ({
    ...d,
    total: d.teacherQ + d.studentQ
  })) ?? [];

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-8 px-4 pb-20">

        {/* -- Cinematic Header -- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 shadow-sm">
              <FolderOpen size={14} className="text-blue-600" />
              <select 
                value={selectedSubjectId}
                onChange={(e) => { setSelectedSubjectId(e.target.value); setLoading(true); }}
                className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer pr-6 appearance-none text-slate-600 dark:text-slate-300"
              >
                <option value="all">Global Snapshot</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown size={12} className="text-slate-400 pointer-events-none -ml-5" />
            </div>
            
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block" />

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em]">
                <Zap size={14} fill="currentColor" /> System Intelligence
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {selectedSubjectId === 'all' ? 'System Performance' : subjects.find(s => s.id === selectedSubjectId)?.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" variant="shadow" color="primary" onClick={() => fetchAll()} isLoading={refreshing}
              className="font-black text-[11px] uppercase tracking-widest h-10 px-6 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 shadow-blue-500/20">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Sync Data
            </Button>
          </div>
        </div>

        {/* -- Key Metrics Tier -- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <PremiumStatCard label="AI Interactions" value={summary?.totalQueries ?? 0} trend={12} icon={MessageCircle} color="#2563eb" loading={loading} />
          <PremiumStatCard label="Page Views" value={summary?.engagement?.pageViews ?? 0} trend={24} icon={Eye} color="#0ea5e9" loading={loading} />
          <PremiumStatCard label="Enrolled Students" value={summary?.engagement?.joined ?? 0} trend={5} icon={Users} color="#8b5cf6" loading={loading} />
          <PremiumStatCard label="Avg Response" value={`${summary?.avgResponseMs ?? 0}ms`} trend={15} icon={Clock} color="#f59e0b" loading={loading} />
        </div>

        {/* -- Primary Visualizations -- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Engagement Area Chart */}
          <Card className="xl:col-span-2 border border-slate-200/50 dark:border-slate-800/50 shadow-none bg-white dark:bg-slate-900/50 overflow-hidden">
            <CardHeader className="flex flex-col items-start gap-1 p-8">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Interaction Velocity</h3>
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Query volume distributed by role over the last 7 days</p>
            </CardHeader>
            <CardBody className="px-4 pb-8 h-[350px]">
              {loading ? <Skeleton className="w-full h-full rounded-3xl" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTeacher" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorStudent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(100,116,139,0.08)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeights: 900, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeights: 900, fill: '#94a3b8' }} dx={-10} />
                    <ReTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="teacherQ" name="Teacher" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorTeacher)" />
                    <Area type="monotone" dataKey="studentQ" name="Student" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorStudent)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardBody>
          </Card>

          {/* Topics Distribution */}
          <Card className="border border-slate-200/50 dark:border-slate-800/50 shadow-none bg-white dark:bg-slate-900/50">
            <CardHeader className="p-8">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-pink-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Most Asked Topics</h3>
              </div>
            </CardHeader>
            <CardBody className="px-8 pb-8 flex flex-col justify-center">
              {loading ? <Skeleton className="w-full h-full rounded-3xl" /> : topics.length > 0 ? (
                <div className="space-y-5">
                  {topics.slice(0, 5).map((t, idx) => {
                    const max = topics[0].count;
                    return (
                      <div key={t.topic} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{t.topic}</p>
                          <p className="text-[10px] font-black text-slate-400 tabular-nums">{t.count} QUESTIONS</p>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-50 dark:bg-slate-800 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(t.count / max) * 100}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className="h-full rounded-full bg-gradient-to-r from-pink-600 to-rose-400" 
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold text-center italic">Topics are automatically semantic-extracted from AI queries.</p>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-sm font-bold text-slate-400 italic">No topics categorized yet.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* -- Secondary Tier: Activity Log & Distribution -- */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Query Source Distribution */}
          <Card className="lg:col-span-2 border border-slate-200/50 dark:border-slate-800/50 shadow-none bg-white dark:bg-slate-900/50">
            <CardHeader className="p-8 pb-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Classroom Engagement</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Source breakdown of all AI interactions</p>
            </CardHeader>
            <CardBody className="flex flex-col items-center">
              {loading ? <Skeleton className="w-48 h-48 rounded-full" /> : summary && (
                <div className="w-full h-[300px] flex flex-col">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Teacher', value: summary.teacherQueries },
                          { name: 'Student', value: summary.studentQueries }
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={10}
                        dataKey="value"
                      >
                        <Cell fill="#2563eb" />
                        <Cell fill="#8b5cf6" />
                      </Pie>
                      <ReTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-8 pb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-lg bg-blue-600" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{summary.teacherQueries}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-lg bg-violet-500" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{summary.studentQueries}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Detailed Interaction Log */}
          <Card className="lg:col-span-3 border border-slate-200/50 dark:border-slate-800/50 shadow-none bg-white dark:bg-slate-900/50">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Detailed Interaction Log</h3>
              </div>
            </CardHeader>
            <CardBody className="px-5 pb-8">
              {loading ? <Skeleton className="w-full h-64 rounded-3xl" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-50 dark:border-slate-800">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Participant</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Context</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Query Snippet</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {recentQ.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${q.askedBy === 'teacher' ? 'bg-blue-600' : 'bg-violet-500'}`} />
                              <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                {q.askedBy === 'teacher' ? 'Teacher' : (q.student?.name ?? 'Student')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{q.subject?.name ?? 'General'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{q.topic ?? 'Semantic Context'}</p>
                          </td>
                          <td className="px-4 py-4 max-w-[200px]">
                            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate italic" title={q.question}>"{q.question}"</p>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="text-[10px] font-black text-slate-900 dark:text-white tabular-nums">
                              {new Date(q.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
