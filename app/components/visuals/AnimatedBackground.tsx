'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Dynamic gradient blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-400/5 dark:bg-violet-600/10 blur-[120px]"
      />
      
      {/* Subtle grid pattern for texture */}
      <div className="absolute inset-0 grid-bg opacity-30 dark:opacity-50" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,var(--bg)_100%] opacity-50" />
    </div>
  );
}
