'use client';

import AppNavbar from '../Navbar';

/**
 * AuthShell
 * Full-page background shell shared by /login and /signup.
 * Uses the grid-bg utility + animated ambient blobs from globals.css.
 */
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-[#03070f] grid-bg overflow-hidden">
      <AppNavbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-400/20 dark:bg-blue-700/10 blur-[130px] animate-float" />
          <div className="absolute -bottom-32 -right-20 w-[420px] h-[420px] rounded-full bg-violet-400/15 dark:bg-violet-700/10 blur-[110px] animate-float [animation-delay:3s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-sky-300/10 dark:bg-sky-600/5 blur-[80px] animate-float [animation-delay:1.5s]" />
        </div>

        <div className="relative z-10 w-full flex justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
