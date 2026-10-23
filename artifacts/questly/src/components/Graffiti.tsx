"use client";

import { motion, useReducedMotion } from "framer-motion";

const WORDS = ["Nice!", "Yes!", "Brilliant!", "Spot on!", "Nailed it!", "Sharp!"];
const STARS = [
  { x: "4%", y: "6%", r: -14, s: 1 },
  { x: "90%", y: "2%", r: 18, s: 0.8 },
  { x: "94%", y: "72%", r: -8, s: 1.05 },
  { x: "1%", y: "82%", r: 12, s: 0.7 },
];
// Little "spray paint" dots bursting outward from the chosen answer.
const DOTS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  return {
    dx: Math.cos(angle) * (70 + (i % 3) * 22),
    dy: Math.sin(angle) * (40 + (i % 2) * 18),
    c: i % 3 === 0 ? "--success" : i % 3 === 1 ? "--accent" : "--chart-5",
    size: 5 + (i % 3) * 2,
  };
});

/**
 * QUIZMI's correct-answer celebration: hand-drawn scribbles, spray dots and a
 * tagged word that burst onto the question and fade themselves away again.
 * Decorative only (`aria-hidden`), rendered next to the AnswerReveal stamp —
 * never instead of it. Motion collapses completely under
 * `prefers-reduced-motion`, where the AnswerReveal badge already reports the
 * verdict.
 */
export default function Graffiti({ seed }: { seed: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  const word = WORDS[seed % WORDS.length];
  const draw = (delay: number) => ({
    initial: { pathLength: 0, opacity: 1 },
    animate: { pathLength: 1, opacity: [1, 1, 0] },
    transition: { duration: 1.5, delay, times: [0, 0.75, 1] },
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible" aria-hidden>
      {/* scribbled swoosh + zigzag, top-left */}
      <svg className="absolute -left-3 -top-8 h-16 w-40 sm:-left-6" viewBox="0 0 160 64">
        <motion.path
          d="M6 48 C 30 14, 58 12, 70 34 S 112 58, 152 20"
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth={6}
          strokeLinecap="round"
          {...draw(0)}
        />
        <motion.path
          d="M18 20 l10 14 l10 -16 l10 14"
          fill="none"
          stroke="hsl(var(--success))"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...draw(0.12)}
        />
      </svg>
      {/* hand-drawn loop bottom-right */}
      <svg className="absolute -bottom-6 right-0 h-12 w-32" viewBox="0 0 128 48">
        <motion.path
          d="M4 30 C 40 44, 90 44, 120 22 C 126 16, 112 8, 100 18 C 92 26, 110 36, 124 30"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={3.5}
          strokeLinecap="round"
          {...draw(0.2)}
        />
      </svg>
      {/* spray dots */}
      <div className="absolute left-1/2 top-1/2">
        {DOTS.map((dot, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full"
            style={{ width: dot.size, height: dot.size, background: `hsl(var(${dot.c}))` }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: dot.dx * 2.2, y: dot.dy * 2.2, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
            transition={{ duration: 0.9, delay: 0.05 + (index % 4) * 0.03, ease: "easeOut" }}
          />
        ))}
      </div>
      {STARS.map((star, index) => (
        <motion.svg
          key={index}
          viewBox="0 0 24 24"
          className="absolute h-7 w-7"
          style={{ left: star.x, top: star.y }}
          initial={{ scale: 0, rotate: star.r - 40, opacity: 0 }}
          animate={{ scale: [0, star.s * 1.3, star.s], rotate: star.r, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, delay: 0.1 + index * 0.07 }}
        >
          <path
            d="M12 2l2.6 6.8L22 9.6l-5.6 4.8L18 22l-6-3.8L6 22l1.6-7.6L2 9.6l7.4-.8z"
            fill="hsl(var(--accent))"
            stroke="hsl(var(--primary))"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </motion.svg>
      ))}
      {/* tagged word with underline */}
      <motion.div
        className="absolute -top-11 right-2 sm:right-6"
        initial={{ opacity: 0, scale: 0.4, rotate: -16 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.4, 1.15, 1, 1],
          rotate: [-16, -6, -8, -8],
        }}
        transition={{ duration: 1.6, times: [0, 0.2, 0.8, 1] }}
      >
        <span className="font-hand text-4xl text-success drop-shadow-sm">{word}</span>
        <svg className="-mt-1 h-3 w-full" viewBox="0 0 100 12" preserveAspectRatio="none">
          <motion.path
            d="M2 8 C 30 2, 70 2, 98 7"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth={4}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          />
        </svg>
      </motion.div>
    </div>
  );
}
