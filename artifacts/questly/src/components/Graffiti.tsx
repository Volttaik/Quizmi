"use client";

import { motion } from "framer-motion";

const words = ["Nice!", "Yes!", "Brilliant!", "Spot on!", "Nailed it!", "Smart!"];
const stars = [
  { x: "4%", y: "6%", r: -14, s: 1 },
  { x: "90%", y: "2%", r: 18, s: 0.8 },
  { x: "94%", y: "72%", r: -8, s: 1.05 },
  { x: "1%", y: "82%", r: 12, s: 0.7 },
];
// Little "spray paint" dots bursting outward from the answers.
const dots = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  return {
    dx: Math.cos(a) * (70 + (i % 3) * 22),
    dy: Math.sin(a) * (40 + (i % 2) * 18),
    c: i % 3 === 0 ? "--success" : i % 3 === 1 ? "--accent" : "--chart-5",
    size: 5 + (i % 3) * 2,
  };
});

/** Lumio's signature correct-answer celebration. Decorative only. */
export default function Graffiti({ seed }: { seed: number }) {
  const word = words[seed % words.length];
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
        {dots.map((d, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ width: d.size, height: d.size, background: `hsl(var(${d.c}))` }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: d.dx * 2.2, y: d.dy * 2.2, opacity: [0, 1, 0], scale: [0.4, 1, 0.6] }}
            transition={{ duration: 0.9, delay: 0.05 + (i % 4) * 0.03, ease: "easeOut" }}
          />
        ))}
      </div>
      {stars.map((st, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute h-7 w-7"
          style={{ left: st.x, top: st.y }}
          initial={{ scale: 0, rotate: st.r - 40, opacity: 0 }}
          animate={{ scale: [0, st.s * 1.3, st.s], rotate: st.r, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, delay: 0.1 + i * 0.07 }}
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
