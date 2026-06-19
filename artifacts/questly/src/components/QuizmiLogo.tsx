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
        src="/logo.svg"
        alt="Quizmi"
        width={size}
        height={size}
        className="rounded-xl w-full h-full"
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
    <div className={`flex items-center gap-2.5 ${className}`}>
      <QuizmiLogo size={size} />
      <span className={`text-xl font-extrabold tracking-tight ${textColor}`}>
        Quizmi
      </span>
    </div>
  );
}
