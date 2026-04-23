'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@heroui/react';
import SectionBadge from './common/SectionBadge';
import Container from './common/Container';

export default function CTASection() {
  return (
    <section className="py-28 bg-slate-50 dark:bg-[#080f1e]">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl bg-blue-700 dark:bg-blue-900 px-8 py-20 text-center shadow-2xl shadow-blue-900/40"
        >
          {/* Background mesh */}
          <div className="absolute inset-0 grid-bg opacity-10" />
          <div className="absolute top-0 left-0 w-[400px] h-[300px] bg-white/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-400/10 blur-3xl rounded-full translate-x-1/3 translate-y-1/3" />

          <div className="relative">
            <div className="flex justify-center mb-6">
              <SectionBadge live className="border-white/30 bg-white/10">
                <span className="text-white">Ready to Start?</span>
              </SectionBadge>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight max-w-2xl mx-auto">
              Transform Your Classroom
              <br />
              Today
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Join leading educators and institutions using AI to save time, engage students, and deliver better outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                href="/signup"
                size="lg"
                variant="solid"
                endContent={<ArrowRight size={18} />}
                className="bg-white text-blue-700 font-bold px-10 h-14 rounded-2xl shadow-xl hover:bg-blue-50 transition-colors"
              >
                Start for Free
              </Button>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
