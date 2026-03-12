'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { MOCK_USERS } from './store';

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
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

  const safeStringify = (obj: any) => {
    const cache = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return; // Circular reference found, discard key
        }
        cache.add(value);
      }
      return value;
    });
  };

  const login = (email: string) => {
    const foundUser = MOCK_USERS.find(u => u.email === email);
    if (foundUser) {
      // Create a clean user object to avoid any potential circular references
      const cleanUser: User = {
        id: String(foundUser.id),
        email: String(foundUser.email),
        name: String(foundUser.name),
        role: foundUser.role as UserRole,
        group: foundUser.group ? String(foundUser.group) : undefined,
        departmentId: foundUser.departmentId ? String(foundUser.departmentId) : undefined
      };
      
      setUser(cleanUser);
      
      // Defensive stringify for localStorage
      try {
        localStorage.setItem('auth_user', JSON.stringify(cleanUser));
      } catch (e) {
        console.error('Failed to persist auth state', e);
        // Fallback to safeStringify if needed
        localStorage.setItem('auth_user', safeStringify(cleanUser));
      }
    } else {
      alert('User not found. Try admin@example.com, assessor@example.com, or staff@example.com');
    }
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
