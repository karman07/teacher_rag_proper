'use client';

import { motion } from 'framer-motion';
import { Card, CardBody } from '@heroui/react';
import {
  Database, Brain, BarChart3, MessageSquare,
  Zap, ShieldCheck, Globe, RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import SectionHeader from './common/SectionHeader';
import Container from './common/Container';

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
};

const FEATURES: Feature[] = [
  {
    icon: Database,
    title: 'Multi-Source Ingestion',
    description:
      'Connect Google Drive, AWS S3, Dropbox, Notion, OneDrive, and more. Supports PDFs, videos, slides, and any document format.',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: Brain,
    title: 'Intelligent RAG Pipeline',
    description:
      'Production-grade retrieval-augmented generation built on your course materials. Accurate, cited, and grounded in your content.',
    iconBg: 'bg-violet-50 dark:bg-violet-900/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: BarChart3,
    title: 'Critical Analytics',
    description:
      'Track engagement, pinpoint knowledge gaps, measure comprehension trends, and get weekly AI-generated teaching recommendations.',
    iconBg: 'bg-cyan-50 dark:bg-cyan-900/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    icon: MessageSquare,
    title: 'Smart Student Q&A',
    description:
      'Students ask questions 24/7. AI answers directly from your curated knowledge base — with source citations for transparency.',
    iconBg: 'bg-violet-50 dark:bg-violet-900/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: Zap,
    title: 'Real-Time Processing',
    description:
      'Documents are ingested, chunked, and vectorized in minutes. Your knowledge base stays fresh with automatic re-sync.',
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    description:
      'End-to-end encryption, FERPA and GDPR compliance, role-based access control, and SOC 2 Type II certification.',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Globe,
    title: 'Multi-Language Support',
    description:
      "Support students across 40+ languages. TeachAI auto-detects and responds in the student's native language.",
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: RefreshCw,
    title: 'Auto-Sync & Updates',
    description:
      'Changes in your Drive or S3 are automatically reflected — no manual uploads required.',
    iconBg: 'bg-violet-50 dark:bg-violet-900/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="py-28 bg-slate-50 dark:bg-[#080f1e]">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeader
            badge="Everything You Need"
            title={
              <>
                Built for Modern{' '}
                <span className="gradient-text">Educators &amp; Institutions</span>
              </>
            }
            subtitle="From data ingestion to actionable insights — TeachAI handles the entire intelligence pipeline so you can focus on what matters most: teaching."
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={cardVariants}>
                <Card
                  isPressable={false}
                  shadow="none"
                  classNames={{
                    base: 'group border border-slate-200 dark:border-slate-700/40 hover:border-blue-300/50 dark:hover:border-blue-600/30 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-none transition-all duration-300 bg-white dark:bg-slate-800/50 h-full',
                    body: 'p-6',
                  }}
                >
                  <CardBody className="p-6">
                    <div
                      className={`w-11 h-11 ${feature.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon size={20} className={feature.iconColor} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
