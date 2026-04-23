'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Brain, BarChart2, Target,
  MessageSquare, ChevronDown, Lightbulb, Activity, Bot, Sparkles,
} from 'lucide-react';
import {
  TopicInsight, WeakArea,
} from '@/app/lib/analytics';
import { studentApi } from '@/app/lib/api';

// ── Mini bar chart ─────────────────────────────────────────────────────────────
function MiniBarChart({ data, timeframe }: { data: { day: string; count: number }[], timeframe: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-26 overflow-x-auto scrollbar-none pb-2">
      {data.map((d, i) => {
        // Split label for cleaner two-line display (e.g. "Mar 24" -> "Mar" + "24")
        const parts = d.day.split(' ');
        const labelTop = parts[0];
        const labelBottom = parts[1] || '';

        return (
          <div key={i} className="flex-1 min-w-[36px] flex flex-col items-center gap-2.5">
            <div className="w-full rounded-full bg-slate-50 relative overflow-hidden group border border-slate-100/50" style={{ height: 64 }}>
              <motion.div
                className={`absolute bottom-0 w-full ${d.count > 0 ? 'bg-blue-600' : 'bg-slate-200'} rounded-full shadow-[0_-4px_12px_rgba(37,99,235,0.1)] group-hover:bg-blue-500 transition-colors`}
                initial={{ height: 0 }}
                animate={{ height: `${(Math.max(d.count, 0) / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.02, ease: 'easeOut' }}
              />
              {d.count > 0 && (
                  <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-blue-600/10 pointer-events-none">
                      <span className="text-[10px] font-black text-blue-700">{d.count}</span>
                  </div>
              )}
            </div>
            <div className="flex flex-col items-center leading-none gap-0.5 select-none">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{labelTop}</span>
              {labelBottom && (
                <span className="text-[10px] font-black text-slate-600 tracking-tighter">{labelBottom}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Horizontal topic bar ───────────────────────────────────────────────────────
function TopicBar({ topic, count, percentage, rank }: { topic: string; count: number; percentage: number; rank: number }) {
  const colors = [
    { bar: 'bg-blue-600', text: 'text-blue-700', border: 'border-slate-100' },
    { bar: 'bg-blue-500', text: 'text-blue-700', border: 'border-slate-100' },
    { bar: 'bg-indigo-600', text: 'text-indigo-700', border: 'border-slate-100' },
    { bar: 'bg-sky-600', text: 'text-sky-700', border: 'border-slate-100' },
    { bar: 'bg-violet-600', text: 'text-violet-700', border: 'border-slate-100' },
  ];
  const c = colors[rank % colors.length];

  return (
    <div className={`p-4 rounded-2xl border ${c.border} bg-white shadow-sm hover:shadow-md transition-all group`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-black text-slate-800">{topic}</span>
        <span className={`text-xs font-black px-2 py-1 rounded-lg bg-slate-50 ${c.text}`}>{count} questions</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${c.bar} shadow-sm shadow-blue-500/20`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{percentage}% share</span>
      </div>
    </div>
  );
}

// ── Donut chart (CSS-based) ───────────────────────────────────────────────────
function DonutChart({ data }: { data: { subject: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  let cumulativePct = 0;

  const gradientStops = data.map(d => {
    const pct = (d.count / total) * 100;
    const stop = `${d.color} ${cumulativePct}% ${cumulativePct + pct}%`;
    cumulativePct += pct;
    return stop;
  });

  return (
    <div className="flex items-center gap-8">
      <div
        className="w-24 h-24 rounded-full shrink-0 relative flex items-center justify-center"
        style={{
          background: data.length
            ? `conic-gradient(${gradientStops.join(', ')})`
            : '#f1f5f9',
        }}
      >
          <div className="absolute inset-0 rounded-full border-[8px] border-white shadow-inner" />
          <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center z-10">
              <Bot size={18} className="text-blue-600" />
          </div>
      </div>
      <div className="space-y-2 flex-1 min-w-0">
        {data.slice(0, 4).map((d, i) => (
          <div key={i} className="flex items-center gap-3 group">
            <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: d.color }} />
            <span className="text-[11px] font-black text-slate-600 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{d.subject}</span>
            <span className="ml-auto text-xs font-black text-slate-900 tabular-nums">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Weak Area Card ────────────────────────────────────────────────────────────
function WeakAreaCard({ area, index }: { area: WeakArea & { repetitions: number }; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const severity = area.repetitions >= 5 ? 'high' : area.repetitions >= 3 ? 'medium' : 'low';
  const sevConfig = {
    high: { label: 'Needs Focus', border: 'border-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    medium: { label: 'Review', border: 'border-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    low: { label: 'Watch', border: 'border-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  }[severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-2xl border p-4 bg-white shadow-sm hover:shadow-md transition-all ${sevConfig.border}`}
    >
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${sevConfig.dot} animate-pulse`} />
          <div>
            <p className="text-sm font-black text-slate-900 leading-none mb-1">{area.topic}</p>
            <p className={`text-[10px] font-black uppercase tracking-widest ${sevConfig.text}`}>{sevConfig.label} · {area.repetitions} reps</p>
          </div>
        </div>
        <div className={`p-1.5 rounded-lg bg-slate-50 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={14} />
        </div>
      </div>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-4 space-y-2 pt-4 border-t border-slate-50"
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Questions</p>
          {area.questions.map((q, i) => (
            <div key={i} className="text-[11px] font-bold text-slate-600 pl-3 border-l-2 border-blue-600/30 italic bg-slate-50/50 py-3 rounded-r-xl">
              "{q.length > 80 ? q.slice(0, 80) + '…' : q}"
            </div>
          ))}
          <div className="p-3 bg-blue-50/50 rounded-xl mt-4 border border-blue-100/50">
            <p className="text-[10px] text-blue-700 font-bold leading-relaxed px-1">
                💡 {area.reason || 'Consider reviewing foundational concepts in this area.'}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Main Analytics Panel ──────────────────────────────────────────────────────
export default function AnalyticsPanel() {
  const [topics, setTopics] = useState<TopicInsight[]>([]);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [activity, setActivity] = useState<{ day: string; count: number }[]>([]);
  const [subjects, setSubjects] = useState<{ subject: string; count: number; color: string }[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('7d');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
        const data = await studentApi.getPersonalAnalytics(timeframe);
        setTopics(data.topics || []);
        setWeakAreas(data.weakAreas || []);
        setActivity(data.activity || []);
        setSubjects(data.subjects || []);
        setTotalQuestions(data.totalQuestions || 0);
    } catch (e) {
        console.error('Failed to fetch analytics:', e);
    } finally {
        setLoading(false);
    }
  };

  if (!mounted) return null;

  const hasData = totalQuestions > 0 || loading;

  if (!hasData) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Learning Analytics</h2>
          <p className="text-sm font-medium mt-1 text-slate-500">AI-powered insights from your study sessions</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-[2.5rem] bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-inner text-blue-200">
            <BarChart2 size={36} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No Data Points Recorded</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
            Personal analytics are generated after you ask questions in your classrooms. Start learning to see your patterns here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={`space-y-8 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Learning Analytics</h2>
          <p className="text-sm font-bold mt-2 text-slate-500 flex items-center gap-2 uppercase tracking-wide">
            <Sparkles size={14} className="text-blue-600" /> AI analysis of {totalQuestions} historical questions
          </p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm self-start">
          {(['7d', '30d', 'all'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                timeframe === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : 'Full Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Activity + Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Daily Activity Chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col group hover:border-blue-600/30 transition-colors">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm text-blue-600 flex items-center justify-center shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Question Frequency</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Timeline engagement</p>
            </div>
          </div>
          <div className="mt-auto">
            <MiniBarChart data={activity} timeframe={timeframe} />
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col hover:border-blue-600/30 transition-colors">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm text-violet-600 flex items-center justify-center shrink-0">
              <BarChart2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Academic Bias</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Activity per subject</p>
            </div>
          </div>
          {subjects.length > 0
            ? <DonutChart data={subjects} />
            : <p className="text-xs text-slate-400 font-medium py-10 text-center uppercase tracking-widest">Awaiting interaction data</p>
          }
        </div>
      </div>

      {/* Row 2: Topic Analysis + Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Topic Frequency List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col hover:border-blue-600/30 transition-colors">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm text-sky-600 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Core Focus Areas</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Semantic topic clustering</p>
            </div>
          </div>
          <div className="space-y-3">
            {topics.slice(0, 5).map((t, i) => (
              <TopicBar key={t.topic} topic={t.topic} count={t.count} percentage={t.percentage} rank={i} />
            ))}
            {topics.length === 0 && (
              <p className="text-xs text-slate-400 font-bold py-10 text-center uppercase tracking-widest">No focus areas identified yet</p>
            )}
          </div>
        </div>

        {/* Weak Area Detector */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 flex flex-col hover:border-blue-600/30 transition-colors">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm text-blue-600 flex items-center justify-center shrink-0">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Learning Vulnerabilities</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Recurring question patterns</p>
            </div>
          </div>
          {weakAreas.length > 0 ? (
            <div className="space-y-4">
              {weakAreas.map((area, i) => (
                <WeakAreaCard key={area.topic} area={area} index={i} />
              ))}
              
              <div className="mt-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20">
                    <Lightbulb size={16} className="text-white" />
                </div>
                <p className="text-[11px] font-bold text-slate-300 leading-relaxed uppercase tracking-tight">
                  <strong className="text-blue-400">Pro Tip:</strong> Revisit topics with 5+ reps. They indicate conceptual debt.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
              <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-inner">
                <Target size={32} />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">Elite Performance!</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 px-6">
                  No recurring confusion patterns found. Keep maintaining this streak.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
