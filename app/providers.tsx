'use client';

import { HeroUIProvider } from "@heroui/react";
import { useRouter } from 'next/navigation';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ThemeProvider>
      <AuthProvider>
        <HeroUIProvider navigate={router.push}>
          {children}
        </HeroUIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
