"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  History,
  PlayCircle,
  Target,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  difficultyStyle,
  formatDate,
  formatRelative,
  formatTimeTaken,
  scoreClasses,
} from "@/lib/format";
import type { Analytics, HistoryItem } from "@/lib/types";

// Charts are only needed once history exists, so keep recharts out of the initial bundle.
const ScoreTrendChart = dynamic(() => import("@/components/ScoreTrendChart"), {
  ssr: false,
  loading: () => <div className="skeleton h-48 rounded-xl" />,
});

type Filter = "all" | "passed" | "failed";

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      fetch("/api/attempts").then(async (response) => {
        if (response.status === 401) {
          router.replace("/sign-in?redirect_url=/history");
          return null;
        }
        if (!response.ok) throw new Error("Could not load your history");
        return (await response.json()) as { items: HistoryItem[] };
      }),
      fetch("/api/analytics").then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as Analytics;
      }),
    ])
      .then(([historyData, analyticsData]) => {
        if (!active) return;
        setItems(Array.isArray(historyData?.items) ? historyData.items : []);
        setAnalytics(analyticsData);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load your history");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const filtered = useMemo(() => {
    if (filter === "passed") return items.filter((item) => item.passed);
    if (filter === "failed") return items.filter((item) => !item.passed);
    return items;
  }, [items, filter]);

  const completed = items.filter((item) => item.status !== "in_progress");
  const chartData = useMemo(
    () =>
      (analytics?.trend ?? []).map((point, index) => ({
        attempt: index + 1,
        percentage: point.percentage,
        date: point.date ? formatDate(point.date) : "",
      })),
    [analytics]
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Progress</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Attempt history
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every assessment you have taken, with scores and timing.
          </p>
        </div>

        {loading ? (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton h-24 rounded-2xl" />
              ))}
            </div>
            <div className="skeleton h-56 rounded-2xl" />
            <div className="skeleton h-72 rounded-2xl" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: History, label: "Attempts", value: analytics?.completedAttempts ?? 0 },
                { icon: BarChart3, label: "Average", value: `${analytics?.averagePercentage ?? 0}%` },
                { icon: Target, label: "Pass rate", value: `${analytics?.passRate ?? 0}%` },
                { icon: Clock, label: "Time on exams", value: `${analytics?.totalMinutes ?? 0} min` },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border/70 bg-card p-4">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <p className="mt-2.5 text-xl font-extrabold text-card-foreground">{stat.value}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {chartData.length >= 2 && (
              <section className="mt-6 rounded-2xl border border-border/70 bg-card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-card-foreground">Score trend</h2>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Last {chartData.length} attempts
                  </span>
                </div>
                <div className="mt-4 h-48 w-full">
                  <ScoreTrendChart data={chartData} />
                </div>
              </section>
            )}

            {analytics && analytics.bySubject.length > 0 && (
              <section className="mt-6 rounded-2xl border border-border/70 bg-card p-5">
                <h2 className="text-sm font-extrabold text-card-foreground">By subject</h2>
                <div className="mt-4 space-y-3">
                  {analytics.bySubject.slice(0, 6).map((subject) => (
                    <div key={subject.subject}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground">{subject.subject}</span>
                        <span className="text-muted-foreground">
                          {subject.averagePercentage}% · {subject.attempts} attempt
                          {subject.attempts === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, subject.averagePercentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-extrabold text-foreground">All attempts</h2>
                <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                  {(
                    [
                      { key: "all", label: "All" },
                      { key: "passed", label: "Passed" },
                      { key: "failed", label: "Not passed" },
                    ] as Array<{ key: Filter; label: string }>
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFilter(tab.key)}
                      aria-pressed={filter === tab.key}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        filter === tab.key
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-border/70 bg-card p-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <History className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {completed.length === 0 ? "No attempts yet" : "Nothing matches this filter"}
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    {completed.length === 0
                      ? "Your scores, timing and answer reviews will be saved here."
                      : "Try another filter to see your other attempts."}
                  </p>
                  {completed.length === 0 && (
                    <Link href="/courses" className="mt-4 inline-block">
                      <Button size="sm" className="rounded-full">
                        Browse courses
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mt-4 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card">
                  {filtered.map((item) => {
                    const running = item.status === "in_progress";
                    const terminated = item.status === "terminated";
                    const difficulty = difficultyStyle(item.difficulty);
                    return (
                      <Link
                        key={item.attemptId}
                        href={running ? `/exam/${item.attemptId}` : `/results/${item.attemptId}`}
                        className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
                      >
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                            running
                              ? "bg-primary/10 text-primary"
                              : terminated
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : item.passed
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {running ? (
                            <PlayCircle className="h-5 w-5" />
                          ) : terminated ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : item.passed ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-foreground">
                            {item.courseTitle}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                            <span className={`rounded-full border px-1.5 font-bold ${difficulty.className}`}>
                              {difficulty.label}
                            </span>
                            {item.subject && <span>{item.subject}</span>}
                            {running ? (
                              <span className="font-semibold text-primary">In progress</span>
                            ) : (
                              <>
                                {terminated && (
                                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                                    Terminated
                                  </span>
                                )}
                                <span>
                                  {item.score}/{item.totalMarks} marks
                                </span>
                                <span>· {formatTimeTaken(item.timeTakenSeconds)}</span>
                                <span>· {formatRelative(item.submittedAt)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {running ? (
                          <ArrowRight className="h-4 w-4 text-primary" />
                        ) : (
                          <span className={`text-lg font-extrabold ${scoreClasses(item.percentage)}`}>
                            {item.percentage}%
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
