export function LogoMark({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`inline-flex shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {/* The original Quizmi brand image, not a redrawn glyph. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="QUIZMI"
        width={size}
        height={size}
        className="h-full w-full rounded-lg object-contain"
      />
    </span>
  );
}

export function Wordmark() {
  return (
    <span className="text-[13px] font-semibold tracking-wide uppercase text-muted-foreground">QUIZMI</span>
  );
}

export function Brand({
  showName = true,
  wrapperClassName,
  markClassName,
}: {
  showName?: boolean;
  wrapperClassName?: string;
  markClassName?: string;
} = {}) {
  return (
    <div className={wrapperClassName ?? "flex items-center gap-2"}>
      <LogoMark className={markClassName} />
      {showName && <Wordmark />}
    </div>
  );
}

/** Full-screen loading state: a plain spinner, deliberately independent of the logo. */
export function BrandLoader({ message }: { message: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-background/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <svg className="h-14 w-14 animate-spin" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

export default Brand;
