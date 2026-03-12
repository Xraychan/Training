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
    const foundUser = store.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!foundUser) {
      return { success: false, error: 'No account found with that email address.' };
    }

    const inputHash = await hashPassword(password);
    if (foundUser.passwordHash && foundUser.passwordHash !== inputHash) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    // If user has no password set yet (legacy), allow login and set hash
    if (!foundUser.passwordHash) {
      store.updateUserPassword(foundUser.id, inputHash);
    }

    const cleanUser: User = {
      id: String(foundUser.id),
      email: String(foundUser.email),
      name: String(foundUser.name),
      role: foundUser.role as UserRole,
      groupId: foundUser.groupId ? String(foundUser.groupId) : undefined,
      departmentId: foundUser.departmentId ? String(foundUser.departmentId) : undefined,
    };

    setUser(cleanUser);
    try {
      localStorage.setItem('auth_user', JSON.stringify(cleanUser));
    } catch (e) {
      console.error('Failed to persist auth state', e);
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
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
