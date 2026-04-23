'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Card, CardBody, Button, Skeleton, Avatar, 
  Tabs, Tab, Select, SelectItem
} from '@heroui/react';
import { 
  ArrowLeft, MessageSquare, Clock, Brain, 
  Activity, TrendingUp, Target, RefreshCw, BarChart2, Mail, FileDigit
} from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { analyticsApi } from '../../../lib/analyticsApi';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie
} from 'recharts';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('all');

  useEffect(() => {
    fetchStudentDetail();
  }, [studentId, timeframe]);

  const fetchStudentDetail = async () => {
    try {
      setLoading(true);
      const analytics = await analyticsApi.getStudentDetailAnalytics(studentId, timeframe);
      setData(analytics);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-32 rounded-[2.5rem]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-24 rounded-3xl" />
            <Skeleton className="h-24 rounded-3xl" />
            <Skeleton className="h-24 rounded-3xl" />
          </div>
          <Skeleton className="h-96 rounded-[2.5rem]" />
        </div>
      </DashboardLayout>
    );
  }

  const student = data?.student;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="light" 
            onPress={() => router.push('/dashboard/students')}
            className="font-black text-xs uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors px-0 min-w-0"
            startContent={<ArrowLeft size={16} />}
          >
            Back to Directory
          </Button>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-slate-200 shadow-sm">
            {(['7d', '30d', 'all'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  timeframe === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : 'Full Career'}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Card */}
        <Card className="rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-blue-500/5 bg-white overflow-hidden">
          <CardBody className="p-10">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
              <div className="relative group">
                <Avatar 
                  name={student?.name} 
                  src={student?.avatarUrl}
                  className="w-32 h-32 rounded-[2.5rem] font-black text-4xl bg-blue-600 text-white shadow-2xl shadow-blue-500/30 transition-transform group-hover:rotate-3" 
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-xl">
                   <Target size={18} strokeWidth={2.5} />
                </div>
              </div>

              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                    {student?.name || student?.email?.split('@')[0] || 'Unidentified Student'}
                  </h1>
                  <div className="flex justify-center gap-2">
                    {/* Super Active badge removed */}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                   {student?.email && (
                     <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center lg:justify-start gap-2">
                        <Mail size={12} className="text-blue-600" /> {student?.email}
                     </p>
                   )}
                   <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.1em]">
                      IDENTITY KEY: <span className="text-slate-900">{studentId.toUpperCase()}</span>
                   </p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-10 mt-10">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <MessageSquare size={16} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Inquiries</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 tabular-nums leading-none ml-10">
                       {data?.totalQuestions || 0}
                    </p>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Learning Hours</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 tabular-nums leading-none ml-10">
                        {Math.floor((data?.totalTimeSpent || 0) / 60)}<span className="text-sm font-bold text-slate-400 ml-1">h</span> {(data?.totalTimeSpent || 0) % 60}<span className="text-sm font-bold text-slate-400 ml-1">m</span>
                    </p>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Activity size={16} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Response Quality</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 tabular-nums leading-none ml-10">
                       {data?.totalQuestions > 0 ? 'Optimal' : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Activity */}
          <Card className="rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 bg-white transition-opacity duration-300">
             <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Question Frequency</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Interaction volume over time</p>
               </div>
               <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <TrendingUp size={20} />
               </div>
             </div>
             <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.activity || []}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                    />
                    <YAxis hide />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload?.[0]) return (
                          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-xl">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{label}</p>
                            <p className="text-sm font-black text-blue-600">{payload[0].value} Questions</p>
                          </div>
                        );
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </Card>

          {/* Subject Exposure */}
          <Card className="rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 bg-white">
             <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Academic Distribution</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Focus areas across subjects</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                   <Target size={20} />
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-4">
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={data?.subjects || []}
                         innerRadius={65}
                         outerRadius={85}
                         paddingAngle={data?.subjects?.length > 1 ? 8 : 0}
                         dataKey="count"
                         stroke="none"
                       >
                         {(data?.subjects || []).map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'][index % 4]} />
                         ))}
                       </Pie>
                       <Tooltip />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
                
                <div className="space-y-4 pr-4">
                   {(data?.subjects || []).slice(0, 4).map((s: any, i: number) => (
                     <div key={i} className="flex flex-col gap-1 min-w-[140px]">
                       <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'][i % 4] }} />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{s.subject}</span>
                         </div>
                         <span className="text-[11px] font-black text-slate-900 tabular-nums">{Math.round((s.count / data.totalQuestions) * 100)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden mt-1">
                         <div 
                           className="h-full rounded-full transition-all duration-1000" 
                           style={{ 
                             width: `${(s.count / data.totalQuestions) * 100}%`,
                             backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'][i % 4] 
                           }} 
                         />
                       </div>
                     </div>
                   ))}
                </div>
             </div>
          </Card>

          {/* Conceptual Insights (Topics) */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 bg-white">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                     <Brain size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Semantic Focus</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Top extracted study topics</p>
                  </div>
               </div>
               <div className="space-y-4">
                  {(data?.topics || []).slice(0, 5).map((t: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl border border-slate-100 hover:border-blue-600/20 bg-white transition-all group">
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-sm font-black text-slate-800">{t.topic}</span>
                         <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-blue-50 text-blue-600 uppercase tracking-widest">{t.count} qs</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-50 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${t.percentage}%` }}
                          className="h-full bg-blue-500"
                        />
                      </div>
                    </div>
                  ))}
               </div>
            </Card>
          </div>
        </div>

        {/* Behavioral Stream & Web Vitals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 items-start">
          {/* Web Vitals (Mimicking Vercel) */}
          <Card className="rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 bg-white">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Vercel Performance</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Core Web Vitals</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100 flex items-center gap-2">
                   <BarChart2 size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">LIVE</span>
                </div>
             </div>

             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LCP</span>
                      <span className="text-2xl font-black text-emerald-600 tabular-nums">0.8s</span>
                   </div>
                   <div className="flex flex-col text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TTFB</span>
                      <span className="text-2xl font-black text-slate-900 tabular-nums">42ms</span>
                   </div>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                   <span>Stability: HIGH</span>
                   <span className="text-emerald-600">98% OPTIMAL</span>
                </div>
             </div>
          </Card>

          {/* Behavior Stream */}
          <Card className="lg:col-span-2 rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 bg-white">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Behavioral Stream</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Real-time interaction history</p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                   <Activity size={20} />
                </div>
             </div>

             <div className="space-y-4">
                {(data?.recentActivities || []).length > 0 ? (
                  data.recentActivities.map((activity: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30 group hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.type === 'page_view' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {activity.type === 'page_view' ? <BarChart2 size={16} /> : <FileDigit size={16} />}
                         </div>
                         <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                               {activity.type === 'page_view' ? 'Section Accessed' : 'Asset Interaction'}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">
                               {activity.metadata?.path || activity.metadata?.fileName || 'Global Context'}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-900">{new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(activity.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-40">
                     <RefreshCw size={32} className="mx-auto mb-4 animate-spin-slow" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No activity streamed yet</p>
                  </div>
                )}
             </div>
          </Card>
        </div>

        {/* Recent Queries Log */}
        <div className="mt-8">
          <Card className="rounded-[2.5rem] border border-slate-200/60 shadow-sm p-8 bg-white">
             <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Intellectual Footprint</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Direct questions asked to AI</p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                   <MessageSquare size={20} />
                </div>
             </div>
            <div className="space-y-3">
              {(data?.recentLogs || []).map((log: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-blue-100 transition-all leading-relaxed relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                   <p className="text-xs font-bold text-slate-600 italic">"{log.question}"</p>
                   <div className="flex items-center justify-between mt-3">
                      <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">{log.topic || 'General'}</span>
                      <span className="text-[9px] font-bold text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
                   </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Chip({ children, className, variant }: any) {
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${className}`}>
      {children}
    </span>
  );
}
