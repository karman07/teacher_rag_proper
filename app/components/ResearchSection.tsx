'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, Cpu, Award, ExternalLink, GraduationCap, Microscope } from 'lucide-react';
import Container from './common/Container';
import SectionHeader from './common/SectionHeader';
import { COLORS } from '../constants/colors';

export default function ResearchSection() {
  return (
    <section id="research" className="py-24 bg-slate-50/50 dark:bg-[#080f1e]/50 border-y border-slate-100 dark:border-slate-800">
      <Container>
        <SectionHeader 
          badge="Built on Academic Excellence"
          title={<>Sponsored by <span style={{ color: '#76B900' }}>NVIDIA</span> — Shaping Future Pedagogy</>}
          subtitle="Our core engine is built on cutting-edge research, ensuring the highest standards of accuracy and reliability for your classroom."
        />

        <div className="grid lg:grid-cols-[1fr_400px] gap-12 mt-16 items-start">
          {/* Research Context */}
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 transition-transform group-hover:rotate-6">
                  <Microscope size={28} />
                </div>
                <h3 className="text-xl font-black mb-3 text-slate-900 dark:text-white">Zero Hallucinations</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                  We guarantee that students only receive answers based on the materials you upload. Every response includes precise citations back to your original documents.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#76B900]/10 flex items-center justify-center text-[#76B900] mb-6">
                   <Cpu size={28} />
                </div>
                <h3 className="text-xl font-black mb-3 text-slate-900 dark:text-white">NVIDIA Partnership</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                  Powered by NVIDIA's latest AI infrastructure, ensuring lightning-fast responses and the capability to process complex materials like recorded lectures and massive textbooks.
                </p>
              </motion.div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="text-blue-400" size={24} />
                  <p className="label-caps !text-blue-400">Security & Reliability</p>
                </div>
                <h3 className="text-2xl font-black mb-6">Built for Educational Institutions</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-blue-400 font-bold mb-2">1. Absolute Data Isolation</h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      Your materials are securely isolated per classroom. We never use your course content to train external public models.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-bold mb-2">2. Strict Material Adherence</h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      The AI is constrained to act solely as a teaching assistant based on your provided context, completely eliminating the risk of unverified external information.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-bold mb-2">3. Transparent Verification</h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      Every generated statement links back to a specific page or slide in your materials, making it easy for you and your students to verify the information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-32">
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="p-8 rounded-[3rem] bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/30 shadow-2xl shadow-blue-500/10"
            >
              <div className="flex items-center gap-5 mb-8">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 border-2 border-white dark:border-slate-800 shrink-0">
                  <img 
                    src="https://parteekbhatia.com/assets/image-BndRrwmw.png" 
                    alt="Dr. Parteek Kumar Bhatia" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="label-caps !text-blue-600 mb-1">Principal Advisor</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Dr. Parteek Kumar Bhatia</h3>
                </div>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                <p>
                  Special thanks to <strong>Dr. Parteek Kumar Bhatia</strong>, Associate Professor in the School of Electrical Engineering and Computer Science at <strong>Washington State University (WSU)</strong>, Pullman, WA.
                </p>
                <p>
                  Prior to joining WSU, he served as a Professor and Associate Dean at the <strong>Thapar Institute of Engineering and Technology</strong>. He has held visiting positions at <strong>Whitman College</strong> and <strong>Tel Aviv University</strong>.
                </p>
                <p className="text-xs bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 italic">
                  "He is a recipient of the prestigious Young Faculty Research Fellowship from the Ministry of Electronics & IT, Government of India."
                </p>
                <div className="pt-6 flex flex-wrap items-center justify-between gap-4">
                   <Link 
                     href="https://parteekbhatia.com/" 
                     target="_blank"
                     className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs hover:underline"
                   >
                     Read More <ExternalLink size={14} />
                   </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
