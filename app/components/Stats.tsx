'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Container from './common/Container';

type Stat = {
  max: number;
  format: (n: number) => string;
  label: string;
  sublabel: string;
};

const STATS: Stat[] = [
  {
    max: 2400,
    format: (n) => n.toLocaleString() + '+',
    label: 'Educators',
    sublabel: 'Worldwide using TeachAI',
  },
  {
    max: 98,
    format: (n) => n + '%',
    label: 'Accuracy Rate',
    sublabel: 'On RAG-powered responses',
  },
  {
    max: 1200000,
    format: (n) => {
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M+';
      return Math.round(n / 1000) + 'K+';
    },
    label: 'Documents',
    sublabel: 'Processed and indexed',
  },
  {
    max: 450,
    format: (n) => n + 'K+',
    label: 'Q&A Answered',
    sublabel: 'Student questions daily',
  },
];

function useCountUp(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false; // guard against React 19 strict-mode double-invoke
    const start = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, active]);

  return count;
}

function StatCard({ stat, active }: { stat: Stat; active: boolean }) {
  const count = useCountUp(stat.max, 2200, active);
  return (
    <div className="text-center px-4">
      <div className="text-5xl lg:text-6xl font-bold text-white mb-2 tabular-nums">
        {stat.format(count)}
      </div>
      <p className="text-base font-semibold text-blue-100 mb-1">{stat.label}</p>
      <p className="text-sm text-blue-200/70">{stat.sublabel}</p>
    </div>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 relative overflow-hidden bg-[#1e40af] dark:bg-[#1e3a8a]">
      <div className="absolute inset-0 grid-bg opacity-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-blue-400/20 blur-3xl rounded-full" />
      <Container className="relative">
        <div ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Powering a New Era of Teaching
            </h2>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">
              Numbers that show the real impact of AI-assisted education.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <StatCard stat={stat} active={active} />
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
