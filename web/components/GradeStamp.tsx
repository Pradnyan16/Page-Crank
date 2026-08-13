'use client';

/**
 * GradeStamp.tsx — Rubber-stamp grade indicator
 *
 * WHY: The stamp metaphor fits a benchmarking publication — it's an
 * editorial verdict, not a UI badge. The Framer Motion spring "thud"
 * replicates ink-on-paper impact without being gratuitous. One signature
 * animation moment, done well, instead of animations everywhere.
 *
 * mix-blend-mode: multiply (via .grade-stamp CSS class) makes the stamp
 * colour bleed into the paper texture beneath — physical, not digital.
 */

import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { GradeResult } from '@/lib/types';

interface GradeStampProps {
  grade: GradeResult;
  size?: 'sm' | 'md' | 'lg';
  /** If true, stamp animates in on mount */
  animate?: boolean;
  /** aria-label override for screen readers */
  label?: string;
}

const SIZES = {
  sm: { outer: 'w-14 h-14', text: 'text-xl',  border: 'border-2', meta: 'text-[14px]' },
  md: { outer: 'w-20 h-20', text: 'text-3xl', border: 'border-2', meta: 'text-[15px]' },
  lg: { outer: 'w-28 h-28', text: 'text-5xl', border: 'border-3', meta: 'text-xs'    },
};

const COLOUR_MAP: Record<string, string> = {
  ledger: 'text-ledger border-ledger',
  brass:  'text-brass  border-brass',
  rust:   'text-rust   border-rust',
};

export default function GradeStamp({
  grade,
  size = 'md',
  animate = false,
  label,
}: GradeStampProps) {
  const prefersReduced = useReducedMotion();
  const sz = SIZES[size];
  const colourClass = COLOUR_MAP[grade.colour] ?? COLOUR_MAP['brass']!;

  // Spring "thud" — heavier spring means more physical impact feel.
  // Disabled entirely for prefers-reduced-motion users (static end-state only).
  const normalVariants: Variants = {
    hidden: { opacity: 0, scale: 1.6, rotate: -12 },
    visible: {
      opacity: 0.85,
      scale: 1,
      rotate: -6,
      transition: { type: 'spring' as const, stiffness: 400, damping: 18, mass: 1.2 },
    },
  };

  const reducedVariants: Variants = {
    hidden: { opacity: 0, scale: 1.6, rotate: -12 },
    visible: { opacity: 0.85, scale: 1, rotate: -6, transition: { duration: 0 } },
  };

  const variants = prefersReduced ? reducedVariants : normalVariants;

  return (
    <motion.div
      className={`
        grade-stamp relative ${sz.outer} rounded-full ${sz.border}
        border-double ${colourClass} flex flex-col items-center justify-center
        select-none shrink-0
      `}
      style={{ opacity: 0.85 }}
      initial={animate ? 'hidden' : 'visible'}
      animate="visible"
      variants={variants}
      aria-label={label ?? `Grade ${grade.letter}: ${grade.verdict}, score ${grade.score}`}
      role="img"
    >
      <span className={`font-display ${sz.text} leading-none`}>{grade.letter}</span>
      <span className={`font-mono ${sz.meta} uppercase tracking-widest mt-0.5 opacity-80`}>
        {grade.score}
      </span>
    </motion.div>
  );
}
