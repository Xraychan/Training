'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Shield, Eye, EyeOff, CheckCircle, XCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import { checkPasswordStrength, PasswordStrengthMeter } from '@/lib/password-strength';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = checkPasswordStrength(password);

  useEffect(() => {
    if (!token) { setValidating(false); return; }
    fetch(`/api/auth/validate-token?token=${token}`)
      .then(r => { setTokenValid(r.ok); })
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!strength.isValid) {
      setError('Password does not meet the requirements below.');
      return;
    }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push('/'), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Reset failed. The link may have expired.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-[#141414] tracking-tight">Set New Password</h1>
          <p className="text-[#141414]/60 text-sm italic serif mt-1">Choose a strong password for your account.</p>
        </div>

        {validating && (
          <div className="text-center py-8 text-sm font-bold text-[#141414]/60 animate-pulse">
            Validating reset link…
          </div>
        )}

        {!validating && !tokenValid && (
          <div className="text-center space-y-4">
            <XCircle size={48} className="mx-auto text-red-500" />
            <p className="font-bold text-[#141414]">Link Expired or Invalid</p>
            <p className="text-sm text-[#141414]/60">
              This reset link is no longer valid. Please request a new one.
            </p>
            <Link href="/forgot-password" className="inline-block mt-4 bg-[#141414] text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors text-xs">
              Request New Link
            </Link>
          </div>
        )}

        {!validating && tokenValid && !done && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full p-3 pr-12 bg-transparent border-b-2 border-[#141414] focus:outline-none focus:border-[#F27D26] transition-colors"
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141414]/40 hover:text-[#141414]">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} show={!!password} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">
                Confirm Password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className={`w-full p-3 bg-transparent border-b-2 transition-colors focus:outline-none ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-[#141414] focus:border-[#F27D26]'
                }`}
                required
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-500 font-semibold mt-1">Passwords do not match.</p>
              )}
            </div>
            {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !strength.isValid || password !== confirmPassword}
              className="w-full bg-[#141414] text-white p-4 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Lock size={18} />
              {submitting ? 'Saving…' : 'Set New Password'}
            </button>
          </form>
        )}

        {done && (
          <div className="text-center space-y-4">
            <CheckCircle size={56} className="mx-auto text-green-500" />
            <p className="font-bold text-[#141414] text-lg">Password Updated!</p>
            <p className="text-sm text-[#141414]/60">Redirecting to login…</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[#141414]/10 text-center">
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-[#141414]/40 hover:text-[#F27D26] transition-colors">
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center">Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
