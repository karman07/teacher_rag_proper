'use client';

import React from 'react';
import Link from 'next/link';
import AppNavbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { ChevronRight, Gavel, FlaskConical, UserCheck, FileText, Bot, ShieldAlert, Lock, Server, Building2, Mail } from 'lucide-react';
import { Divider } from '@heroui/react';
import SectionBadge from '../components/common/SectionBadge';

const SECTIONS = [
  { id: 'beta-platform', label: 'Beta Platform' },
  { id: 'user-accounts', label: 'User Accounts' },
  { id: 'uploaded-materials', label: 'Uploaded Materials' },
  { id: 'ai-responses', label: 'AI-Generated Responses' },
  { id: 'acceptable-use', label: 'Acceptable Use' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'availability', label: 'Availability & Responsibility' },
  { id: 'independent', label: 'Independent Platform & Grant Support' },
  { id: 'changes', label: 'Changes to These Terms' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsPage() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      <AppNavbar />

      {/* --- Hero Header --- */}
      <div className="relative pt-20 pb-16 px-6 text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05),transparent_70%)]" />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8">
            <SectionBadge icon={<Gavel size={14} />}>
              BETA VERSION
            </SectionBadge>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
            Terms of <span className="text-primary">Service</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-4">
            Welcome to VTA — Virtual Teaching Assistant. VTA is an independently hosted beta educational platform led by Dr. Parteek Kumar Bhatia. By creating an account or using VTA, you agree to these Terms of Service.
          </p>

          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            EFFECTIVE DATE: SEPTEMBER 6, 2026
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
                  className="flex items-center justify-between group px-4 py-3 rounded-xl transition-all hover:bg-white text-left"
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
          <section id="beta-platform">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FlaskConical size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">1. Beta Platform</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-[17px]">
              VTA is under development and is provided for educational, research, and testing purposes. Its features may change, become temporarily unavailable, or be discontinued as the platform develops.
            </p>
          </section>

          <section id="user-accounts">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <UserCheck size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">2. User Accounts</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-[17px]">
                You must provide accurate information when creating an account. You are responsible for activity performed through your account and for keeping your login information private.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px]">
                You must not share your account or attempt to access another user&rsquo;s account. Children under 13 may not create or use a VTA account.
              </p>
            </div>
          </section>

          <section id="uploaded-materials">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">3. Uploaded Materials</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-[17px]">
                You may upload only materials that you own or are authorized to use. You retain ownership of your uploaded materials.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px]">
                By uploading content, you give VTA permission to store and process it as needed to provide the platform&rsquo;s features.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px] p-4 rounded-2xl bg-amber-50 border border-amber-200">
                Do not upload confidential student records, passwords, financial information, medical records, Social Security numbers, or other sensitive information.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px]">
                VTA may remove content when requested by its owner or when reasonably necessary for legal, security, or operational reasons.
              </p>
            </div>
          </section>

          <section id="ai-responses">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Bot size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">4. AI-Generated Responses</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-[17px]">
                VTA uses artificial intelligence to generate responses based on uploaded course materials. Responses may sometimes be incomplete, inaccurate, or outdated.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px]">
                Users should verify important information using the original course materials and appropriate human judgment. Educators remain responsible for instructional, assessment, and grading decisions.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px]">
                VTA should not be used as the sole basis for legal, medical, financial, safety-related, academic-integrity, or other consequential decisions.
              </p>
            </div>
          </section>

          <section id="acceptable-use">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldAlert size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">5. Acceptable Use</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-[17px]">
                You agree not to:
              </p>
              <ul className="space-y-4 text-slate-600 text-[17px] list-none">
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Use VTA for unlawful, harmful, or misleading activities.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Upload content that violates another person&rsquo;s rights.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Attempt to bypass security or access another user&rsquo;s information.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Disrupt, damage, reverse-engineer, or misuse the platform.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Use automated methods to overload or interfere with VTA.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Use AI-generated content in violation of applicable academic-integrity policies.</span>
                </li>
              </ul>
              <p className="text-slate-600 leading-relaxed text-[17px] pt-2">
                Access may be limited or removed if these terms are violated or if continued access creates legal, security, or operational concerns.
              </p>
            </div>
          </section>

          <section id="privacy">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Lock size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">6. Privacy</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-[17px]">
              The collection and use of information are explained in the{' '}
              <Link href="/privacy" className="font-bold text-primary hover:underline">VTA Privacy Policy</Link>.
            </p>
          </section>

          <section id="availability">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Server size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">7. Availability and Responsibility</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-[17px]">
                VTA is provided on an &ldquo;as available&rdquo; basis during its beta period. We do not promise uninterrupted access or that every response will be accurate or suitable for a particular purpose.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px]">
                To the extent permitted by law, VTA and its project team are not responsible for losses resulting from reliance on AI-generated responses, unauthorized use of an account, or materials uploaded by users.
              </p>
            </div>
          </section>

          <section id="independent">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Building2 size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">8. Independent Platform and Grant Support</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-[17px]">
                VTA is independently hosted and is not connected to Washington State University&rsquo;s internal systems, student-information systems, or any learning management system.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px]">
                VTA is not an official service of Washington State University. Dr. Kumar&rsquo;s university affiliation is provided for professional identification only.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px]">
                VTA was developed through research supported by the NVIDIA Academic Grant Program. NVIDIA does not operate VTA, provide its responses, or control its data practices. Grant support does not imply NVIDIA&rsquo;s endorsement of the platform.
              </p>
            </div>
          </section>

          <section id="changes">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">9. Changes to These Terms</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-[17px]">
              These terms may be updated as VTA develops. Updated terms will be posted on this page with a revised effective date.
            </p>
          </section>

          <section id="contact" className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">10. Contact</h2>
            <p className="text-slate-500 text-sm mb-6">
              For questions about these terms, contact:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Contact</p>
                  <p className="text-slate-900 font-bold text-sm">Dr. Parteek Kumar Bhatia</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Email</p>
                  <p className="text-slate-900 font-bold text-sm">parteek.bhatia@gmail.com</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
