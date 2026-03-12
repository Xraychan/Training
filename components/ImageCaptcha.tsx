'use client';

import { useState, useCallback } from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── CAPTCHA Dataset ─────────────────────────────────────────────────────────
// Each category has 6 items represented as emoji + label
const CATEGORIES = [
  {
    name: 'medical equipment',
    emoji: '🩺',
    items: ['🩺', '💉', '🩹', '🩻', '🔬', '💊'],
    labels: ['Stethoscope', 'Syringe', 'Bandage', 'X-Ray', 'Microscope', 'Pill'],
  },
  {
    name: 'vehicles',
    emoji: '🚗',
    items: ['🚗', '🚕', '🚌', '🚑', '✈️', '🚢'],
    labels: ['Car', 'Taxi', 'Bus', 'Ambulance', 'Airplane', 'Ship'],
  },
  {
    name: 'animals',
    emoji: '🐶',
    items: ['🐶', '🐱', '🐭', '🐸', '🦁', '🐺'],
    labels: ['Dog', 'Cat', 'Mouse', 'Frog', 'Lion', 'Wolf'],
  },
  {
    name: 'nature',
    emoji: '🌿',
    items: ['🌿', '🌸', '🌻', '🍎', '🍋', '🌵'],
    labels: ['Leaf', 'Flower', 'Sunflower', 'Apple', 'Lemon', 'Cactus'],
  },
  {
    name: 'buildings',
    emoji: '🏥',
    items: ['🏥', '🏫', '🏦', '🏰', '⛪', '🕌'],
    labels: ['Hospital', 'School', 'Bank', 'Castle', 'Church', 'Mosque'],
  },
];

interface CaptchaItem {
  emoji: string;
  label: string;
  isTarget: boolean;
}

function generateChallenge() {
  // Pick a random category as the "target"
  const targetCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  // Pick a different category for distractors
  const distractorCat = CATEGORIES.find(c => c.name !== targetCat.name)!;

  // Pick 3 random targets from targetCat
  const shuffledTargets = [...targetCat.items.map((e, i) => ({ emoji: e, label: targetCat.labels[i] }))]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  // Pick 6 random distractors from remaining categories
  const allDistractors = CATEGORIES
    .filter(c => c.name !== targetCat.name)
    .flatMap(c => c.items.map((e, i) => ({ emoji: e, label: c.labels[i] })))
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  // Mix 3 targets into 9 total slots
  const grid: CaptchaItem[] = [
    ...shuffledTargets.map(t => ({ ...t, isTarget: true })),
    ...allDistractors.slice(0, 6).map(d => ({ ...d, isTarget: false })),
  ].sort(() => Math.random() - 0.5);

  return { grid, targetName: targetCat.name, targetEmoji: targetCat.emoji };
}

interface ImageCaptchaProps {
  onVerified: () => void;
}

export default function ImageCaptcha({ onVerified }: ImageCaptchaProps) {
  const [challenge, setChallenge] = useState(() => generateChallenge());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);

  const refresh = useCallback(() => {
    setChallenge(generateChallenge());
    setSelected(new Set());
    setError('');
    setVerified(false);
  }, []);

  const toggle = (idx: number) => {
    if (verified) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    setError('');
  };

  const verify = () => {
    const correctIndices = new Set(
      challenge.grid.map((item, idx) => item.isTarget ? idx : -1).filter(i => i !== -1)
    );
    const isCorrect =
      [...correctIndices].every(i => selected.has(i)) &&
      [...selected].every(i => correctIndices.has(i));

    if (isCorrect) {
      setVerified(true);
      setTimeout(() => onVerified(), 600);
    } else {
      setError('Incorrect selection. Please try again.');
      setSelected(new Set());
      setTimeout(() => refresh(), 1200);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-[#141414]/5 border border-[#141414]/10 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-0.5">Security Check</p>
            <p className="text-sm font-bold text-[#141414]">
              Select all images showing{' '}
              <span className="text-[#F27D26]">{challenge.targetName}</span>{' '}
              {challenge.targetEmoji}
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="p-2 text-[#141414]/30 hover:text-[#141414] hover:bg-white rounded transition-all"
            title="New challenge"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-2">
          {challenge.grid.map((item, idx) => {
            const isSelected = selected.has(idx);
            const isCorrect = verified && item.isTarget;
            return (
              <motion.button
                key={idx}
                type="button"
                onClick={() => toggle(idx)}
                whileTap={{ scale: 0.95 }}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border-2 transition-all text-3xl
                  ${isCorrect ? 'border-green-500 bg-green-50' :
                    isSelected ? 'border-[#F27D26] bg-[#F27D26]/10' :
                    'border-[#141414]/10 bg-white hover:border-[#141414]/30'}`}
              >
                {item.emoji}
                <span className="text-[9px] font-bold uppercase tracking-tight text-[#141414]/40">{item.label}</span>
                {isSelected && !verified && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#F27D26] flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">✓</span>
                  </div>
                )}
                {isCorrect && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">✓</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between gap-3">
          {error ? (
            <p className="text-xs text-red-600 font-semibold">{error}</p>
          ) : verified ? (
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <CheckCircle size={14} /> Verified!
            </p>
          ) : (
            <p className="text-xs text-[#141414]/40">Click all matching images, then verify.</p>
          )}
          <button
            type="button"
            onClick={verify}
            disabled={selected.size === 0 || verified}
            className="px-4 py-2 bg-[#141414] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
