"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * QUIZMI's answer reveal — a marked-paper motif, not graffiti.
 *
 * correct  → an ink "scored" stamp lands on the answer sheet: a double ring
 *            with a check, a short tick-shard burst, and a ruled line drawn
 *            underneath the options.
 * incorrect → an eraser swipe passes over the chosen mark while a small
 *            "revise" tag sketches itself next to the correction. It never
 *            shakes the learner's work.
 *
 * Purely decorative (aria-hidden); the verdict itself is announced by the
 * feedback panel. All motion collapses under `prefers-reduced-motion`.
 */
export default function AnswerReveal({
  variant,
  seed,
}: {
  variant: "correct" | "incorrect";
  seed: number;
}) {
  const reduce = useReducedMotion();
  const correct = variant === "correct";
  const tilt = ((seed % 5) - 2) * 2.5;

  // Eight short "tick" shards arranged on a ring, deterministic per question.
  const shards = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2 + (seed % 3) * 0.2;
    const distance = 46 + (index % 3) * 16;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * 0.62,
      rotate: (angle * 180) / Math.PI,
      delay: 0.04 + (index % 4) * 0.035,
    };
  });

  if (reduce) {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 overflow-visible" aria-hidden>
        <div className="absolute -right-1 -top-7 flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] shadow-sm">
          <span
            className={`h-1.5 w-1.5 rounded-full ${correct ? "bg-success" : "bg-destructive"}`}
          />
          {correct ? "Scored" : "Revise"}
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible" aria-hidden>
      {correct ? (
        <>
          {/* The stamp */}
          <motion.div
            className="absolute -right-2 -top-9"
            initial={{ opacity: 0, scale: 1.5, rotate: tilt - 14 }}
            animate={{ opacity: [0, 1, 1], scale: [1.5, 1, 1], rotate: [tilt - 14, tilt, tilt] }}
            transition={{ duration: 0.42, times: [0, 0.6, 1], ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative flex h-14 w-14 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-[3px] border-success/85" />
              <span className="absolute inset-[3px] rounded-full border border-dashed border-success/55" />
              <svg viewBox="0 0 24 24" className="relative h-6 w-6" fill="none">
                <motion.path
                  d="M5 12.5 10 17.5 19 7"
                  stroke="hsl(var(--success))"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.16 }}
                />
              </svg>
            </div>
          </motion.div>

          {/* Tick shards */}
          {shards.map((shard, index) => (
            <motion.span
              key={index}
              className="absolute left-1/2 top-1/2 rounded-full bg-success/70"
              style={{ width: 3, height: 12 }}
              initial={{ x: 0, y: 0, opacity: 0, rotate: shard.rotate, scaleY: 0.4 }}
              animate={{
                x: shard.x,
                y: shard.y,
                opacity: [0, 0.9, 0],
                rotate: shard.rotate,
                scaleY: [0.4, 1, 0.5],
              }}
              transition={{ duration: 0.7, delay: shard.delay, ease: "easeOut" }}
            />
          ))}

          {/* Ruled line under the options */}
          <motion.span
            className="absolute -bottom-1 left-0 h-[2px] rounded-full bg-success/45"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          />
        </>
      ) : (
        <>
          {/* Eraser swipe across the chosen mark */}
          <motion.span
            className="absolute left-0 top-1/2 h-10 w-full -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
            initial={{ x: "-30%", opacity: 0 }}
            animate={{ x: "30%", opacity: [0, 1, 0] }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          />
          {/* Revise tag */}
          <motion.div
            className="absolute -right-1 -top-8 flex items-center gap-1.5 rounded-full border border-dashed border-destructive/50 bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-destructive shadow-sm"
            initial={{ opacity: 0, y: 4, rotate: tilt }}
            animate={{ opacity: 1, y: 0, rotate: tilt }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
              <motion.path
                d="M4 20l4-1 9-9-3-3-9 9-1 4z"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              />
            </svg>
            Revise
          </motion.div>
        </>
      )}
    </div>
  );
}
