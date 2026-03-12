'use client';

// Password strength validation utility — shared across all password inputs

export interface PasswordStrength {
  hasMinLength: boolean;   // ≥ 8 chars
  hasUppercase: boolean;   // A-Z
  hasLowercase: boolean;   // a-z
  hasNumber: boolean;      // 0-9
  isValid: boolean;        // all four pass
  score: number;           // 0-4 (number of rules passed)
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const score = [hasMinLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;
  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber,
    score,
  };
}

// ─── React Component ─────────────────────────────────────────────────────────
import { Check, X } from 'lucide-react';

interface Props { password: string; show?: boolean; }

export function PasswordStrengthMeter({ password, show = true }: Props) {
  if (!show || !password) return null;
  const s = checkPasswordStrength(password);

  const barColor = (minScore: number) => {
    if (s.score < minScore) return 'bg-[#141414]/10';
    if (s.score === 1) return 'bg-red-400';
    if (s.score === 2) return 'bg-orange-400';
    if (s.score === 3) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const label = s.score === 0 ? '' : s.score === 1 ? 'Weak' : s.score === 2 ? 'Fair' : s.score === 3 ? 'Good' : 'Strong';
  const labelColor = s.score === 1 ? 'text-red-500' : s.score === 2 ? 'text-orange-500' : s.score === 3 ? 'text-yellow-600' : 'text-green-600';

  const Rule = ({ ok, text }: { ok: boolean; text: string }) => (
    <span className={`flex items-center gap-1 text-[10px] font-bold ${ok ? 'text-green-600' : 'text-[#141414]/40'}`}>
      {ok ? <Check size={10} /> : <X size={10} />} {text}
    </span>
  );

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${barColor(i)}`} />
        ))}
        {label && <span className={`text-[10px] font-bold ml-1 ${labelColor}`}>{label}</span>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
        <Rule ok={s.hasMinLength} text="8+ chars" />
        <Rule ok={s.hasUppercase} text="Uppercase" />
        <Rule ok={s.hasLowercase} text="Lowercase" />
        <Rule ok={s.hasNumber} text="Number" />
      </div>
    </div>
  );
}
