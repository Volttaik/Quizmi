"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export const ease = [0.4, 0, 0.2, 1] as const;

/**
 * Calm 180ms fade between pages — the same timing Lumio uses.
 *
 * Keying a plain `motion.div` on the pathname keeps the incoming page fading in
 * without ever gating rendering on an animation finishing, so a slow route
 * payload can never leave a blank screen.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease }}
    >
      {children}
    </motion.div>
  );
}

/** Alias kept so ported page code reads the same as the reference. */
export function PageTurn({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease }}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(delay, 0.2), ease }}
    >
      {children}
    </motion.div>
  );
}
