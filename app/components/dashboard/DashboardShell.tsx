'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Divider } from '@heroui/react';
import { Zap, LayoutDashboard, Files, Settings, LogOut, ChevronRight, Menu, X, Sun, Moon, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard',          icon: LayoutDashboard },
  { label: 'My Files',  href: '/dashboard/files',    icon: Files },
];

export default function DashboardShell({ children, title, subtitle }: Props) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#03070f]">
      {/* --- Sidebar ------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#080f1e] border-r border-slate-200/80 dark:border-slate-800/60 flex flex-col transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-slate-200/60 dark:border-slate-800/50">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: COLORS.primary[600] }}
          >
            <Zap size={15} className="text-white" fill="white" />
          </div>
          <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
            Teach<span style={{ color: COLORS.primary[600] }}>AI</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
                style={isActive ? { backgroundColor: COLORS.primary[600] } : {}}
              >
                <Icon size={16} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* User profile at bottom */}
        <div className="px-4 py-4 border-t border-slate-200/60 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <Avatar
              size="sm"
              name={user?.name ?? user?.email ?? 'T'}
              src={user?.avatarUrl ?? undefined}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                {user?.name ?? 'Teacher'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 flex-shrink-0"
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- Main content -------------------------------------------------- */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#080f1e]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/50 flex items-center gap-4 px-6">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden text-slate-500"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          <div className="flex-1">
            {title && (
              <div>
                <h1 className="text-base font-black text-slate-900 dark:text-white">{title}</h1>
                {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
              </div>
            )}
          </div>

          <Button
            isIconOnly
            size="sm"
            variant="light"
            onClick={toggleTheme}
            className="text-slate-500 dark:text-slate-400"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
