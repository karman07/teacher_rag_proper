'use client';

import { motion } from 'framer-motion';
import { Card, CardBody, Chip } from '@heroui/react';
import { Upload, Cpu, TrendingUp, ArrowRight } from 'lucide-react';
import SectionHeader from './common/SectionHeader';
import Container from './common/Container';
import { COLORS } from '../constants/colors';

const STEPS = [
  {
    step: '01',
    icon: Upload,
    title: 'Connect Your Data Sources',
    description: 'Link Google Drive, AWS S3, Notion, OneDrive, or upload files directly. TeachAI accepts every format — PDFs, slides, recordings, and more.',
    tags: ['Google Drive', 'AWS S3', 'Notion', 'Dropbox', '+12 more'],
  },
  {
    step: '02',
    icon: Cpu,
    title: 'AI Builds Your Knowledge Base',
    description: 'Our pipeline automatically chunks, embeds, and indexes your content into a high-performance vector store optimized for educational context.',
    tags: ['Auto-chunking', 'Vector indexing', 'Citation mapping', 'Smart context'],
  },
  {
    step: '03',
    icon: TrendingUp,
    title: 'Teach Smarter with Insights',
    description: 'Students get instant, cited answers from your exact materials. You get deep analytics on engagement, gaps, and learning outcomes.',
    tags: ['Real-time Q&A', 'Gap detection', 'Weekly reports', 'AI suggestions'],
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
            badge="Simple Setup"
            title={<>Up and Running in <span style={{ color: COLORS.primary[600] }}>Under 10 Minutes</span></>}
            subtitle="No engineering team required. Connect your sources, let AI do the work, and start delivering smarter student experiences immediately."
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
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
