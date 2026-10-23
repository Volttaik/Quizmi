"use client";

export default function QuizmiLogo({
  className = "",
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo.png"
        alt="QUIZMI"
        width={size}
        height={size}
        className="rounded-lg w-full h-full"
      />
    </div>
  );
}

export function QuizmiWordmark({
  variant = "light",
  className = "",
  size = 36,
}: {
  variant?: "light" | "dark";
  className?: string;
  size?: number;
}) {
  const textColor = variant === "light" ? "text-foreground" : "text-white";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <QuizmiLogo size={size} />
      <span
        className={`text-base font-extrabold uppercase leading-none tracking-[0.14em] ${textColor}`}
      >
        QUIZMI
      </span>
    </div>
  );
}
