'use client';

import React from 'react';
import Link from 'next/link';
import AppNavbar from '../components/Navbar';
import { ChevronLeft, Scale, ShieldCheck, Mail, MapPin, ChevronRight, Gavel, FileText } from 'lucide-react';
import { COLORS } from '../constants/colors';
import { Divider } from '@heroui/react';
import SectionBadge from '../components/common/SectionBadge';

const SECTIONS = [
  { id: 'acceptance', label: 'Acceptance' },
  { id: 'description', label: 'Description' },
  { id: 'license', label: 'User license' },
  { id: 'disclaimer', label: 'Disclaimer' },
  { id: 'limitations', label: 'Limitations' },
];

export default function TermsPage() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#03070f] overflow-x-hidden">
      <AppNavbar />
      
      {/* --- Hero Header --- */}
      <div className="relative pt-20 pb-16 px-6 text-center">
        {/* Background Patterns */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05),transparent_70%)]" />
          <div className="grid-bg absolute inset-0 opacity-30" />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <SectionBadge icon={<Gavel size={14} />}>
              TERMS & AGREEMENT
            </SectionBadge>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
            Terms of <span style={{ color: COLORS.primary[600] }}>Service</span>
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-4">
            Please read these terms carefully before using our platform. They outline your rights and obligations as a user.
          </p>
          
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            EFFECTIVE DATE: APRIL 10, 2026
          </p>
        </div>
      </div>

      <Divider className="opacity-50" />

      {/* --- Content Section --- */}
      <div className="max-w-7xl mx-auto w-full px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
        
        {/* Left: Navigation */}
        <div className="md:col-span-3 hidden md:block">
          <div className="sticky top-24">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 items-center flex gap-2">
              AGREEMENT SECTIONS
            </h3>
            <div className="flex flex-col gap-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="flex items-center justify-between group px-4 py-3 rounded-xl transition-all hover:bg-white dark:hover:bg-slate-800 text-left"
                >
                  <span className="text-sm font-bold text-slate-500 group-hover:text-primary transition-colors">
                    {s.label}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Actual Content */}
        <div className="md:col-span-9 space-y-20 max-w-3xl">
          <p className="text-slate-600 dark:text-slate-400 italic text-sm leading-relaxed border-l-4 border-primary/20 pl-6 py-2">
            These terms constitute a legally binding agreement between you and ai for job regarding your use of the platform and services.
          </p>

          <section id="acceptance">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">1. Acceptance of Terms</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[17px]">
              By accessing or using ai for job ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section id="description">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">2. Description of Service</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[17px]">
              TeachAI provides an AI-powered educational assistant designed to help teachers process course materials via RAG technology. We reserve the right to modify or discontinue any part of the service at any time without prior notice.
            </p>
          </section>

          <section id="license">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Scale size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">3. User License</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[17px]">
              Permission is granted to temporarily use the platform for personal, educational purposes. This is a grant of a license, not a transfer of title. You may not reverse engineer the software, remove proprietary markings, or use the platform for unauthorized commercial gain.
            </p>
          </section>

          <section id="disclaimer">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Gavel size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">4. Disclaimer</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[17px]">
              The materials on TeachAI's platform are provided 'as is'. TeachAI makes no warranties, expressed or implied, and hereby disclaims all other warranties including, without limitation, implied warranties of merchantability or fitness for a particular purpose.
            </p>
          </section>

          <section id="limitations">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ChevronLeft size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">5. Limitations</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[17px]">
              In no event shall TeachAI be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the platform.
            </p>
          </section>

        </div>
      </div>

      <footer className="mt-auto py-12 px-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-500">© 2026 TeachAI. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <Link href="/privacy" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
