'use client';

import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
