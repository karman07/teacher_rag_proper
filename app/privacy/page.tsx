'use client';

import React from 'react';
import AppNavbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { ShieldCheck, Database, Sparkles, FlaskConical, Trash2, UserCheck, Building2, Mail, ChevronRight } from 'lucide-react';
import { Divider } from '@heroui/react';
import SectionBadge from '../components/common/SectionBadge';

const SECTIONS = [
  { id: 'information-we-collect', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Information' },
  { id: 'beta-notice', label: 'Beta-Version Notice' },
  { id: 'retention', label: 'Data Retention & Deletion' },
  { id: 'age', label: 'Age Requirement' },
  { id: 'independent', label: 'Independent Platform' },
  { id: 'contact', label: 'Contact Us' },
];

export default function PrivacyPolicyPage() {
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
            <SectionBadge icon={<ShieldCheck size={14} />}>
              BETA VERSION
            </SectionBadge>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
            Privacy <span className="text-primary">Policy</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-4">
            VTA — Virtual Teaching Assistant — is an independently hosted beta educational platform led by Dr. Parteek Kumar Bhatia. It is not connected to Washington State University&rsquo;s systems or to any learning management system.
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
              POLICY SECTIONS
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
          <p className="text-slate-600 italic text-sm leading-relaxed border-l-4 border-primary/20 pl-6 py-2">
            This policy explains what information VTA collects and how it is used.
          </p>

          <section id="information-we-collect">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Database size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">1. Information We Collect</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-[17px]">
                When you use VTA, we may collect:
              </p>
              <ul className="space-y-4 text-slate-600 text-[17px] list-none">
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Your email address and sign-in information.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Course materials uploaded by users.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Questions submitted by users and responses generated by VTA.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Basic technical information needed to operate and improve the platform.</span>
                </li>
              </ul>
            </div>
          </section>

          <section id="how-we-use">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">2. How We Use Information</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-[17px]">
                We use this information to:
              </p>
              <ul className="space-y-4 text-slate-600 text-[17px] list-none">
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Create and manage user accounts.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Generate responses based on uploaded course materials.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Operate, evaluate, and improve VTA.</span>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span>Identify and resolve technical problems.</span>
                </li>
              </ul>
              <p className="text-slate-600 leading-relaxed text-[17px] pt-2">
                VTA may use third-party providers for authentication, website hosting, data storage, and AI processing.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px] font-semibold">
                We do not sell personal information. Uploaded course materials are not used to train publicly available AI models.
              </p>
            </div>
          </section>

          <section id="beta-notice">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FlaskConical size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">3. Beta-Version Notice</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-[17px]">
                VTA is currently in beta. Its features may change, and its responses may not always be complete or accurate. Users should verify important information using the original course materials.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px] p-4 rounded-2xl bg-amber-50 border border-amber-200">
                Please do not upload passwords, financial information, medical records, Social Security numbers, confidential student records, or other sensitive information.
              </p>
            </div>
          </section>

          <section id="retention">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Trash2 size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">4. Data Retention and Deletion</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-[17px]">
              Information may be retained while your account is active or as needed to operate and evaluate the beta platform. You may contact us to request the deletion of your account or uploaded course materials.
            </p>
          </section>

          <section id="age">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <UserCheck size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">5. Age Requirement</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-[17px]">
              VTA is intended for higher-education and professional-learning use. Children under 13 may not create or use a VTA account.
            </p>
          </section>

          <section id="independent">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Building2 size={20} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">6. Independent Platform</h2>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-[17px]">
                VTA is not an official service of Washington State University. Dr. Kumar&rsquo;s university affiliation is provided for professional identification only.
              </p>
              <p className="text-slate-600 leading-relaxed text-[17px]">
                VTA was developed through research supported by the NVIDIA Academic Grant Program. NVIDIA does not operate VTA or control its data practices.
              </p>
            </div>
          </section>

          <section id="contact" className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">7. Contact</h2>
            <p className="text-slate-500 text-sm mb-6">
              For privacy questions or deletion requests, contact:
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
                  <p className="text-slate-900 font-bold text-sm">parteek.kumar@gmail.com</p>
                </div>
              </div>
            </div>
            <p className="text-slate-500 text-sm mt-6 leading-relaxed">
              This policy may be updated as VTA develops. Updates will be posted on this page with a revised effective date.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
