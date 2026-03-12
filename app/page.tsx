'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { LogIn, Shield, User as UserIcon, ClipboardCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) setError(result.error || 'Login failed.');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Certify123!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#141414] text-white flex items-center justify-center rounded-full mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#141414] tracking-tight">CertifyPro</h1>
          <p className="text-[#141414]/60 text-sm italic serif">Training &amp; Assessment Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@example.com"
              className="w-full p-3 bg-transparent border-b-2 border-[#141414] focus:outline-none focus:border-[#F27D26] transition-colors font-mono"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full p-3 pr-12 bg-transparent border-b-2 border-[#141414] focus:outline-none focus:border-[#F27D26] transition-colors"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141414]/40 hover:text-[#141414] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#141414] text-white p-4 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn size={18} />
            {isLoading ? 'Signing in...' : 'Enter Portal'}
          </button>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 hover:text-[#F27D26] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-[#141414]/10">
          <p className="text-[10px] uppercase tracking-widest text-[#141414]/40 font-bold mb-4">
            Demo Accounts (password: Certify123!):
          </p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { email: 'admin@example.com', role: 'Super Admin', icon: Shield },
              { email: 'manager@example.com', role: 'Manager', icon: ClipboardCheck },
              { email: 'trainer@example.com', role: 'Trainer', icon: UserIcon },
            ].map((demo) => (
              <button
                key={demo.email}
                onClick={() => fillDemo(demo.email)}
                className="flex items-center gap-3 p-2 hover:bg-[#141414]/5 transition-colors text-left group"
              >
                <demo.icon size={14} className="text-[#141414]/40 group-hover:text-[#F27D26]" />
                <div>
                  <p className="text-xs font-bold text-[#141414]">{demo.role}</p>
                  <p className="text-[10px] text-[#141414]/50 font-mono">{demo.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
