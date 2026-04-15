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

function ProductMockup() {
  return (
    <div className="relative animate-float">
      {/* Main card */}
      <div className="glass-card rounded-2xl border border-slate-200/80 dark:border-blue-900/40 shadow-2xl shadow-blue-200/40 dark:shadow-blue-950/80 p-6 overflow-hidden">
        {/* Gradient tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.03] to-violet-600/[0.03] dark:from-blue-600/8 dark:to-violet-600/8 pointer-events-none rounded-2xl" />

        {/* Window chrome */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              teachai.app
            </span>
          </div>
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Connected sources */}
        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          Connected Sources
        </p>
        <div className="flex flex-wrap gap-3 mb-5">
          {DATA_SOURCES.map((src) => (
            <div
              key={src.label}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/40 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] transition-all hover:border-primary/50"
              style={{ minWidth: 120 }}
            >
              <span className="flex items-center justify-center w-5 h-5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                {src.icon}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {src.label}
              </span>
              <div className="ml-auto w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle size={10} className="text-emerald-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Chat messages */}
        <div className="space-y-3 mb-5">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white text-xs rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] leading-relaxed shadow-md shadow-blue-500/20">
              Which topics are students struggling with?
            </div>
          </div>
          {/* AI response */}
          <div className="flex items-start gap-2">
            <div 
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: COLORS.primary[600] }}
            >
              <span className="text-white text-[9px] font-bold">AI</span>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] leading-relaxed">
              Based on{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                1,247 interactions
              </span>
              :{" "}
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                Derivatives
              </span>{" "}
              (34%),{" "}
              <span className="text-orange-500 dark:text-amber-400 font-semibold">
                Linear Eqs.
              </span>{" "}
              (28%),{" "}
              <span className="text-violet-600 dark:text-violet-400 font-semibold">
                Integration
              </span>{" "}
              (19%)
            </div>
          </div>
          {/* Typing indicator */}
          <div className="flex items-start gap-2">
            <div 
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: COLORS.primary[600] }}
            >
              <span className="text-white text-[9px] font-bold">AI</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm">
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-3 bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Generating response…
              </span>
            </div>
          </div>
        </div>

        {/* Metric bars */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
          {METRICS.map((m) => (
            <div key={m.label}>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                <span>{m.label}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {m.pct}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${m.pct}%`, backgroundColor: COLORS.primary[600] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating badge — top right */}
      <div
        className="absolute -top-5 -right-5 glass-card border border-slate-200/80 dark:border-blue-900/40 rounded-2xl px-4 py-3 shadow-xl animate-float"
        style={{ animationDelay: "1s" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
            RAG Active
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            94.2%
          </span>{" "}
          accuracy
        </p>
      </div>

      {/* Floating badge — bottom left (improved) */}
      <div
        className="absolute -bottom-5 -left-5 glass-card border border-slate-200/80 dark:border-blue-900/40 rounded-2xl px-4 py-3 shadow-xl animate-float"
        style={{ animationDelay: "2s" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <BookOpen size={18} className="text-blue-600 dark:text-blue-300" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
              2.4K Docs
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Processed today
            </p>
          </div>
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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white dark:bg-[#03070f] pt-16">
      {/* Grid + glow backgrounds */}
      <div className="absolute inset-0 grid-bg opacity-60 dark:opacity-100" />
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-blue-500/[0.04] dark:bg-blue-600/[0.08] blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-400/[0.04] dark:bg-blue-600/[0.06] blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <Container className="relative z-10 py-20 w-full">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">

          {/* --- Left column --- */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col gap-8 max-w-[640px] min-w-0"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <SectionBadge live>AI-Powered Teaching Platform</SectionBadge>
            </motion.div>

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
              TeachAI builds intelligent RAG systems and delivers analytics that
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

              <Button
                variant="bordered"
                size="lg"
                startContent={
                  <span className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <Play
                      size={13}
                      className="text-blue-600 dark:text-blue-400 ml-0.5"
                      fill="currentColor"
                    />
                  </span>
                }
                className="border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold px-8 h-14 rounded-2xl hover:border-primary-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all"
              >
                Watch Demo
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-2">
              {/* Stacked avatars */}
              <div className="flex -space-x-2.5">
                {AVATAR_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-white dark:border-[#03070f] flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {AVATAR_LETTERS[i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={14}
                      className="text-amber-400"
                      fill="#f59e0b"
                    />
                  ))}
                  <span className="ml-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    4.9
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Loved by{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    2,400+
                  </span>{" "}
                  educators
                </p>
              </div>
            </div>
          </motion.div>

          {/* --- Right column — mockup --- */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <ProductMockup />
          </motion.div>
        </div>

        {/* --- Trusted-by strip --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-24 pt-12 border-t border-slate-200 dark:border-slate-800"
        >
          <p className="text-center text-sm font-medium text-slate-400 dark:text-slate-500 mb-8 uppercase tracking-widest">
            Trusted by educators at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-16">
            {["Stanford", "MIT", "Harvard", "Oxford", "Coursera", "Khan Academy"].map(
              (name) => (
                <span
                  key={name}
                  className="text-xl font-bold text-slate-300 dark:text-slate-700 hover:text-slate-400 dark:hover:text-slate-500 transition-colors cursor-default select-none tracking-tight"
                >
                  {name}
                </span>
              )
            )}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
