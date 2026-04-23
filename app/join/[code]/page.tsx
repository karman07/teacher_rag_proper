'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Loader2, Bot, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export default function JoinClassPage() {
  const { code } = useParams();
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState<any>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    // 1. Fetch class preview
    const fetchPreview = async () => {
      try {
        const res = await fetch(`${API}/students/class-preview/${code}`);
        if (!res.ok) throw new Error('Could not find this classroom. Check the link and try again.');
        const data = await res.json();
        setSubject(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        if (authLoading) return; // Wait for auth to settle
        setLoading(false);
      }
    };

    fetchPreview();
  }, [code, authLoading]);

  const handleJoin = async () => {
    if (!user) {
      // Redirect to login with return path
      router.push(`/login?callbackUrl=/join/${code}`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/students/join-magic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join class');

      setJoined(true);
      // Short delay for the animation
      setTimeout(() => {
        router.push(`/dashboard/chat/${data.subject.id}`);
      }, 1500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-join if user is already logged in and we have the subject
  useEffect(() => {
    if (user && subject && !joined && !loading && !error) {
       handleJoin();
    }
  }, [user, subject, loading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--surface-2)]">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-16 h-16 rounded-full border-[3px] border-[var(--primary-light)] border-t-[var(--primary)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap size={20} className="text-[var(--primary)]" />
          </div>
        </div>
        <p className="mt-6 font-bold text-[var(--muted)] label-caps">Entering Teacher's World...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--surface-2)]">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md p-8 text-center bg-white shadow-2xl rounded-[2.5rem] border border-slate-200"
        >
           <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-6">
              <AlertCircle size={32} />
           </div>
           <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Access Denied</h2>
           <p className="text-slate-500 font-medium mb-8 leading-relaxed px-4">{error}</p>
           <Link href="/" className="inline-flex w-full">
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95">
              Back to Home
            </button>
           </Link>
        </motion.div>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--surface-2)]">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md p-10 text-center bg-white shadow-2xl rounded-[3rem] border border-blue-50"
        >
           <div className="relative w-24 h-24 mx-auto mb-8">
             <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="absolute inset-0 bg-blue-100 rounded-full"
             />
             <div className="absolute inset-0 flex items-center justify-center text-blue-600 bg-white shadow-inner rounded-full">
                <CheckCircle2 size={48} />
             </div>
           </div>
           <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">You're In!</h2>
           <p className="text-slate-500 font-medium mb-2">Welcome to the session</p>
           <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-[var(--primary)] font-black text-xs uppercase tracking-widest mb-10">
             {subject?.name}
           </div>
           
           <div className="flex flex-col items-center gap-3">
             <div className="w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: "100%" }}
                 transition={{ duration: 1.5 }}
                 className="h-full bg-[var(--primary)] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
               />
             </div>
             <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
               <Loader2 size={12} className="animate-spin text-[var(--primary)]" /> Entering Chat
             </p>
           </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--surface-2)]">
      <motion.div 
         initial={{ y: 20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
         className="w-full max-w-[460px] bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-200/60 overflow-hidden"
      >
        <div className="p-10 pb-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-50">
            <GraduationCap size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Classroom Invite</h1>
          <p className="text-slate-500 font-medium mt-3">Ready to start your AI-powered learning?</p>
        </div>

        <div className="px-10 py-2">
          {/* Enhanced Teacher & Subject Card */}
          <div className="relative bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center overflow-hidden transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 group">
             {/* Decorative Elements */}
             <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors" />
             <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors" />

             {/* Avatar */}
             <div className="relative mb-4">
               <div className="w-20 h-20 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white group-hover:scale-105 transition-transform">
                 {subject.teacher.avatarUrl ? (
                   <img src={subject.teacher.avatarUrl} alt="Teacher" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-black text-2xl">
                     {subject.teacher.name[0]}
                   </div>
                 )}
               </div>
               <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-emerald-500" />
               </div>
             </div>

             <div className="z-10">
               <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.25em] mb-1">Session Invitation</p>
               <h3 className="text-xl font-bold text-slate-900">{subject.teacher.name}</h3>
               
               <div className="flex items-center justify-center gap-3 my-6">
                 <div className="h-[1.5px] w-8 bg-slate-200 rounded-full" />
                 <Bot size={18} className="text-slate-300" />
                 <div className="h-[1.5px] w-8 bg-slate-200 rounded-full" />
               </div>
               
               <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight px-4">{subject.name}</h2>
               
               <div className="flex items-center gap-3 mt-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-105">
                     <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Bot size={14} className="text-blue-500" />
                     </div>
                     <span className="text-xs font-black text-slate-700 tracking-tight">{subject._count.files} Materials</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-105">
                     <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                        <GraduationCap size={14} className="text-violet-500" />
                     </div>
                     <span className="text-xs font-black text-slate-700 tracking-tight">{subject._count.enrollments} Enrolled</span>
                  </div>
               </div>
             </div>
          </div>
        </div>

        <div className="p-10 pt-4">
          <button 
            onClick={handleJoin}
            disabled={loading}
            className="group relative w-full py-5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[1.8rem] font-bold text-base flex items-center justify-center gap-2 shadow-[0_15px_30px_rgba(37,99,235,0.25)] transition-all active:scale-[0.97]"
          >
            {user ? 'Accept Invite & Enter' : 'Sign in to Join Session'} 
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            
            {/* Shimmer effect on button */}
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12" />
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">
             <span>Instant Access</span>
             <div className="w-1 h-1 rounded-full bg-slate-300" />
             <span>AI Study Support</span>
             <div className="w-1 h-1 rounded-full bg-slate-300" />
             <span>Secure</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={className}>{children}</div>;
}
