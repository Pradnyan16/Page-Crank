'use client';

/**
 * PillarBar.tsx — Animated pillar score bar with count-up
 *
 * WHY: The horizontal bar with a count-up number communicates both magnitude
 * (bar width) and precision (number) simultaneously. The whileInView trigger
 * means the animation only fires when the reader scrolls to the data —
 * not on page load where it would be wasted. Count-up settles in ≤1.5s.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';

interface PillarBarProps {
  label: string;
  score: number;
  colour: 'ledger' | 'brass' | 'rust';
  /** Delay before animation starts (stagger between pillars) */
  delay?: number;
}

const BAR_COLOUR: Record<string, string> = {
  ledger: 'bg-ledger',
  brass:  'bg-brass',
  rust:   'bg-rust',
};

const LABEL_COLOUR: Record<string, string> = {
  ledger: 'text-ledger',
  brass:  'text-brass',
  rust:   'text-rust',
};

function useCountUp(target: number, duration: number, active: boolean, reducedMotion: boolean) {
  const [value, setValue] = useState(reducedMotion ? target : 0);

  useEffect(() => {
    if (!active || reducedMotion) { setValue(target); return; }
    const steps = 40; // ~1.5s at 60fps divided into 40 steps ≈ 37ms each
    const increment = target / steps;
    let current = 0;
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      current = Math.min(Math.round(increment * frame), target);
      setValue(current);
      if (current >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration, active, reducedMotion]);

  return value;
}

export default function PillarBar({ label, score, colour, delay = 0 }: PillarBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion() ?? false;
  // Fire when at least 30% of this element enters viewport
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [isInView, delay]);

  const displayValue = useCountUp(score, 1400, started, prefersReduced);
  const barColour = BAR_COLOUR[colour] ?? BAR_COLOUR['brass']!;
  const labelColour = LABEL_COLOUR[colour] ?? LABEL_COLOUR['brass']!;

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="font-mono text-xs uppercase tracking-widest text-inkSoft">{label}</span>
        <span className={`font-mono text-sm font-bold ${labelColour}`}>{typeof displayValue === 'number' ? Number(displayValue.toFixed(2)) : displayValue}</span>
      </div>
      <div className="h-2 bg-paperDark border border-ink/10 overflow-hidden">
        <motion.div
          className={`h-full ${barColour} origin-left`}
          initial={{ scaleX: 0 }}
          animate={started ? { scaleX: score / 100 } : { scaleX: 0 }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { delay: 0, duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }
          }
        />
      </div>
    </div>
  );
}
