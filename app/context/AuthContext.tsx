'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

// --- Types --------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'teacher' | 'admin';
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

// --- Context ------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Token helpers --------------------------------------------------------
  // NOTE: btoa/atob is NOT encryption \u2014 it's light obfuscation only.
  // For a production app, use httpOnly cookies to protect JWTs from XSS.
  // Rehydrate from localStorage
  useEffect(() => {
    try {
      let tok = localStorage.getItem('teachai-token');
      const usrRaw = localStorage.getItem('teachai-user');
      
      // Migration check: if the token is base64 encoded (from our previous turn), 
      // it might fail. If it doesn't start with "ey" (standard JWT prefix), 
      // we force a logout and clear it to be safe.
      if (tok && !tok.startsWith('ey')) {
        console.warn('Legacy encoded token detected. Clearing session.');
        localStorage.removeItem('teachai-token');
        localStorage.removeItem('teachai-user');
        tok = null;
      }

      if (tok && usrRaw) { 
        setToken(tok); 
        setUser(JSON.parse(usrRaw)); 
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = (tok: string, u: AuthUser) => {
    localStorage.setItem('teachai-token', tok);
    localStorage.setItem('teachai-user', JSON.stringify(u));
    setToken(tok); 
    setUser(u);
  };

  const clear = () => {
    localStorage.removeItem('teachai-token');
    localStorage.removeItem('teachai-user');
    setToken(null); 
    setUser(null);
  };

  // -- Email / password ------------------------------------------------------

  const login = useCallback(async (email: string, password: string) => {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message ?? 'Login failed');
    persist(data.accessToken, data.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message ?? 'Registration failed');
    persist(data.accessToken, data.user);
  }, []);

  // -- Google ----------------------------------------------------------------

  const loginWithGoogle = useCallback(async () => {
    console.log('Starting loginWithGoogle process...');
    try {
      // 1. Sign in with Google popup via Firebase SDK
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Firebase popup success for:', result.user.email);
      
      // 2. Extract tokens
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleAccessToken = credential?.accessToken; // Google API token (Drive)
      const firebaseIdToken = await result.user.getIdToken(); // Firebase Auth token
      
      if (!googleAccessToken) {
        console.warn('Warning: Google Access Token (for Drive) was not returned by the provider.');
      }

      // 3. EXCHANGE: Send Firebase ID token to our backend — get back our own custom JWT
      console.log('Exchanging Firebase token for Backend JWT at:', `${API}/auth/google`);
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseIdToken }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Backend token exchange failed:', errorData);
        throw new Error(errorData.message ?? `Backend sync failed (${res.status})`);
      }

      const data = await res.json();
      console.log('Backend sync success. New JWT issued.');

      // 4. Persistence
      if (googleAccessToken) {
        localStorage.setItem('teachai-google-token', googleAccessToken);
      }
      
      // Store the backend's custom JWT as our primary token
      persist(data.accessToken, data.user);
    } catch (error: any) {
      console.error('Google sign-in flow error:', error);
      throw error;
    }
  }, [persist]);

  // -- Logout ----------------------------------------------------------------

  const logout = useCallback(async () => {
    try { await firebaseSignOut(auth); } catch { /* ignore */ }
    clear();
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, signup, loginWithGoogle, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, token, isLoading] // only re-render consumers when user ID, token, or loading changes
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
