"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button, ProgressBar, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import {
  ArrowRight,
  ChartLine,
  CircleCheck,
  CirclePlay,
  CircleXmark,
  Clock,
  ClockArrowRotateLeft,
  TargetDart,
  TriangleExclamation,
} from "@gravity-ui/icons";
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
    [analytics],
  );

  return (
    <div className="bg-background">
      <section className="hero-mesh border-b border-border/60">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Progress</p>
              <h1 className="mt-3 text-display-lg text-foreground">Attempt history</h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Every assessment you&apos;ve taken, with scores, timing and a path back to the full
                answer review.
              </p>
            </div>
            {!loading && !error && items.length > 0 && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {items.length} attempt{items.length === 1 ? "" : "s"} recorded
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
        {loading ? (
          <div className="space-y-4">
            <div className="skeleton h-24 rounded-[1.5rem]" />
            <div className="skeleton h-56 rounded-[1.5rem]" />
            <div className="skeleton h-72 rounded-[1.5rem]" />
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-danger/25 bg-danger-soft px-6 py-14 text-center">
            <p className="text-sm font-semibold text-danger-soft-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 rounded-full"
              onPress={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-border/80 bg-border/60 sm:grid-cols-4">
              {[
                {
                  icon: ClockArrowRotateLeft,
                  label: "Completed",
                  value: analytics?.completedAttempts ?? 0,
                },
                {
                  icon: ChartLine,
                  label: "Average",
                  value: `${analytics?.averagePercentage ?? 0}%`,
                },
                { icon: TargetDart, label: "Pass rate", value: `${analytics?.passRate ?? 0}%` },
                {
                  icon: Clock,
                  label: "Time on exams",
                  value: `${analytics?.totalMinutes ?? 0} min`,
                },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface px-5 py-5">
                  <dt className="flex items-center gap-2 text-[11.5px] font-semibold text-muted-foreground">
                    <stat.icon className="h-3.5 w-3.5 text-accent" />
                    {stat.label}
                  </dt>
                  <dd className="mt-2.5 font-display text-[1.8rem] font-semibold leading-none tracking-[-0.03em] text-foreground">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
              {chartData.length >= 2 && (
                <section className="rounded-[1.5rem] border border-border/80 bg-surface p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-[1.15rem] font-semibold text-foreground">
                      Score trend
                    </h2>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Last {chartData.length} attempts
                    </span>
                  </div>
                  <div className="mt-5 h-52 w-full">
                    <ScoreTrendChart data={chartData} />
                  </div>
                </section>
              )}

              {analytics && analytics.bySubject.length > 0 && (
                <section>
                  <h2 className="font-display text-[1.15rem] font-semibold text-foreground">
                    By subject
                  </h2>
                  <div className="mt-5 space-y-4">
                    {analytics.bySubject.slice(0, 6).map((subject) => (
                      <ProgressBar
                        key={subject.subject}
                        value={subject.averagePercentage}
                        aria-label={`${subject.subject} average score`}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[12.5px] font-semibold text-foreground">
                            {subject.subject}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {subject.averagePercentage}% · {subject.attempts} attempt
                            {subject.attempts === 1 ? "" : "s"}
                          </span>
                        </div>
                        <ProgressBar.Track className="mt-2 h-1.5">
                          <ProgressBar.Fill />
                        </ProgressBar.Track>
                      </ProgressBar>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <section className="mt-12">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-[1.35rem] font-semibold text-foreground">
                    All attempts
                  </h2>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    Open any completed attempt to review every answer.
                  </p>
                </div>
                <ToggleButtonGroup
                  selectionMode="single"
                  disallowEmptySelection
                  selectedKeys={new Set([filter])}
                  onSelectionChange={(keys) => {
                    const next = Array.from(keys)[0];
                    if (next) setFilter(String(next) as Filter);
                  }}
                  size="sm"
                  className="rounded-full bg-surface-secondary p-1"
                >
                  {(
                    [
                      { key: "all", label: "All" },
                      { key: "passed", label: "Passed" },
                      { key: "failed", label: "Not passed" },
                    ] as Array<{ key: Filter; label: string }>
                  ).map((tab) => (
                    <ToggleButton
                      key={tab.key}
                      id={tab.key}
                      className="rounded-full px-3 text-[12px] font-semibold"
                    >
                      {tab.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </div>

              {filtered.length === 0 ? (
                <div className="mt-5 rounded-[1.75rem] border border-border/80 bg-surface px-6 py-14 text-center">
                  <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-soft-foreground">
                    <ClockArrowRotateLeft className="h-5 w-5" />
                  </span>
                  <p className="font-display text-lg font-semibold text-foreground">
                    {completed.length === 0 ? "No attempts yet" : "Nothing matches this filter"}
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
                    {completed.length === 0
                      ? "Your scores, timing and answer reviews will be saved here."
                      : "Try another filter to see your other attempts."}
                  </p>
                  {completed.length === 0 && (
                    <Button
                      className="mt-6 rounded-full"
                      size="sm"
                      onPress={() => router.push("/courses")}
                    >
                      Browse courses
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-border/80 bg-surface">
                  {filtered.map((item) => {
                    const running = item.status === "in_progress";
                    const terminated = item.status === "terminated";
                    const difficulty = difficultyStyle(item.difficulty);
                    return (
                      <Link
                        key={item.attemptId}
                        href={running ? `/exam/${item.attemptId}` : `/results/${item.attemptId}`}
                        className="group flex items-center gap-4 border-b border-border/60 px-5 py-4 transition-colors last:border-0 hover:bg-surface-secondary"
                      >
                        <span
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                            running
                              ? "bg-accent-soft text-accent-soft-foreground"
                              : terminated
                                ? "bg-warning-soft text-warning-soft-foreground"
                                : item.passed
                                  ? "bg-success-soft text-success-soft-foreground"
                                  : "bg-danger-soft text-danger-soft-foreground"
                          }`}
                        >
                          {running ? (
                            <CirclePlay className="h-5 w-5" />
                          ) : terminated ? (
                            <TriangleExclamation className="h-5 w-5" />
                          ) : item.passed ? (
                            <CircleCheck className="h-5 w-5" />
                          ) : (
                            <CircleXmark className="h-5 w-5" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold text-foreground">
                            {item.courseTitle}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                            <span
                              className={`rounded-full border px-2 py-px text-[10px] font-bold ${difficulty.className}`}
                            >
                              {difficulty.label}
                            </span>
                            {item.subject && <span>{item.subject}</span>}
                            {running ? (
                              <span className="font-semibold text-accent">In progress</span>
                            ) : (
                              <>
                                {terminated && (
                                  <span className="font-semibold text-warning-soft-foreground">
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
                          <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
                        ) : (
                          <span
                            className={`font-display text-lg font-semibold ${scoreClasses(item.percentage)}`}
                          >
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
