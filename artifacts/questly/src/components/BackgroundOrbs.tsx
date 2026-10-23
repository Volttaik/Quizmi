/**
 * Soft, brand-coloured SVG orbs used as page background decoration — ported
 * from Lumio, including its two arrangements.
 *
 * Rendered as radial-gradient circles (no images, no canvas) so they stay tiny
 * and cheap. The layer is decorative only: `pointer-events-none`, hidden from
 * assistive tech, clipped to its container and painted behind the content.
 *
 * Motion is a plain CSS animation (see `.orb-float-*` in globals.css), so the
 * existing `prefers-reduced-motion` rule disables it for free.
 */
import type { CSSProperties } from "react";

export type OrbVariant = "home" | "quiz";

type Orb = {
  left: string;
  top: string;
  size: number;
  color: string;
  opacity: number;
  float: "slow" | "slower";
  delay: string;
};

const ARRANGEMENTS: Record<OrbVariant, Orb[]> = {
  // Quizmi's decoration stays inside its violet range — accent, plum and
  // indigo — rather than Lumio's coral/mint pairing.
  home: [
    { left: "-8%", top: "-14%", size: 480, color: "hsl(var(--accent))", opacity: 0.22, float: "slow", delay: "0s" },
    { left: "64%", top: "4%", size: 340, color: "hsl(var(--chart-5))", opacity: 0.18, float: "slower", delay: "-6s" },
    { left: "26%", top: "54%", size: 400, color: "hsl(var(--chart-2))", opacity: 0.14, float: "slower", delay: "-12s" },
    { left: "86%", top: "60%", size: 260, color: "hsl(var(--chart-1))", opacity: 0.1, float: "slow", delay: "-3s" },
  ],
  quiz: [
    { left: "-14%", top: "2%", size: 420, color: "hsl(var(--accent))", opacity: 0.14, float: "slow", delay: "-2s" },
    { left: "74%", top: "-8%", size: 360, color: "hsl(var(--chart-5))", opacity: 0.1, float: "slower", delay: "-9s" },
    { left: "82%", top: "58%", size: 440, color: "hsl(var(--accent))", opacity: 0.1, float: "slower", delay: "-5s" },
    { left: "8%", top: "68%", size: 300, color: "hsl(var(--chart-2))", opacity: 0.1, float: "slow", delay: "-14s" },
  ],
};

export default function BackgroundOrbs({
  variant,
  className = "",
}: {
  variant: OrbVariant;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      {ARRANGEMENTS[variant].map((orb, index) => {
        const gradientId = `quizmi-orb-${variant}-${index}`;
        return (
          <svg
            key={gradientId}
            className={`absolute orb-float-${orb.float}`}
            style={
              {
                left: orb.left,
                top: orb.top,
                width: orb.size,
                height: orb.size,
                opacity: orb.opacity,
                animationDelay: orb.delay,
              } as CSSProperties
            }
            viewBox="0 0 200 200"
            focusable="false"
          >
            <defs>
              <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={orb.color} stopOpacity="1" />
                <stop offset="65%" stopColor={orb.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={orb.color} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="100" fill={`url(#${gradientId})`} />
          </svg>
        );
      })}
    </div>
  );
}
