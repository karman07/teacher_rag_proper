'use client';

import { HeroUIProvider } from "@heroui/react";
import { useRouter } from 'next/navigation';
import { AuthProvider } from './context/AuthContext';
import ActivityTracker from './components/ActivityTracker';

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <AuthProvider>
      <HeroUIProvider navigate={router.push}>
        <ActivityTracker />
        {children}
      </HeroUIProvider>
    </AuthProvider>
  );
}
