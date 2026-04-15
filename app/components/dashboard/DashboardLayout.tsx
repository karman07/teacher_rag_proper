'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@heroui/react';
import {
  LayoutDashboard, FolderOpen, BarChart3, MessageCircle,
  LogOut, Sun, Moon, Menu, X, Cpu, BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

const SIDEBAR_W = 224; // px — fixed, never changes

const NAV = [
  { label: 'Dashboard',       href: '/dashboard',           icon: LayoutDashboard },
  { label: 'Subjects',        href: '/dashboard/subjects',  icon: BookOpen },
  { label: 'File Management', href: '/dashboard/files',     icon: FolderOpen },
  { label: 'Analytics',       href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Ask AI',          href: '/dashboard/chat',      icon: MessageCircle },
];

interface Props { children: React.ReactNode }

/* --- Sidebar guts --------------------------------------------------------- */
function SidebarContent({
  pathname, onNavClick, onLogout, toggleTheme, theme, user,
}: {
  pathname: string; onNavClick: () => void; onLogout: () => void;
  toggleTheme: () => void; theme: string; user: any;
}) {
  // Text colors adapt to theme — using secondary for brighter contrast than muted
  const mutedText = 'var(--text-secondary)';
  const bodyText  = 'var(--text)';

  return (
    // ← overflow:hidden so nav list NEVER creates a scrollbar
    <div className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>

      {/* Logo — fixed at top */}
      <div className="flex-shrink-0 px-4 pt-5 pb-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: COLORS.primary[600] }}>
            <Cpu size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-black tracking-tight" style={{ color: bodyText }}>
              TeachAI
            </p>
            <p className="text-[10px]" style={{ color: mutedText }}>
              Knowledge Platform
            </p>
          </div>
        </div>
      </div>

      {/* Nav — flex-1, but overflow:hidden keeps it from scrolling */}
      <nav className="flex-1 px-2.5 py-3 space-y-px overflow-hidden">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href));

          return (
            <Link key={href} href={href} onClick={onNavClick}>
              <div
                className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer
                  select-none transition-colors duration-100"
                style={{
                  backgroundColor: active ? (theme === 'dark' ? COLORS.nav.activeBgDark : COLORS.nav.activeBgLight) : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor =
                      theme === 'dark' ? COLORS.nav.hoverBgDark : COLORS.nav.hoverBgLight;
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
              >
                {/* Left accent bar */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r"
                    style={{ backgroundColor: COLORS.nav.activeBorder }}
                  />
                )}

                <Icon
                  size={15}
                  style={{
                    color: active ? (theme === 'dark' ? COLORS.nav.activeTextDark : COLORS.nav.activeTextLight) : mutedText,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="text-[13px] font-semibold truncate"
                  style={{ color: active ? (theme === 'dark' ? COLORS.nav.activeTextDark : COLORS.nav.activeTextLight) : mutedText }}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer — fixed at bottom, flex-shrink-0 */}
      <div className="flex-shrink-0 px-2.5 pb-4 space-y-px"
        style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px]
            font-semibold transition-colors duration-100"
          style={{ color: mutedText }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {theme === 'dark'
            ? <Sun size={14} />
            : <Moon size={14} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Sign out */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px]
            font-semibold transition-colors duration-100"
          style={{ color: mutedText }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(244,63,94,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <LogOut size={14} />
          Sign Out
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 pt-3"
          style={{ borderTop: '1px solid var(--border)', marginTop: '8px' }}>
          <Avatar name={user?.name ?? 'T'} size="sm"
            className="w-7 h-7 text-[11px] font-black flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[12px] font-bold truncate" style={{ color: bodyText }}>
              {user?.name ?? 'Teacher'}
            </p>
            <p className="text-[10px] truncate" style={{ color: mutedText }}>
              {user?.email ?? ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Outer layout --------------------------------------------------------- */
export default function DashboardLayout({ children }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout }   = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const handleLogout = () => { logout(); router.push('/login'); };

  const sidebarProps = {
    pathname,
    onNavClick:   () => setOpen(false),
    onLogout:     handleLogout,
    toggleTheme,
    theme,
    user,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>

      {/* -- Desktop sidebar — FIXED position, FIXED width, FIXED height -- */}
      <aside
        className="hidden md:block"
        style={{
          position:  'fixed',
          top:       0,
          left:      0,
          width:     `${SIDEBAR_W}px`,
          height:    '100vh',
          zIndex:    30,
          // No overflow on the outer aside — SidebarContent handles it
          overflow:  'hidden',
        }}
      >
        <SidebarContent {...sidebarProps} onNavClick={() => {}} />
      </aside>

      {/* -- Mobile overlay sidebar -- */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -SIDEBAR_W }} animate={{ x: 0 }} exit={{ x: -SIDEBAR_W }}
              transition={{ type: 'tween', duration: 0.18 }}
              style={{
                position: 'fixed',
                top: 0, left: 0,
                width: `${SIDEBAR_W}px`,
                height: '100vh',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpen(false)}
                style={{
                  position: 'absolute', top: 12, right: 10, zIndex: 1,
                  padding: '4px', borderRadius: '6px',
                  color: 'var(--text-muted)', backgroundColor: 'transparent',
                  cursor: 'pointer', border: 'none',
                }}
              >
                <X size={15} />
              </button>
              <SidebarContent {...sidebarProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* -- Main content — push right by sidebar width on md+ -- */}
      <div
        className="md:ml-56 flex flex-col min-h-screen"
      >
        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button
            onClick={() => setOpen(true)}
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Menu size={20} />
          </button>
          <p className="text-[13px] font-black" style={{ color: 'var(--text)' }}>TeachAI</p>
        </div>

        {/* Page */}
        <main className="flex-1 overflow-auto p-5 sm:p-6 lg:p-8"
          style={{ backgroundColor: 'var(--bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
