'use client';

import { motion } from 'framer-motion';
import { Chip } from '@heroui/react';
import { UploadCloud, MessageCircle, FileSearch, ArrowRight } from 'lucide-react';
import SectionHeader from '../common/SectionHeader';
import Container from '../common/Container';
import { COLORS } from '../../constants/colors';

const STEPS = [
  {
    step: '01',
    icon: UploadCloud,
    title: 'Upload your notes or PDFs',
    description: 'Add any class material, lecture slides, or textbooks you want to learn from.',
    tags: ['PDFs', 'Word Docs', 'Lecture Slides'],
  },
  {
    step: '02',
    icon: MessageCircle,
    title: 'Ask any question',
    description: 'Type your question naturally like you would to a 24/7 personal tutor.',
    tags: ['Summaries', 'Explanations', 'Key Concepts'],
  },
  {
    step: '03',
    icon: FileSearch,
    title: 'Get answers with sources',
    description: 'See the answer instantly, highlighted with exactly where it came from.',
    tags: ['Instant Answers', 'Verified Sources', 'No Hallucinations'],
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-[#fafcff] dark:bg-[#080f1e] relative z-10">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeader
            badge="How It Works"
            title={<>Three steps to <span style={{ color: COLORS.primary[600] }}>better grades.</span></>}
            subtitle="Setup takes less than 2 minutes. Get started immediately."
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6 relative max-w-5xl mx-auto">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="flex flex-col items-center text-center relative z-10"
              >
                {/* Icon block */}
                <div className="relative mb-8">
                  <div 
                    className="w-24 h-24 rounded-[2rem] shadow-xl flex items-center justify-center hover:scale-105 transition-all duration-300 mx-auto"
                    style={{ backgroundColor: COLORS.primary[600] }}
                  >
                    <Icon size={36} className="text-white" />
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
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 text-[15px] max-w-xs">{step.description}</p>

                {/* Tag chips */}
                <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                  {step.tags.map((tag) => (
                    <Chip
                      key={tag}
                      size="sm"
                      variant="bordered"
                      classNames={{
                        base: 'bg-transparent border-slate-200/60 dark:border-slate-800/60 hover:border-primary/50 transition-colors cursor-default',
                        content: 'text-slate-600 dark:text-slate-400 font-semibold px-2',
                      }}
                      startContent={<div className="w-1 h-1 rounded-full bg-blue-500/40 ml-1" />}
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
