'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, GraduationCap, LogOut, BookOpen, Users,
  ChevronRight, CheckCircle2, TrendingUp, MessageSquare,
  Sparkles, Clock, ArrowRight, X, BookMarked, Bot,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { studentApi, getQuestionsAsked } from '@/app/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';

const AnalyticsPanel = dynamic(() => import('@/app/components/AnalyticsPanel'), { ssr: false });

/* Professional blue theme for all cards */
const COLORS = [
  { bg: 'var(--primary-light)', border: 'var(--card-border)', text: 'var(--primary)' },
];

const palette = (_: number) => COLORS[0];

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [classes, setClasses]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining]   = useState(false);
  const [message, setMessage]   = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('student-token');
    if (!stored) { router.push('/login'); return; }
    setQuestionsAsked(getQuestionsAsked());
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await studentApi.getClasses();
      setClasses(data);
    } catch { /* handled */ } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setMessage(null);
    try {
      const res = await studentApi.joinClass(joinCode);
      setMessage({ text: res.message, type: 'success' });
      setJoinCode('');
      fetchClasses();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Invalid class code', type: 'error' });
    } finally {
      setJoining(false);
    }
  };

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const totalMaterials = classes.reduce((acc: number, { subject }: any) => acc + (subject?._count?.files || 0), 0);

  return (
    <div className="page-bg min-h-screen">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <GraduationCap size={22} strokeWidth={2.5} />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">
              Multimodal <span style={{ color: 'var(--primary)' }}>Student</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || ''} className="w-10 h-10 rounded-full border-2 border-slate-100 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                {(user?.name || 'S')[0].toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-900">{user?.name || 'Student'}</p>
              <p className="text-xs font-semibold text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* ── Hero greeting ──────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="label-caps mb-1">Dashboard</p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Good morning, <span style={{ color: 'var(--primary)' }}>{user?.name?.split(' ')[0] || 'Student'}</span> 👋
          </h1>
          <p className="mt-2 text-base font-medium text-slate-500">
            Here's everything happening in your learning universe.
          </p>
        </motion.div>

        {/* ── Stats Row ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {[
            {
              label: 'Classes Joined',
              value: loading ? '—' : classes.length,
              icon: <BookMarked size={24} />,
              color: 'var(--primary)',
              bg: 'var(--primary-light)',
              sub: 'enrolled classrooms',
            },
            {
              label: 'Total Materials',
              value: loading ? '—' : totalMaterials,
              icon: <BookOpen size={24} />,
              color: '#0284c7', // Sky Blue
              bg: '#f0f9ff',
              sub: 'documents available',
            },
            {
              label: 'Questions Asked',
              value: questionsAsked,
              icon: <MessageSquare size={24} />,
              color: 'var(--primary)',
              bg: 'var(--primary-light)',
              sub: 'with the AI assistant',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stat-card p-6 bg-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl" style={{ background: stat.bg, color: stat.color }}>
                  {stat.icon}
                </div>
                <TrendingUp size={16} style={{ color: stat.color, opacity: 0.8 }} />
              </div>
              <p className="text-4xl font-black mb-1 text-slate-900">
                {stat.value}
              </p>
              <p className="label-caps">{stat.label}</p>
              <p className="text-xs mt-1 font-medium text-slate-500">{stat.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Analytics Panel ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <AnalyticsPanel />
        </motion.div>

        {/* ── Main Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left: Classrooms */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">Your Classrooms</h2>
                <p className="text-sm font-medium mt-1 text-slate-500">Click a class to enter and start learning</p>
              </div>
              {!loading && classes.length > 0 && (
                <span className="label-caps px-4 py-2 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                  {classes.length} enrolled
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="skeleton h-48 rounded-3xl" />
                ))}
              </div>
            ) : classes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 rounded-3xl border-2 border-dashed bg-slate-50 border-slate-200"
              >
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <BookOpen size={36} />
                </div>
                <h3 className="text-xl font-black mb-2 text-slate-800">No Classrooms Yet</h3>
                <p className="text-sm font-medium text-slate-500 text-center max-w-sm">
                  Enter a class code from your teacher in the sidebar to join your first classroom.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classes.map(({ subject }: any, i: number) => {
                  const c = palette(i);
                  return (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ y: -4 }}
                      onClick={() => router.push(`/dashboard/chat/${subject.id}`)}
                      className="cursor-pointer bg-white rounded-3xl p-6 border-2 transition-all duration-200 group shadow-sm hover:shadow-md"
                      style={{ borderColor: c.border }}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-sm" style={{ background: c.bg, color: c.text }}>
                          {subject.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="label-caps px-3 py-1.5 rounded-full" style={{ background: c.bg, color: c.text }}>
                          Active
                        </span>
                      </div>

                      {/* Name */}
                      <h4 className="text-xl font-black mb-1 text-slate-900 group-hover:text-opacity-80 transition-colors">
                        {subject.name}
                      </h4>
                      {subject.description && (
                        <p className="text-sm mb-4 font-medium line-clamp-2 text-slate-500">{subject.description}</p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-500 mb-6">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md">
                          <Users size={14} /> {subject.teacher?.name || 'Teacher'}
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md">
                          <BookOpen size={14} /> {subject._count?.files || 0} docs
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="label-caps" style={{ color: c.text }}>Enter Classroom</span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform" style={{ background: c.bg, color: c.text }}>
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right: Sidebar */}
          <aside className="space-y-6">
            {/* Join Card */}
            <div className="rounded-3xl p-8 bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <Plus size={20} strokeWidth={3} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Join a Class</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label-caps block mb-2 px-1">Enter Code</label>
                    <input
                      type="text"
                      placeholder="e.g. A1B2C3"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                      maxLength={8}
                      className="w-full px-4 py-3.5 rounded-xl text-sm font-bold outline-none uppercase tracking-widest transition-all bg-slate-50 border-2 border-slate-100 text-slate-900 placeholder-slate-400"
                      onFocus={e => (e.target.style.borderColor = 'var(--primary)', e.target.style.background = 'white')}
                      onBlur={e  => (e.target.style.borderColor = '#f1f5f9', e.target.style.background = '#f8fafc')}
                    />
                  </div>

                  <AnimatePresence>
                    {message && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-bold mt-2" style={
                          message.type === 'success'
                            ? { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }
                            : { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }
                        }>
                          {message.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
                          {message.text}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleJoin}
                    disabled={joining || !joinCode.trim()}
                    className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mt-2"
                    style={{ background: 'var(--primary)', color: 'white', opacity: (joining || !joinCode.trim()) ? 0.6 : 1 }}
                    onMouseOver={e => !joining && joinCode.trim() && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-dark)')}
                    onMouseOut={e  => !joining && ((e.currentTarget as HTMLButtonElement).style.background = 'var(--primary)')}
                  >
                    {joining ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>Join Now <ArrowRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>


          </aside>
        </div>
      </main>
    </div>
  );
}
