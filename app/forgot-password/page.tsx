'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import ImageCaptcha from '@/components/ImageCaptcha';
import { store } from '@/lib/store';

type Step = 'email' | 'captcha' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    if (!email.trim()) { setEmailError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address.'); return; }
    const user = store.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) { setEmailError('No account found with that email address.'); return; }
    setStep('captcha');
  };

  const [devLink, setDevLink] = useState('');

  const handleCaptchaVerified = async () => {
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.devLink) setDevLink(data.devLink);
        setStep('done');
      } else {
        setSendError(data.error || 'Failed to send reset email. Please try again.');
        setStep('captcha');
      }
    } catch {
      setSendError('Network error. Please try again.');
      setStep('captcha');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] p-8"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#141414] text-white flex items-center justify-center rounded-full mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#141414] tracking-tight">Reset Password</h1>
          <p className="text-[#141414]/60 text-sm italic serif text-center mt-1">
            {step === 'email' ? "Enter your email and complete the security check." :
             step === 'captcha' ? "Prove you're human, then we'll send the reset link." :
             "Check your inbox for the reset link."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Email */}
          {step === 'email' && (
            <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full p-3 bg-transparent border-b-2 border-[#141414] focus:outline-none focus:border-[#F27D26] transition-colors font-mono"
                    autoFocus
                    required
                  />
                  {emailError && (
                    <p className="mt-2 text-xs text-red-600 font-semibold">{emailError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#141414] text-white p-4 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center justify-center gap-2"
                >
                  <Mail size={18} />
                  Continue
                </button>
              </form>
            </motion.div>
          )}

          {/* Step 2: CAPTCHA */}
          {step === 'captcha' && (
            <motion.div key="captcha" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {sending && (
                <div className="text-center py-4 text-sm font-bold text-[#141414]/60 animate-pulse">
                  Sending reset email…
                </div>
              )}
              {!sending && (
                <>
                  <ImageCaptcha onVerified={handleCaptchaVerified} />
                  {sendError && (
                    <p className="text-xs text-red-600 font-semibold text-center">{sendError}</p>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle size={56} className="text-green-500" />
              </div>
              {devLink ? (
                // SMTP not configured — show the link directly
                <div className="space-y-3">
                  <p className="font-bold text-[#141414] text-lg">Reset Link Ready</p>
                  <p className="text-xs text-[#141414]/50">
                    Email sending is not configured yet. Use the link below to reset your password:
                  </p>
                  <a
                    href={devLink}
                    className="block w-full py-3 bg-[#141414] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors text-center"
                  >
                    → Click here to reset password
                  </a>
                  <p className="text-[10px] text-[#141414]/30 italic">This link expires in 1 hour.</p>
                </div>
              ) : (
                // Email was sent
                <div>
                  <p className="font-bold text-[#141414] text-lg">Email Sent!</p>
                  <p className="text-sm text-[#141414]/60 mt-1">
                    A reset link was sent to <span className="font-mono font-bold">{email}</span>.{' '}
                    It expires in 1 hour.
                  </p>
                  <p className="text-xs text-[#141414]/40 italic mt-2">Don&apos;t see it? Check your spam folder.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back link */}
        <div className="mt-8 pt-6 border-t border-[#141414]/10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#141414]/40 hover:text-[#F27D26] transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
