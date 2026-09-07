'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

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

  const logout = useCallback(async () => {
    clear();
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, signup, logout }),
    [user?.id, token, isLoading, login, signup, logout]
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
