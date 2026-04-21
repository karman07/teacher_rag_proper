'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Brain, AlertTriangle, BarChart2, Target,
  MessageSquare, ChevronDown, ChevronUp, Lightbulb, Activity,
} from 'lucide-react';
import {
  getTopicInsights, getWeakAreas, getActivityByDay,
  getSubjectBreakdown, TopicInsight, WeakArea, getQuestionRecords,
} from '@/app/lib/analytics';

// ── Mini bar chart ─────────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md bg-blue-100 relative overflow-hidden" style={{ height: 48 }}>
            <motion.div
              className="absolute bottom-0 w-full bg-blue-500 rounded-t-md"
              initial={{ height: 0 }}
              animate={{ height: `${(d.count / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

// ── Horizontal topic bar ───────────────────────────────────────────────────────
function TopicBar({ topic, count, percentage, rank }: { topic: string; count: number; percentage: number; rank: number }) {
  const colors = [
    { bar: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
    { bar: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100' },
    { bar: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100' },
    { bar: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    { bar: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
  ];
  const c = colors[rank % colors.length];

  return (
    <div className={`p-3 rounded-xl border ${c.border} ${c.light}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black text-slate-700">{topic}</span>
        <span className={`text-xs font-black ${c.text}`}>{count}×</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/60">
        <motion.div
          className={`h-full rounded-full ${c.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-slate-400 font-semibold">{percentage}% of questions</span>
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
    <div className="flex items-center gap-6">
      <div
        className="w-20 h-20 rounded-full shrink-0"
        style={{
          background: data.length
            ? `conic-gradient(${gradientStops.join(', ')})`
            : '#f1f5f9',
          boxShadow: 'inset 0 0 0 8px white',
        }}
      />
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.slice(0, 4).map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-xs font-bold text-slate-600 truncate">{d.subject}</span>
            <span className="ml-auto text-xs font-black text-slate-800">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Weak Area Card ────────────────────────────────────────────────────────────
function WeakAreaCard({ area, index }: { area: WeakArea; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const severity = area.repetitions >= 5 ? 'high' : area.repetitions >= 3 ? 'medium' : 'low';
  const sevConfig = {
    high: { label: 'Needs Focus', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
    medium: { label: 'Review', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    low: { label: 'Watch', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' },
  }[severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-xl border p-4 ${sevConfig.bg} ${sevConfig.border}`}
    >
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${sevConfig.dot}`} />
          <div>
            <p className="text-sm font-black text-slate-800">{area.topic}</p>
            <p className={`text-[10px] font-bold ${sevConfig.text}`}>{sevConfig.label} · asked {area.repetitions}×</p>
          </div>
        </div>
        <button className="text-slate-400">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 space-y-1.5"
        >
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Questions</p>
          {area.questions.map((q, i) => (
            <div key={i} className="text-xs font-medium text-slate-600 pl-3 border-l-2 border-slate-300 italic">
              "{q.length > 80 ? q.slice(0, 80) + '…' : q}"
            </div>
          ))}
          <p className="text-[10px] text-slate-500 mt-2 font-medium pt-1 border-t border-slate-200/60">
            💡 {area.reason}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Main Analytics Panel ──────────────────────────────────────────────────────
export default function AnalyticsPanel() {
  const [topics, setTopics] = useState<TopicInsight[]>([]);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [activity, setActivity] = useState<{ day: string; count: number }[]>([]);
  const [subjects, setSubjects] = useState<{ subject: string; count: number; color: string }[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTopics(getTopicInsights());
    setWeakAreas(getWeakAreas());
    setActivity(getActivityByDay());
    setSubjects(getSubjectBreakdown());
    setTotalQuestions(getQuestionRecords().length);
  }, []);

  if (!mounted) return null;

  const hasData = totalQuestions > 0;

  if (!hasData) {
    return (
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Learning Analytics</h2>
          <p className="text-sm font-medium mt-1 text-slate-500">AI-powered insights from your study sessions</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-5">
            <BarChart2 size={36} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">No Data Yet</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm">
            Start asking questions in your classrooms and your AI will analyze your learning patterns here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Learning Analytics</h2>
          <p className="text-sm font-medium mt-1 text-slate-500">
            Pattern analysis from {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Row 1: Activity + Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Daily Activity</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Questions asked per day (last 7 days)</p>
            </div>
          </div>
          <MiniBarChart data={activity} />
        </div>

        {/* Subject Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <BarChart2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">By Subject</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Questions per classroom</p>
            </div>
          </div>
          {subjects.length > 0
            ? <DonutChart data={subjects} />
            : <p className="text-xs text-slate-400 font-medium py-6 text-center">Ask questions in your classrooms</p>
          }
        </div>
      </div>

      {/* Row 2: Topic Analysis + Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Frequency */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Topic Frequency</h3>
              <p className="text-[10px] text-slate-400 font-semibold">What you explore most</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {topics.slice(0, 5).map((t, i) => (
              <TopicBar key={t.topic} topic={t.topic} count={t.count} percentage={t.percentage} rank={i} />
            ))}
            {topics.length === 0 && (
              <p className="text-xs text-slate-400 font-medium py-6 text-center">No topic data yet</p>
            )}
          </div>
        </div>

        {/* Weak Areas */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Brain size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">AI Weak Area Detector</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Topics you revisit frequently</p>
            </div>
          </div>
          {weakAreas.length > 0 ? (
            <div className="space-y-2.5">
              {weakAreas.map((area, i) => (
                <WeakAreaCard key={area.topic} area={area} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Target size={24} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">Looking Strong!</p>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  No recurring weak spots detected yet. Keep studying!
                </p>
              </div>
            </div>
          )}

          {/* AI Tip */}
          {weakAreas.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
              <Lightbulb size={14} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-[10px] font-medium text-blue-700 leading-relaxed">
                <strong>AI Tip:</strong> Topics with repeated questions usually indicate gaps in foundational understanding. Try reviewing the source material directly in your classroom.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Recent Questions */}
      {topics.length > 0 && topics[0]?.questions?.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">Top Questions by Topic</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Sample questions from your most active topics</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topics.slice(0, 4).map((t) =>
              t.questions.slice(0, 2).map((q, qi) => (
                <div
                  key={`${t.topic}-${qi}`}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5 shrink-0">{t.topic.split(' ')[0]}</span>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-2">"{q}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
