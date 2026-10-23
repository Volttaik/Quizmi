export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "Untimed";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr${hours > 1 ? "s" : ""}` : `${hours} hr ${rest} min`;
}

export function formatPrice(priceKobo: number, currency = "NGN"): string {
  if (!priceKobo || priceKobo <= 0) return "Free";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: priceKobo % 100 === 0 ? 0 : 2,
    }).format(priceKobo / 100);
  } catch {
    return `${(priceKobo / 100).toLocaleString()} ${currency}`;
  }
}

export function formatTimeTaken(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (mins < 60) return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

export function formatCountdown(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FORMAT.format(date);
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86_400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604_800) return `${Math.floor(diffSeconds / 86_400)}d ago`;
  return formatDate(iso);
}

export function difficultyStyle(difficulty: string): { label: string; className: string } {
  switch (difficulty) {
    case "easy":
      return {
        label: "Easy",
        className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      };
    case "hard":
      return {
        label: "Hard",
        className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
      };
    default:
      return {
        label: "Medium",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      };
  }
}

export function scoreTone(percentage: number): "good" | "ok" | "poor" {
  if (percentage >= 70) return "good";
  if (percentage >= 50) return "ok";
  return "poor";
}

export function scoreClasses(percentage: number): string {
  const tone = scoreTone(percentage);
  if (tone === "good") return "text-emerald-600 dark:text-emerald-400";
  if (tone === "ok") return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}
