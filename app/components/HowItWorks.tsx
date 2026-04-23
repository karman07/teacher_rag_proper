'use client';

import { motion } from 'framer-motion';
import { Card, CardBody, Chip } from '@heroui/react';
import { Upload, Brain, MessageSquare, TrendingUp, ArrowRight } from 'lucide-react';
import SectionHeader from './common/SectionHeader';
import Container from './common/Container';
import { COLORS } from '../constants/colors';

const STEPS = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload Your Materials',
    description: 'Simply drag and drop your lecture notes, slides, and syllabus, or connect directly to Google Drive.',
    tags: ['PDFs & Docs', 'Slides', 'Google Drive', 'Auto-Sync'],
  },
  {
    step: '02',
    icon: Brain,
    title: 'AI Learns Your Curriculum',
    description: 'Our system instantly processes your materials to build a deep, contextual understanding of your course.',
    tags: ['Instant Setup', 'Zero Maintenance', 'Secure Data'],
  },
  {
    step: '03',
    icon: MessageSquare,
    title: 'Students Ask Questions',
    description: 'Students get 24/7 support with accurate answers based strictly on the materials you provided.',
    tags: ['24/7 Support', 'Cited Sources', 'No Hallucinations'],
  },
  {
    step: '04',
    icon: TrendingUp,
    title: 'You Get Insights',
    description: 'Monitor what topics students are struggling with and adjust your teaching strategy accordingly.',
    tags: ['Knowledge Gaps', 'Engagement Stats', 'Weekly Reports'],
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-white dark:bg-[#03070f]">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeader
            badge="How It Works"
            title={<>Four Steps to a <span style={{ color: COLORS.primary[600] }}>Smarter Classroom</span></>}
            subtitle="Setup takes less than 5 minutes. No technical expertise required."
          />
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8 lg:gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                {/* Icon block */}
                <div className="relative mb-8">
                  <div 
                    className="w-28 h-28 rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-all duration-300 mx-auto"
                    style={{ backgroundColor: COLORS.primary[600] }}
                  >
                    <Icon size={44} className="text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-9 h-9 bg-white dark:bg-[#03070f] border-2 rounded-xl flex items-center justify-center shadow-sm" style={{ borderColor: COLORS.primary[600] }}>
                    <span className="text-xs font-bold" style={{ color: COLORS.primary[600] }}>{step.step}</span>
                  </div>
                </div>

                {/* Arrow (mobile only) */}
                {i < STEPS.length - 1 && (
                  <div className="lg:hidden mb-8 text-slate-300 dark:text-slate-700">
                    <ArrowRight size={24} className="rotate-90" />
                  </div>
                )}

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 text-[15px]">{step.description}</p>

                {/* Tag chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {step.tags.map((tag) => (
                    <Chip
                      key={tag}
                      size="sm"
                      variant="bordered"
                      classNames={{
                        base: 'bg-transparent border-slate-200/60 dark:border-slate-800/60 hover:border-primary/50 transition-colors cursor-default',
                        content: 'text-slate-600 dark:text-slate-400 font-semibold px-2',
                      }}
                      startContent={<div className="w-1 h-1 rounded-full bg-primary/40 ml-1" />}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
