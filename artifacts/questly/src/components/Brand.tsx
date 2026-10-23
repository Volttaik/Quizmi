"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Quizmi mark, drawn with the same construction as Lumio's: a rounded tile with
 * the glyph inside, followed by a serif wordmark closed with an accent period.
 */
export function QuizmiMark({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} aria-hidden>
      <rect width="40" height="40" rx="14" className="fill-primary" />
      {animated && (
        <motion.circle
          cx="20"
          cy="17"
          r="12"
          fill="hsl(var(--accent))"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.35, 0.1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <circle
        cx="20"
        cy="17"
        r="8.4"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="2.6"
      />
      <motion.path
        d="M16.2 17.2 l2.7 2.7 l5.1 -5.4"
        fill="none"
        stroke="hsl(var(--accent))"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={
          animated
            ? { duration: 0.9, repeat: Infinity, repeatType: "reverse", repeatDelay: 0.4 }
            : undefined
        }
      />
      <rect x="16.4" y="29" width="7.2" height="1.9" rx=".95" fill="hsl(var(--primary-foreground))" />
      <rect
        x="17.6"
        y="32"
        width="4.8"
        height="1.9"
        rx=".95"
        fill="hsl(var(--primary-foreground))"
        opacity=".75"
      />
    </svg>
  );
}

export default function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <QuizmiMark className={size === "lg" ? "h-10 w-10" : "h-8 w-8"} />
      <span
        className={cn(
          "font-serif font-semibold tracking-[-0.02em]",
          size === "lg" ? "text-2xl" : "text-lg"
        )}
      >
        quizmi<span className="text-accent">.</span>
      </span>
    </motion.span>
  );
}

/** Full-screen brand loader, matching Lumio's bulb loader geometry. */
export function QuizmiLoader({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 96 96" aria-hidden>
          <circle cx="48" cy="48" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <motion.circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="70 207"
            style={{ transformOrigin: "48px 48px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </svg>
        <QuizmiMark className="h-14 w-14" animated />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </motion.div>
  );
}
