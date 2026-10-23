import type { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClasses =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-primary/10 text-primary";

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses}`}>
        <Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
      </div>
      <p className="text-2xl font-extrabold leading-none text-card-foreground">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
