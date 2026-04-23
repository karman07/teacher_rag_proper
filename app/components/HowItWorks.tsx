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
    title: 'Curricular Data Ingestion',
    description: 'Our system ingests raw pedagogical assets—lecture notes, textbooks, research papers, and slide decks—converting them into structured data formats suitable for high-dimensional analysis.',
    tags: ['PDF Parsing', 'OCR Processing', 'Multi-modal Ingestion', 'Semantic Cleanup'],
  },
  {
    step: '02',
    icon: Cpu,
    title: 'Cognitive Vector Indexing',
    description: 'Utilizing state-of-the-art embedding models, we map your curriculum into a dense vector space. This allows for semantic retrieval that understands context beyond simple keyword matching.',
    tags: ['Vector Embeddings', 'Knowledge Graphing', 'RAG Optimization', 'Latency Reduction'],
  },
  {
    step: '03',
    icon: TrendingUp,
    title: 'Research-Driven Inference',
    description: 'The final layer delivers deterministic answers with architectural grounding. Every response is cross-referenced against the internal knowledge base, ensuring zero-hallucination accuracy.',
    tags: ['Deterministic Q&A', 'Citation Mapping', 'Pedagogical Alignment', 'Interaction Logs'],
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
            badge="Architecture"
            title={<>The Science of <span style={{ color: COLORS.primary[600] }}>Deterministic AI</span></>}
            subtitle="We are pioneering a multi-modal RAG framework designed specifically for the rigors of academic instruction and student support."
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
