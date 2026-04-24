'use client';

import { motion } from 'framer-motion';
import { Card, CardBody } from '@heroui/react';
import {
  Brain, BookOpen, ShieldCheck, Bot
} from 'lucide-react';
import Link from 'next/link';
import SectionHeader from '../common/SectionHeader';
import Container from '../common/Container';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-white relative z-10 border-t border-slate-100">
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
                Everything you need to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">succeed.</span>
              </>
            }
            subtitle="Built from the ground up to help students learn faster and retain more."
          />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {/* Feature 1 - Large */}
          <motion.div variants={cardVariants} className="lg:col-span-2">
            <Card
              isPressable={false}
              shadow="none"
              classNames={{
                base: 'group border border-slate-200 hover:border-blue-300/50 transition-all duration-500 bg-gradient-to-br from-slate-50 to-blue-50/30 h-full overflow-hidden',
                body: 'p-8 sm:p-12 relative',
              }}
            >
              <CardBody className="relative p-0 overflow-visible">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-8 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
                    <Brain size={28} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-blue-600 transition-colors">Ask Any Question.<br/>Get Instant Answers.</h3>
                  <p className="text-base text-slate-600 font-medium leading-relaxed">
                    Like having a tutor available 24/7—based exclusively on your own material. Don't rely on generic internet searches that might be wrong for your specific class.
                  </p>
                </div>
                
                {/* Visual Mockup */}
                <div className="mt-10 sm:absolute sm:right-[-20px] sm:top-1/2 sm:-translate-y-1/2 w-[300px] sm:w-[400px] bg-white rounded-2xl border border-slate-200 shadow-xl p-4 rotate-[-2deg] group-hover:rotate-0 transition-all duration-500 z-10">
                  <div className="flex gap-3 items-start mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
                    <div className="h-10 bg-slate-100 rounded-xl w-[80%]" />
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 shrink-0 flex items-center justify-center text-blue-600"><Bot size={16}/></div>
                    <div className="space-y-2 w-full">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                      <div className="h-4 bg-slate-100 rounded w-[90%]" />
                      <div className="h-4 bg-slate-100 rounded w-[60%]" />
                      <div className="w-24 h-6 bg-blue-50 border border-blue-100 rounded-md mt-2" />
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={cardVariants}>
            <Card
              isPressable={false}
              shadow="none"
              classNames={{
                base: 'group border border-slate-200 hover:border-indigo-300/50 transition-all duration-500 bg-gradient-to-br from-indigo-50 to-white h-full',
                body: 'p-8 sm:p-12 flex flex-col justify-between relative',
              }}
            >
              <CardBody className="p-0 overflow-visible relative">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-8 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-500">
                    <BookOpen size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-indigo-600 transition-colors">Everything in One Place</h3>
                  <p className="text-base text-slate-600 font-medium leading-relaxed">
                    No more searching through disorganized folders, scattered PDFs, and messy notes. Keep your entire semester organized in one intelligent dashboard.
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={cardVariants}>
            <Card
              isPressable={false}
              shadow="none"
              classNames={{
                base: 'group border border-slate-200 hover:border-emerald-300/50 transition-all duration-500 bg-gradient-to-br from-emerald-50 to-white h-full',
                body: 'p-8 sm:p-12 flex flex-col justify-between relative',
              }}
            >
              <CardBody className="p-0 overflow-visible relative">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck size={28} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-emerald-500 transition-colors">Your Data Stays Yours</h3>
                  <p className="text-base text-slate-600 font-medium leading-relaxed">
                    Only your classroom content is used to generate answers—nothing else. Your study materials remain completely private and secure.
                  </p>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* CTA block in grid */}
          <motion.div variants={cardVariants} className="lg:col-span-2">
            <Card
              isPressable={false}
              shadow="none"
              classNames={{
                base: 'group transition-all duration-500 bg-slate-900 text-white h-full overflow-hidden',
                body: 'p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 relative',
              }}
            >
              <CardBody className="p-0 overflow-visible relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[200%] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10 text-center sm:text-left flex-1">
                  <h3 className="text-3xl font-black mb-2 text-white">Ready to ace your next exam?</h3>
                  <p className="text-slate-400 font-medium">Join thousands of students studying smarter.</p>
                </div>
                <Link href="/signup" className="relative z-10 w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-slate-900 bg-white hover:bg-slate-50 transition-all shadow-xl active:scale-95 whitespace-nowrap">
                    Start Studying Smarter
                  </button>
                </Link>
              </CardBody>
            </Card>
          </motion.div>

        </motion.div>
      </Container>
    </section>
  );
}
