"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { ArrowRight, Clock, CheckCircle2, FileText, Sparkles } from "lucide-react";
import Container from "../common/Container";
import { useAuth } from "../../context/AuthContext";
import { COLORS } from "../../constants/colors";

/* --- Typewriter hook --- */
const TYPEWRITER_WORDS = [
  "Not Longer.",
  "More Effectively.",
  "With Instant Answers.",
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

/* --- Main Hero section --- */
export default function Hero() {
  const { user } = useAuth();
  const typewriterText = useTypewriter(TYPEWRITER_WORDS);

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-white pt-8">
      {/* Grid + glow backgrounds */}
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-blue-500/[0.04] blur-[120px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-400/[0.04] blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <Container className="relative z-10 py-12 w-full">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">

          {/* --- Left column --- */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col gap-8 max-w-[640px] min-w-0"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-wide w-fit">
              <Sparkles size={14} /> The #1 AI Study Tool for Students
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900">
                Study Smarter,
              </h1>
              {/* Typewriter line — fixed height prevents layout shift */}
              <div className="mt-2 min-h-[4rem] lg:min-h-[5.5rem] relative flex items-start">
                <div className="invisible font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem] leading-[1.1] tracking-tight pointer-events-none select-none">
                  With Instant Answers.
                </div>
                
                <h1
                  className="absolute top-0 left-0 text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem] font-bold leading-[1.1] tracking-tight text-blue-600"
                >
                  {typewriterText}
                  <span className="inline-block w-[3px] h-9 lg:h-14 bg-blue-600 ml-1 align-middle cursor-blink" />
                </h1>
              </div>
            </div>

            {/* Sub-headline */}
            <p className="text-xl text-slate-600 leading-relaxed max-w-[520px]">
              Get instant answers from your own course materials—with sources you can trust. Upload your notes, PDFs, or textbooks. Ask questions anytime. Get clear answers backed by your actual study material.
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
                {user ? "Go to Dashboard" : "Start Studying Smarter (Free)"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 border-t border-slate-200/60">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 size={12} strokeWidth={3} /></div>
                <span className="text-sm font-bold text-slate-700">Free to use</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><FileText size={12} strokeWidth={3} /></div>
                <span className="text-sm font-bold text-slate-700">Works with notes & PDFs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Clock size={12} strokeWidth={3} /></div>
                <span className="text-sm font-bold text-slate-700">Takes 2 mins to start</span>
              </div>
            </div>

          </motion.div>

          {/* --- Right column --- */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <Image
              src="/banner_image.png"
              alt="VTA banner"
              width={600}
              height={600}
              className="w-full h-auto rounded-3xl shadow-2xl"
              priority
            />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
