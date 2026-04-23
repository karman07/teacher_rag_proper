'use client';

import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  ArrowRight, 
  Bot, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  Zap,
  Binary,
  FileText,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import StudentResearch from './components/StudentResearch';

const FEATURES = [
  { icon: <BookOpen size={20} />, title: 'Course Materials', desc: 'Access all your teacher\'s documents in one beautifully organized place.' },
  { icon: <Bot size={20} />, title: 'AI Study Assistant', desc: 'Ask questions and get instant answers powered by RAG technology.' },
  { icon: <ShieldCheck size={20} />, title: 'Private & Secure', desc: 'Your data stays private. AI only uses your classroom content.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-xl shadow-blue-500/20">
            <GraduationCap size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black leading-none tracking-tight">
              Multimodal <span className="text-blue-600">Student</span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">Research Project</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <button className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-slate-50 border border-slate-200">
              Sign In
            </button>
          </Link>
          <Link href="/signup">
            <button className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl bg-blue-600 hover:bg-blue-700 shadow-blue-500/20">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative pt-12">
        {/* Background Grid */}
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        
        <Container className="relative z-10 pb-32">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-20 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8 }} 
              className="space-y-10"
            >

              <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight text-slate-900">
                Grounded Knowledge 
                <br />
                <span className="text-blue-600">Verified Citation.</span>
              </h1>

              <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-xl">
                A high-precision study environment exploring the application of Multimodal RAG 
                to classroom materials. Engage with verified content with absolute confidence.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 pt-4">
                <Link href="/signup">
                  <button className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.1em] text-white transition-all shadow-2xl bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 hover:-translate-y-0.5">
                    Access Research Platform <ArrowRight size={18} />
                  </button>
                </Link>

                <div className="flex items-center gap-8 py-2">
                  <div>
                    <p className="text-lg font-black text-slate-900">Qualitative</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Research Goal</p>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div>
                    <p className="text-lg font-black text-slate-900">Deterministic</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Inference Model</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Technical Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative group">
                <div className="absolute -inset-10 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5 rounded-[4rem] blur-3xl opacity-50"></div>
                
                <div className="relative rounded-[3.5rem] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden bg-white/90 backdrop-blur-3xl aspect-[1/0.95] flex flex-col group-hover:shadow-[0_48px_80px_-20px_rgba(0,0,0,0.12)] transition-all duration-700">
                  
                  {/* Top Bar */}
                  <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/50">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-8 px-4 rounded-full bg-blue-50 border border-blue-100/50 flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Unified Intelligence</span>
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                    {/* Main Interface Content */}
                    <div className="flex-1 p-10 flex flex-col gap-8">
                      
                      {/* Animated Message Stack */}
                      <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.8 }
                          }
                        }}
                        className="space-y-8"
                      >
                        {/* User Question */}
                        <motion.div 
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 }
                          }}
                          className="flex justify-end"
                        >
                          <div className="bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl rounded-tr-none px-6 py-4 shadow-sm max-w-[85%]">
                            <p className="text-[13px] font-bold leading-relaxed">
                              Can you explain the empirical results from page 142?
                            </p>
                          </div>
                        </motion.div>

                        {/* Thinking State */}
                        <motion.div 
                          variants={{
                            hidden: { opacity: 0 },
                            visible: { 
                              opacity: 1,
                              transition: { duration: 0.4 }
                            }
                          }}
                          className="flex gap-3"
                        >
                          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                             <div className="flex gap-1">
                               <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" />
                               <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                               <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                             </div>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2.5">Retrieving grounding context...</p>
                        </motion.div>

                        {/* AI Response */}
                        <motion.div 
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { opacity: 1, y: 0 }
                          }}
                          transition={{ duration: 0.6 }}
                          className="flex gap-4 items-start"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 shrink-0">
                            <Sparkles size={18} />
                          </div>
                          <div className="flex-1 space-y-5">
                            <div className="space-y-2">
                               <p className="text-[13px] font-bold text-slate-900 leading-relaxed px-1">
                                 According to the research findings on page 142, the model demonstrated a 94.2% increase in deterministic inference accuracy when paired with multi-modal vector grounding.
                               </p>
                            </div>
                            
                            {/* Citation Chip */}
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 2.2 }}
                              className="inline-flex items-center gap-3 bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm hover:border-blue-200 transition-colors cursor-pointer group/citation"
                            >
                               <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">
                                 PDF
                               </div>
                               <div>
                                 <p className="text-[10px] font-black text-slate-900 leading-none mb-0.5">Multimodal_RAG.pdf</p>
                                 <p className="text-[9px] font-bold text-blue-600 leading-none">Verified Citation: Page 142</p>
                               </div>
                               <div className="ml-4 w-6 h-6 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover/citation:border-blue-200 group-hover/citation:text-blue-600 transition-colors">
                                 <ExternalLink size={10} />
                               </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Bottom Bar Input Mockup */}
                  <div className="h-24 border-t border-slate-100 bg-slate-50/50 px-10 flex items-center gap-4">
                    <div className="flex-1 h-14 bg-white border border-slate-200/60 rounded-2xl px-6 flex items-center gap-4 shadow-sm group-hover:border-blue-400/30 transition-all">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <div className="text-[13px] font-bold text-slate-400">Ask the research data...</div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30">
                       <ArrowRight size={22} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>

        <div className="border-t border-slate-100 bg-slate-50/30">
          <StudentResearch />
        </div>
      </main>

      {/* Global qualitative footer notice */}
      <footer className="py-12 border-t border-slate-100">
        <Container className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-40 grayscale">
            <img src="https://yt3.googleusercontent.com/btm1_PK-7VRUr9GY2D0UV_2XfbUZPBjghyptjSO1crsfN86HyTYDWPmUbq7JxC3H0Lxe_s067nA=s900-c-k-c0x00ffffff-no-rj" className="h-5 grayscale" alt="NVIDIA" />
            <div className="h-4 w-px bg-slate-300" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase">Compute Collaboration</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © 2026 Multimodal RAG Research Initiative
          </p>
        </Container>
      </footer>
    </div>
  );
}

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`max-w-7xl mx-auto px-6 ${className}`}>{children}</div>;
}

