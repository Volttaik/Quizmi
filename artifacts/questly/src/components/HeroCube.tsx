/**
 * Hero knowledge cube — a decorative CSS-only 3D cube for the homepage hero.
 *
 * It turns one face-step at a time and pauses on each message face, so the
 * copy stays readable while the cube keeps a continuous, gently eased spin.
 * All motion lives in globals.css (compositor transforms only), the brand
 * caps carry no message, and everything freezes on its first readable face
 * under prefers-reduced-motion.
 */
const FACE_MESSAGES = [
  "Acquaint yourself with the real exam",
  "Find your course in seconds",
  "Revise from saved attempts",
  "Watch your scores climb",
] as const;

export default function HeroCube({
  size = 150,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`hero-cube-scene ${className}`}
      style={{ ["--cube-size" as string]: `${size}px` }}
      aria-hidden="true"
    >
      <div className="hero-cube">
        {/* Four message faces — each readable on its pause. */}
        {FACE_MESSAGES.map((message, index) => {
          const side = ["front", "right", "back", "left"][index];
          return (
            <div key={side} className={`hero-cube-face hero-cube-face--${side}`}>
              <span className="font-display text-[10px] font-bold tracking-[0.18em] text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-1 max-w-[9.5rem] text-[13px] font-semibold leading-snug text-foreground">
                {message}
              </p>
            </div>
          );
        })}

        {/* Brand end-caps: violet identity over the paper-dot motif. */}
        <div className="hero-cube-cap hero-cube-cap--top brand-gradient paper-dots" />
        <div className="hero-cube-cap hero-cube-cap--bottom brand-gradient paper-dots" />
      </div>
    </div>
  );
}
