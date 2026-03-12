'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { LogIn, Shield, User as UserIcon, ClipboardCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
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
          <p className="text-[#141414]/60 text-sm italic serif">Training & Assessment Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#141414] text-white p-4 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Enter Portal
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-[#141414]/10">
          <p className="text-[10px] uppercase tracking-widest text-[#141414]/40 font-bold mb-4">
            Available Demo Accounts:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { email: 'admin@example.com', role: 'Super Admin', icon: Shield },
              { email: 'assessor@example.com', role: 'Assessor', icon: ClipboardCheck },
              { email: 'staff@example.com', role: 'Staff', icon: UserIcon },
            ].map((demo) => (
              <button
                key={demo.email}
                onClick={() => setEmail(demo.email)}
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
