'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { store, hashPassword } from './store';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed) setUser(parsed);
      }
    } catch (e) {
      console.error('Failed to load auth state', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setUser(data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return { success: true };
    } catch (e) {
      console.error('Login attempt failed', e);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    // For a complete logout, we should also clear the cookie on the server
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
