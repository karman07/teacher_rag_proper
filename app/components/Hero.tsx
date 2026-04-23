"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { ArrowRight, Play, Star, CheckCircle } from "lucide-react";
import SectionBadge from "./common/SectionBadge";
import Container from "./common/Container";
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

/* --- Typewriter hook --- */
const TYPEWRITER_WORDS = [
  "AI Knowledge Bases",
  "Smart RAG Analytics",
  "Critical Insights",
  "Data-Driven Teaching",
];

function useTypewriter(words: string[], speed = 75, pause = 2200) {
  const [displayText, setDisplayText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayText === currentWord) {
      timeout = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    } else {
      timeout = setTimeout(
        () =>
          setDisplayText(
            isDeleting
              ? currentWord.slice(0, displayText.length - 1)
              : currentWord.slice(0, displayText.length + 1)
          ),
        isDeleting ? speed / 2 : speed
      );
    }
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, wordIndex, words, speed, pause]);

  return displayText;
}

/* --- Static data --- */
const AVATAR_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6"];
const AVATAR_LETTERS = ["A", "J", "S", "M", "R"];

import { SiGoogledrive, SiAmazonaws, SiNotion, SiDropbox } from "react-icons/si";

const DATA_SOURCES = [
  {
    label: "Google Drive",
    icon: <SiGoogledrive className="w-4 h-4 text-[#4285F4]" />,
    color: "#F1F6FD",
    border: "border-blue-200",
  },
  {
    label: "AWS S3",
    icon: <SiAmazonaws className="w-4 h-4 text-[#FF9900]" />,
    color: "#FFF7E6",
    border: "border-amber-200",
  },
  {
    label: "Notion",
    icon: <SiNotion className="w-4 h-4 text-black" />,
    color: "#F7F7F7",
    border: "border-slate-300",
  },
  {
    label: "Dropbox",
    icon: <SiDropbox className="w-4 h-4 text-[#0061FF]" />,
    color: "#F1F6FD",
    border: "border-blue-200",
  },
];

const METRICS = [
  { label: "Engagement", pct: 87, gradient: "from-blue-500 to-blue-600" },
  { label: "Comprehension", pct: 72, gradient: "from-violet-500 to-violet-600" },
];

/* --- Product mockup --- */
import { BookOpen } from "lucide-react";

function ResearchCollaboratorMockup() {
  return (
    <div className="relative animate-float group">
      {/* Decorative glows */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      
      {/* Glassmorphism Mockup Frame */}
      <div className="relative rounded-[3rem] border border-slate-200/50 dark:border-white/10 shadow-2xl overflow-hidden bg-white/70 dark:bg-slate-900/80 backdrop-blur-3xl aspect-[1/1] flex flex-col p-8">
         {/* Top Bar */}
         <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400/30" />
              <div className="w-3 h-3 rounded-full bg-amber-400/30" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/30" />
            </div>
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-32 border border-slate-200 dark:border-slate-700" />
         </div>

         {/* Grid Body */}
         <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="space-y-4">
               <div className="h-32 rounded-2xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30 p-4">
                  <div className="w-full h-2 bg-blue-200/50 dark:bg-blue-700/50 rounded-full mb-3" />
                  <div className="space-y-2">
                    <div className="w-[80%] h-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full" />
                    <div className="w-[90%] h-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full" />
                    <div className="w-[60%] h-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full" />
                  </div>
               </div>
               <div className="h-24 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-700/30 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                  </div>
                  <div className="h-4 bg-slate-200/30 dark:bg-slate-700/30 rounded-lg w-full" />
               </div>
            </div>
            <div className="h-full rounded-2xl bg-slate-900 border border-slate-700 p-4 flex flex-col relative overflow-hidden group">
               {/* Vector Tree Mockup */}
               <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none opacity-20">
                  <div className="w-full h-full border border-blue-500/10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
               </div>
               <div className="relative z-10 flex flex-col items-center justify-center flex-1">
                  <div className="w-16 h-16 rounded-full border border-blue-500/50 flex items-center justify-center mb-4 animate-pulse">
                     <div className="w-8 h-8 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
                  </div>
                  <div className="space-y-2 w-full">
                     <div className="h-1 bg-blue-500/30 rounded-full mx-auto w-1/2" />
                     <div className="h-1 bg-blue-500/20 rounded-full mx-auto w-1/3" />
                  </div>
               </div>
               {/* Metadata Chips */}
               <div className="mt-auto space-y-2">
                  <div className="flex gap-2">
                    <div className="h-3 rounded-full bg-slate-800 border border-slate-700 w-12" />
                    <div className="h-3 rounded-full bg-slate-800 border border-slate-700 w-8" />
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Floating qualitative badge */}
      <div
        className="absolute -top-6 -right-6 glass-card border border-white/40 dark:border-blue-900/40 rounded-2xl px-5 py-4 shadow-2xl backdrop-blur-xl animate-float"
        style={{ animationDelay: "1s" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-[10px] font-black text-slate-800 dark:text-blue-100 uppercase tracking-[0.2em] whitespace-nowrap">
            Deterministic Engine
          </span>
        </div>
      </div>
    </div>
  );
}



/* --- Main Hero section --- */
export default function Hero() {
  const { user } = useAuth();
  const typewriterText = useTypewriter(TYPEWRITER_WORDS);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-white dark:bg-[#03070f] pt-8">
      {/* Grid + glow backgrounds */}
      <div className="absolute inset-0 grid-bg opacity-60 dark:opacity-100" />
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-blue-500/[0.04] dark:bg-blue-600/[0.08] blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-400/[0.04] dark:bg-blue-600/[0.06] blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <Container className="relative z-10 py-12 w-full">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">

          {/* --- Left column --- */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col gap-8 max-w-[640px] min-w-0"
          >

            {/* Headline */}
            <div>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white">
                Turn Your Courses Into
              </h1>
              {/* Typewriter line — fixed height prevents layout shift */}
              <div className="mt-2 min-h-[4rem] lg:min-h-[5.5rem] relative flex items-start">
                {/* Invisible spacer to lock width and prevent layout shift during typing */}
                <div className="invisible h-0 font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem] leading-[1.1] tracking-tight whitespace-nowrap pointer-events-none select-none">
                  Interactive Course Insights
                </div>
                
                <h1
                  className="absolute top-0 left-0 text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem] font-bold leading-[1.1] tracking-tight text-blue-600 dark:text-blue-400 whitespace-nowrap"
                >
                  {typewriterText}
                  <span className="inline-block w-[3px] h-9 lg:h-14 bg-blue-600 dark:bg-blue-400 ml-1 align-middle cursor-blink" />
                </h1>
              </div>
            </div>

            {/* Sub-headline */}
            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-[520px]">
              Upload your teaching materials from Google Drive, S3, or anywhere.
              Multimodal Teacher builds intelligent RAG systems and delivers analytics that
              transform how you teach.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                as={Link}
                href={user ? "/dashboard" : "/signup"}
                color="primary"
                size="lg"
                endContent={<ArrowRight size={18} />}
                className="font-bold px-10 h-14 rounded-2xl shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all text-white"
                style={{ backgroundColor: COLORS.primary[600] }}
              >
                {user ? "Go to Dashboard" : "Start for Free"}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <ResearchCollaboratorMockup />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
