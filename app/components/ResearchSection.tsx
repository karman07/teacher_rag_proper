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
          badge="Built on Academic Research"
          title={<>Supported by the <span style={{ color: '#76B900' }}>NVIDIA</span> Academic Grant Program</>}
          subtitle="VTA — Virtual Teaching Assistant — was developed as an outcome of the NVIDIA-supported project, A Multimodal Mixture-of-Experts Framework for NVIDIA DLI & University Classrooms. The project received 32,000 NVIDIA A100 GPU-hours to support the research and development of AI-powered learning experiences for university classrooms and professional training."
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
                <h3 className="text-xl font-black mb-3 text-slate-900 dark:text-white">Grounded, Course-Specific Answers</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                  VTA is designed to generate answers grounded in instructor-provided course materials. Responses include citations to the relevant source documents, allowing students and instructors to review and verify the information.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#76B900]/10 flex items-center justify-center text-[#76B900] mb-6">
                   <Cpu size={28} />
                </div>
                <h3 className="text-xl font-black mb-3 text-slate-900 dark:text-white">NVIDIA-Accelerated Development</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                  NVIDIA A100 GPU resources supported the development and evaluation of VTA's AI capabilities, including the processing of educational resources such as lecture materials, presentations, documents, and other course content.
                </p>
              </motion.div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="text-blue-400" size={24} />
                  <p className="label-caps !text-blue-400">Security, Reliability, and Transparency</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-blue-400 font-bold mb-2">1. Classroom Data Isolation</h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      Course materials are isolated by classroom to prevent content from being shared across courses.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-bold mb-2">2. Course-Material Grounding</h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      VTA is designed to prioritize instructor-provided materials when answering questions, reducing unsupported responses and keeping assistance aligned with the course context.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-bold mb-2">3. Verifiable Responses</h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      Answers include references to the supporting course materials whenever available, helping students and instructors verify information and return to the original learning resources.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-8 pt-6 border-t border-slate-700/50">
                  Research supported by the NVIDIA Academic Grant Program using NVIDIA A100 GPUs.
                </p>
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
                  <p className="label-caps !text-blue-600 mb-1">Project Lead</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Dr. Parteek Kumar Bhatia</h3>
                </div>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                <p>
                  <strong>Dr. Parteek Kumar Bhatia</strong> is an Associate Professor in the School of Electrical Engineering and Computer Science at Washington State University, Pullman. He is the principal investigator of the NVIDIA-supported project <em>A Multimodal Mixture-of-Experts Framework for NVIDIA DLI &amp; University Classrooms</em>, which led to the development of VTA—Virtual Teaching Assistant.
                </p>
                <p>
                  A Gold-Tier NVIDIA DLI Ambassador and recipient of the MeitY Young Faculty Research Fellowship, Dr. Bhatia has secured more than $246,000 in competitive research funding and published over 100 research papers.
                </p>
                <p className="text-xs bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 italic">
                  He is the author of bestselling textbooks, including Machine Learning with Python and Data Mining and Data Warehousing, both published by Cambridge University Press. His online courses have reached more than 45,000 learners worldwide.
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
