'use client';

import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Bot, Sparkles, BookOpen, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  { icon: <BookOpen size={20} />, title: 'Course Materials', desc: 'Access all your teacher\'s documents in one beautifully organized place.' },
  { icon: <Bot size={20} />, title: 'AI Study Assistant', desc: 'Ask questions and get instant answers powered by RAG technology.' },
  { icon: <ShieldCheck size={20} />, title: 'Private & Secure', desc: 'Your data stays private. AI only uses your classroom content.' },
];

export default function Home() {
  return (
    <div className="page-bg min-h-screen overflow-hidden" style={{ color: 'var(--foreground)', background: 'var(--background)' }}>

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <GraduationCap size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
            TeachAI <span style={{ color: 'var(--primary)' }}>Student</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <button className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ color: 'black', border: '2px solid var(--primary-light)', background: 'transparent' }}
              onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-light)'}
              onMouseOut={e  => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
            >
              Sign In
            </button>
          </Link>
          <Link href="/signup">
            <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md" style={{ background: 'var(--primary)' }}
              onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-dark)'}
              onMouseOut={e  => (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary)'}
            >
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22,1,0.36,1] }} className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Sparkles size={14} /> The Future of Learning is Here
            </div>

            <h1 className="text-5xl md:text-6xl font-black leading-[1.15] tracking-tight">
              Learn Smarter with{' '}
              <span style={{ color: 'var(--primary)' }}>AI Guidance.</span>
            </h1>

            <p className="text-lg leading-relaxed font-medium" style={{ color: 'var(--muted)' }}>
              Access your classroom materials, view documents instantly, and ask our AI assistant anything — all in one beautiful, distraction-free environment.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 pt-2">
              <Link href="/signup">
                <button className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-white transition-all shadow-lg" style={{ background: 'var(--primary)' }}
                  onMouseOver={e => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'}
                  onMouseOut={e  => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'}
                >
                  Start Learning <ArrowRight size={18} />
                </button>
              </Link>

              <div className="flex items-center justify-center gap-8 px-4">
                {[['10k+', 'Students'], ['24/7', 'AI Support']].map(([val, lbl]) => (
                  <div key={lbl} className="text-center sm:text-left">
                    <p className="text-2xl font-black" style={{ color: 'var(--primary)' }}>{val}</p>
                    <p className="label-caps mt-1">{lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: AI chat mock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22,1,0.36,1] }}
            className="relative flex items-center justify-center"
          >
            {/* Main card */}
            <div className="relative z-10 w-full max-w-md surface-card p-6 shadow-xl border border-slate-200 bg-white">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <Bot size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold">Study Assistant</p>
                  <p className="label-caps text-emerald-500 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Online
                  </p>
                </div>
              </div>

              {/* Mock messages */}
              <div className="space-y-4 mb-6">
                <div className="px-4 py-3 rounded-2xl bubble-bot text-sm font-medium shadow-sm">
                  How does photosynthesis work?
                </div>
                <div className="px-4 py-3 rounded-2xl bubble-user text-sm font-medium ml-8 shadow-sm">
                  Photosynthesis converts sunlight, water, and CO₂ into glucose and oxygen using chlorophyll. It occurs in two stages: the light-dependent reactions and the Calvin cycle…
                </div>
                <div className="flex gap-2 mt-2 ml-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold shadow-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    📄 Biology 101.pdf
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--card-border)' }}>
                <span className="flex-1 text-sm font-medium" style={{ color: 'var(--muted)' }}>Ask anything…</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'var(--primary)' }}>
                  <Zap size={16} color="white" />
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute top-8 -right-4 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg bg-white border border-slate-100"
            >
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>RAG Optimized</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Features row */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.5 }}
           className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-28"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="surface-card p-8 flex flex-col gap-5 border border-slate-200 bg-white shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2 text-slate-800">{f.title}</h3>
                <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--muted)' }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
