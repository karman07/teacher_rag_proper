'use client';

import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Cpu, 
  ExternalLink, 
  GraduationCap, 
  Microscope,
  Database,
  Network,
  Binary,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';


function StepCard({ number, title, description, icon: Icon }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative p-8 rounded-3xl border border-slate-100 bg-white group shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500"
    >
      <div className="absolute -top-4 -left-4 w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30">
        {number}
      </div>
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500 font-medium opacity-80">
        {description}
      </p>
    </motion.div>
  );
}

export default function StudentResearch() {
  return (
    <section className="py-32 relative overflow-hidden bg-white">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-blue-50/30 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Technical Methodology Header */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Microscope size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Technical Foundation</span>
          </motion.div>
          
          <h2 className="text-4xl lg:text-7xl font-black text-slate-900 leading-[1.05] mb-8 tracking-tighter">
            Methodology of 
            <br />
            <span className="text-blue-600">Cognitive Retrieval.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <StepCard
            number="01"
            icon={Database}
            title="Knowledge Injection"
            description="The platform ingests multi-modal course materials—PDFs, slides, and transcripts—converting them into high-dimensional vector embeddings stored in a secure research database."
          />
          <StepCard
            number="02"
            icon={Network}
            title="Semantic Retrieval"
            description="When you ask a question, our retrieval engine identifies the exact context across thousands of data points, ensuring that the AI has the specific grounding required for your course."
          />
          <StepCard
            number="03"
            icon={ShieldCheck}
            title="Deterministic Citation"
            description="Results are cross-referenced with your sources in real-time. Every response includes pixel-precise citations, allowing you to verify exactly where the information originated."
          />
        </div>

        {/* Advisor Card */}
        <div className="mt-36">
          <div className="grid lg:grid-cols-[1fr_400px] gap-20 items-center">
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <GraduationCap size={20} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Institutional Collaboration</span>
              </div>
              
              <h3 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">
                Academic Integrity & 
                <br />
                <span className="text-blue-600">Research Excellence.</span>
              </h3>
              
              <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl opacity-90">
                This project is a high-precision RAG collaboration designed to study the impact of verified AI context on learning outcomes. 
                Our system prioritizes citation grounding, ensuring that every insight is traceable back to authorized course materials.
              </p>

              <div className="flex flex-wrap gap-12 pt-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Primary Advisor</p>
                  <p className="text-xl font-black text-slate-900">Dr. Parteek Kumar Bhatia</p>
                  <p className="text-sm font-bold text-slate-400">Associate Professor, WSU</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Collaboration Partners</p>
                  <p className="text-xl font-black text-slate-900 italic">NVIDIA research</p>
                  <p className="text-sm font-bold text-slate-400">DeepMind Compute Optimization</p>
                </div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-2 rounded-[3.5rem] bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border border-slate-100 group shadow-2xl shadow-blue-500/5"
            >
               <div className="bg-white rounded-[3rem] p-10 overflow-hidden relative border border-white">
                 <div className="flex items-center gap-6 mb-12">
                   <div className="w-24 h-24 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white flex-shrink-0">
                     <img 
                       src="https://parteekbhatia.com/assets/image-BndRrwmw.png" 
                       alt="Dr. Parteek Bhatia" 
                       className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700 ease-out"
                     />
                   </div>
                   <div>
                     <p className="label-caps !text-blue-600 mb-1.5 font-black">Principal Advisor</p>
                     <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">Dr. Parteek Kumar Bhatia</h3>
                   </div>
                 </div>

                 <div className="space-y-6 text-sm leading-relaxed text-slate-500 font-medium">
                   <p>
                     Special thanks to <strong>Dr. Parteek Kumar Bhatia</strong>, Associate Professor in the School of Electrical Engineering and Computer Science at <strong>Washington State University (WSU)</strong>.
                   </p>
                   <div className="pt-8 flex flex-wrap items-center justify-end gap-6 border-t border-slate-50">
                     <Link 
                       href="https://parteekbhatia.com/" 
                       target="_blank"
                       className="flex items-center gap-2 text-blue-600 font-black text-xs hover:text-blue-700 transition-colors group/link"
                     >
                       Scientific Bio <ExternalLink size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                     </Link>
                   </div>
                 </div>
               </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
