"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Quizmi's real mark — the shipped `/logo.svg` tile, not a redrawn glyph — so
 * the header, loader and auth screens all show the same asset.
 */
export function QuizmiMark({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex h-8 w-8 shrink-0", className)}>
      {animated && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-[30%] bg-accent/45 blur-md"
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt=""
        aria-hidden
        className="relative h-full w-full rounded-[28%] object-contain"
      />
    </span>
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
          "font-extrabold uppercase leading-none tracking-[0.14em]",
          size === "lg" ? "text-xl" : "text-[15px]"
        )}
      >
        QUIZMI
      </span>
    </motion.span>
  );
}

/** Full-screen brand loader, using the same ring geometry as Lumio's. */
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
