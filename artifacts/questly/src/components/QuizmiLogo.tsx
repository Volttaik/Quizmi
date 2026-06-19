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
        alt="Quizmi"
        width={size}
        height={size}
        className="rounded-xl object-cover w-full h-full"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        className="absolute inset-0 rounded-xl items-center justify-center text-white font-black text-center"
        style={{
          background: "linear-gradient(135deg, hsl(262,72%,55%) 0%, hsl(270,72%,40%) 100%)",
          fontSize: size * 0.45,
          display: "none",
        }}
      >
        Q
      </div>
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
