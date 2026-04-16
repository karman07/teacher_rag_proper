'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export interface StudentUser {
  id: string;
  email: string;
  name: string | null;
  role: 'student';
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: StudentUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<StudentUser | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const tok = localStorage.getItem('student-token');
      const usrRaw = localStorage.getItem('student-user');
      if (tok && usrRaw) { 
        setToken(tok); 
        setUser(JSON.parse(usrRaw)); 
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = (tok: string, u: StudentUser) => {
    localStorage.setItem('student-token', tok);
    localStorage.setItem('student-user', JSON.stringify(u));
    setToken(tok); 
    setUser(u);
  };

  const clear = () => {
    localStorage.removeItem('student-token');
    localStorage.removeItem('student-user');
    setToken(null); 
    setUser(null);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/students/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    persist(data.accessToken, data.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch(`${API}/students/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    persist(data.accessToken, data.user);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseIdToken = await result.user.getIdToken();
      
      const res = await fetch(`${API}/students/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseIdToken }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Backend sync failed');
      }

      const data = await res.json();
      persist(data.accessToken, data.user);
    } catch (error: any) {
      console.error('Google sign-in flow error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await firebaseSignOut(auth); } catch { /* ignore */ }
    clear();
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, signup, loginWithGoogle, logout }),
    [user?.id, token, isLoading, login, signup, loginWithGoogle, logout]
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
