"use client";

export default function QuestlyLogo({
  className = "",
  size = 32,
  variant = "light",
}: {
  className?: string;
  size?: number;
  variant?: "light" | "dark";
}) {
  const accent = "hsl(262, 72%, 55%)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="2" y="2" width="44" height="44" rx="14" fill={accent} />
      <circle
        cx="24"
        cy="20"
        r="7"
        stroke="white"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M24 27v2M24 31v2"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M17 36 Q24 42 31 36"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function QuestlyWordmark({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const textColor = variant === "light" ? "text-foreground" : "text-white";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <QuestlyLogo size={32} variant={variant} />
      <span className={`text-xl font-bold tracking-tight ${textColor}`}>
        Questly
      </span>
    </div>
  );
}
