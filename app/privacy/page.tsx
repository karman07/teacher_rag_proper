'use client';

import React from 'react';
import Link from 'next/link';
import AppNavbar from '../components/Navbar';
import { ChevronLeft, Scale, ShieldCheck, Mail, MapPin, ChevronRight } from 'lucide-react';
import { COLORS } from '../constants/colors';
import { Divider } from '@heroui/react';
import SectionBadge from '../components/common/SectionBadge';

const SECTIONS = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'data-collection', label: 'Data Collection' },
  { id: 'usage', label: 'How We Use Data' },
  { id: 'security', label: 'Data Security' },
  { id: 'contact', label: 'Contact Us' },
];

export default function PrivacyPolicyPage() {
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
            <SectionBadge icon={<ShieldCheck size={14} />}>
              PRIVACY & PROTECTION
            </SectionBadge>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
            Privacy <span style={{ color: COLORS.primary[600] }}>Policy</span>
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-4">
            At TeachAI, your privacy is our priority. We are committed to transparency about how we collect, use, and protect your personal information.
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
            This policy outlines our commitment to your privacy regarding your use of the TeachAI platform and associated services.
          </p>

          <section id="introduction">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">1. Introduction</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[17px]">
              TeachAI respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section id="data-collection">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Scale size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">2. Information We Collect</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[17px]">
                We collect personal data from you in various ways, primarily to provide and improve our services.
              </p>
              <ul className="space-y-4 text-slate-600 dark:text-slate-300 text-[17px] list-none">
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span><strong>Identity Data:</strong> includes first name, last name, and role as a teacher or administrator.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span><strong>Contact Data:</strong> includes email address and educational institution details.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span><strong>Course Content:</strong> any documents or data you upload to be processed by our RAG system.</span>
                </li>
              </ul>
            </div>
          </section>

          <section id="usage">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ChevronRight size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">3. How We Use Data</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[17px]">
              Most commonly, we will use your personal data to perform the contract we are about to enter into or have entered into with you. Specifically, this means processing your uploaded materials to provide accurate AI-driven insights and managing your account.
            </p>
          </section>

          <section id="security">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">4. Data Security</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[17px]">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. We use enterprise-grade encryption for all data at rest and in transit.
            </p>
          </section>

          <section id="contact" className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Questions about our Privacy Policy?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Email</p>
                  <p className="text-slate-900 dark:text-white font-bold text-sm">privacy@teachai.io</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Office</p>
                  <p className="text-slate-900 dark:text-white font-bold text-sm">San Francisco, CA</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <footer className="mt-auto py-12 px-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-500">© 2026 TeachAI. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <Link href="/terms" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
