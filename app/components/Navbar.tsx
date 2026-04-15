'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem, 
  Button,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Tooltip
} from '@heroui/react';
import { Zap, Sun, Moon, LayoutDashboard, LogOut, ChevronRight } from 'lucide-react';
import { COLORS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, isLoading } = useAuth();

  const menuItems = [
    { label: 'Features', href: '/#features' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ];

  return (
    <Navbar 
      onMenuOpenChange={setIsMenuOpen} 
      maxWidth="xl" 
      position="sticky"
      className="bg-white/80 dark:bg-[#020812]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 h-20"
      classNames={{
        wrapper: "px-6 sm:px-12",
      }}
    >
      {/* -- Brand / Logo -------------------------------------------------------- */}
      <NavbarContent justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden text-slate-600 dark:text-slate-400"
        />
        <NavbarBrand className="gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/20 blur-lg rounded-full group-hover:bg-primary-500/40 transition-all duration-500" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
                <Zap size={20} className="text-white fill-white" />
              </div>
            </div>
            <div className="flex flex-col -gap-1">
              <p className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight flex items-baseline">
                Teach<span className="text-primary-600 dark:text-primary-400 font-black">AI</span>
              </p>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">
                Assistant
              </span>
            </div>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* -- Main Nav Links ------------------------------------------------------ */}
      <NavbarContent className="hidden sm:flex gap-10" justify="center">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <NavbarItem key={item.label} className="relative">
              <Link 
                href={item.href}
                className={`text-sm font-semibold tracking-wide transition-all duration-200 hover:text-primary-600 dark:hover:text-primary-400 ${
                  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </Link>
              {isActive && (
                <motion.div 
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full"
                />
              )}
            </NavbarItem>
          );
        })}
      </NavbarContent>

      {/* -- Actions ------------------------------------------------------------- */}
      <NavbarContent justify="end" className="gap-3 sm:gap-5">
        <NavbarItem>
          <Button
            isIconOnly
            variant="light"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </NavbarItem>

        {!isLoading && (
          <>
            {user ? (
              <NavbarItem className="flex items-center gap-4">
                <Button 
                  as={Link} 
                  href="/dashboard" 
                  variant="shadow"
                  startContent={<LayoutDashboard size={16} />}
                  className="bg-primary-600 text-white font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all hidden md:flex"
                >
                  Dashboard
                </Button>
                
                <Tooltip content="Sign Out" showArrow placement="bottom">
                  <Button
                    isIconOnly
                    variant="flat"
                    onClick={logout}
                    className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                  >
                    <LogOut size={18} />
                  </Button>
                </Tooltip>
              </NavbarItem>
            ) : (
              <div className="flex items-center gap-3">
                {pathname !== '/login' && (
                  <NavbarItem className="hidden md:flex">
                    <Button 
                      as={Link} 
                      href="/login" 
                      variant="light" 
                      className="font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-11 rounded-2xl"
                    >
                      Sign In
                    </Button>
                  </NavbarItem>
                )}
                {pathname !== '/signup' && (
                  <NavbarItem>
                    <Button 
                      as={Link} 
                      href="/signup" 
                      variant="shadow"
                      className="bg-primary-600 text-white font-bold h-11 px-8 rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all"
                    >
                      Get Started
                    </Button>
                  </NavbarItem>
                )}
              </div>
            )}
          </>
        )}
      </NavbarContent>

      {/* -- Mobile Menu --------------------------------------------------------- */}
      <NavbarMenu className="bg-white/90 dark:bg-[#020812]/90 backdrop-blur-2xl pt-10 px-8 gap-4 border-t border-slate-200 dark:border-slate-800">
        {user && (
          <NavbarMenuItem>
            <Link
              className="group flex items-center justify-between w-full p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 text-lg font-bold transition-all"
              href="/dashboard"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={24} />
                Dashboard
              </div>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </NavbarMenuItem>
        )}
        
        <div className="py-2 space-y-1">
          {menuItems.map((item, index) => (
            <NavbarMenuItem key={`${item.label}-${index}`}>
              <Link
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-lg font-semibold transition-all"
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
                <ChevronRight size={18} className="text-slate-400" />
              </Link>
            </NavbarMenuItem>
          ))}
        </div>

        {user && (
          <NavbarMenuItem className="mt-auto pb-12">
            <Button
              onClick={logout}
              variant="flat"
              className="w-full h-14 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 text-lg font-bold gap-3"
            >
              <LogOut size={22} />
              Sign Out
            </Button>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </Navbar>
  );
}

