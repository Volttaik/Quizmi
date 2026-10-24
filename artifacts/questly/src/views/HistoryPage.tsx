"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button, ProgressBar, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import ButtonLink from "@/components/ui/ButtonLink";
import {
  ArrowRight,
  ChartLine,
  CircleCheck,
  CircleDashed,
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
import { attemptStatusMeta } from "@/lib/attempt-status";
import {
  groupAttemptsByCourse,
  matchesHistoryFilter,
  type HistoryFilter,
} from "@/lib/attempt-summary";
import { useSessionRequest } from "@/lib/use-session-request";
import type { Analytics, HistoryItem } from "@/lib/types";

// Charts are only needed once history exists, so keep recharts out of the initial bundle.
const ScoreTrendChart = dynamic(() => import("@/components/ScoreTrendChart"), {
  ssr: false,
  loading: () => <div className="skeleton h-48 rounded-xl" />,
});

function AttemptIcon({ item }: { item: HistoryItem }) {
  const className = "h-5 w-5";
  if (item.status === "in_progress") return <CirclePlay className={className} />;
  if (!item.hasResult) return <CircleDashed className={className} />;
  if (item.status === "terminated") return <TriangleExclamation className={className} />;
  return item.passed ? <CircleCheck className={className} /> : <CircleXmark className={className} />;
}

function attemptTone(item: HistoryItem): string {
  if (item.status === "in_progress") return "bg-accent-soft text-accent-soft-foreground";
  if (!item.hasResult) return "bg-surface-secondary text-muted-foreground";
  if (item.status === "terminated") return "bg-warning-soft text-warning-soft-foreground";
  return item.passed
    ? "bg-success-soft text-success-soft-foreground"
    : "bg-danger-soft text-danger-soft-foreground";
}

export default function HistoryPage() {
  const router = useRouter();
  const sessionFetch = useSessionRequest();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<HistoryFilter>("all");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      sessionFetch("/api/attempts", { cache: "no-store" }),
      sessionFetch("/api/analytics", { cache: "no-store" }),
    ])
      .then(async ([historyOutcome, analyticsOutcome]) => {
        if (!active) return;

        if (!historyOutcome.ok) {
          if (historyOutcome.failure === "unauthenticated") {
            // Only a 401 that survived a token refresh means signed out.
            router.replace("/sign-in?redirect_url=/history");
            return null;
          }
          throw new Error("We couldn't load your history just now. Try again in a moment.");
        }
        if (!historyOutcome.response.ok) throw new Error("Could not load your history");

        const historyData = (await historyOutcome.response.json()) as { items: HistoryItem[] };
        const analyticsData =
          analyticsOutcome.ok && analyticsOutcome.response.ok
            ? ((await analyticsOutcome.response.json()) as Analytics)
            : null;

        return { historyData, analyticsData };
      })
      .then((payload) => {
        if (!active || !payload) return;
        setItems(Array.isArray(payload.historyData.items) ? payload.historyData.items : []);
        setAnalytics(payload.analyticsData);
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
  }, [router, sessionFetch, reloadKey]);

  const retry = useCallback(() => setReloadKey((value) => value + 1), []);

  const filtered = useMemo(
    () => items.filter((item) => matchesHistoryFilter(item, filter)),
    [items, filter]
  );
  const groups = useMemo(() => groupAttemptsByCourse(filtered), [filtered]);
  const hasGraded = (analytics?.completedAttempts ?? 0) > 0;

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
    <div className="bg-background">
      <section className="hero-mesh border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Progress</p>
              <h1 className="mt-3 text-display-lg text-foreground">Attempt history</h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Every attempt, grouped by course and numbered in the order you took it. Open any
                row to review that exact attempt&apos;s answers.
              </p>
            </div>
            {!loading && items.length > 0 && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {items.length} attempt{items.length === 1 ? "" : "s"} recorded
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
        {loading ? (
          <div className="space-y-4">
            <div className="skeleton h-24 rounded-[var(--radius)]" />
            <div className="skeleton h-56 rounded-[var(--radius)]" />
            <div className="skeleton h-72 rounded-[var(--radius)]" />
          </div>
        ) : error ? (
          <div className="rounded-[var(--radius)] border border-danger/25 bg-danger-soft px-6 py-14 text-center">
            <p className="text-sm font-semibold text-danger-soft-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-5 rounded-full" onPress={retry}>
              Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="dotted-edge-tl rounded-[var(--radius)] border border-border/80 bg-surface px-6 py-16 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-soft-foreground">
              <ClockArrowRotateLeft className="h-5 w-5" />
            </span>
            <p className="font-display text-lg font-semibold text-foreground">No attempts yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              Your scores, timing and full answer reviews will be saved here as soon as you take
              your first assessment.
            </p>
            <Button className="mt-6 rounded-full" size="sm" onPress={() => router.push("/courses")}>
              Browse courses
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            {hasGraded && (
              <dl className="dotted-edge-tl grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border border-border/80 bg-border/60 sm:grid-cols-4">
                {[
                  {
                    icon: ClockArrowRotateLeft,
                    label: "Graded attempts",
                    value: analytics?.completedAttempts ?? 0,
                  },
                  {
                    icon: ChartLine,
                    label: "Average",
                    value: `${analytics?.averagePercentage ?? 0}%`,
                  },
                  {
                    icon: TargetDart,
                    label: "Pass rate",
                    value: `${analytics?.passRate ?? 0}%`,
                  },
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
                    <dd className="mt-2.5 font-display text-[1.35rem] font-semibold leading-none tracking-[-0.02em] text-foreground">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {(analytics?.notSubmittedAttempts ?? 0) > 0 && (
              <p className="mt-4 rounded-[var(--radius)] border border-border/70 bg-surface-secondary px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
                {analytics?.notSubmittedAttempts} attempt
                {analytics?.notSubmittedAttempts === 1 ? " was" : "s were"} opened but not
                submitted. They stay in your history without a score, and never count as
                completed or affect your average.
              </p>
            )}

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
              {chartData.length >= 2 && (
                <section className="dotted-edge-tl rounded-[var(--radius)] border border-border/80 bg-surface p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-[1.15rem] font-semibold text-foreground">
                      Score trend
                    </h2>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Last {chartData.length} graded attempts
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
                    Your courses
                  </h2>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    Attempt 1 is your first try at that course; numbers follow the order you took
                    them.
                  </p>
                </div>
                <ToggleButtonGroup
                  selectionMode="single"
                  disallowEmptySelection
                  selectedKeys={new Set([filter])}
                  onSelectionChange={(keys) => {
                    const next = Array.from(keys)[0];
                    if (next) setFilter(String(next) as HistoryFilter);
                  }}
                  size="sm"
                  className="rounded-full bg-surface-secondary p-1"
                >
                  {(
                    [
                      { key: "all", label: "All" },
                      { key: "passed", label: "Passed" },
                      { key: "failed", label: "Not passed" },
                      { key: "unfinished", label: "Unfinished" },
                    ] as Array<{ key: HistoryFilter; label: string }>
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

              {groups.length === 0 ? (
                <div className="mt-5 rounded-[var(--radius)] border border-border/80 bg-surface px-6 py-14 text-center">
                  <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-soft-foreground">
                    <ClockArrowRotateLeft className="h-5 w-5" />
                  </span>
                  <p className="font-display text-lg font-semibold text-foreground">
                    Nothing matches this filter
                  </p>
                  <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
                    Try another filter to see your other attempts.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {groups.map((group) => (
                    <section
                      key={group.courseId}
                      className="dotted-edge overflow-hidden rounded-[var(--radius)] border border-border/80 bg-surface shadow-card transition-[box-shadow] duration-200 hover:shadow-card-hover"
                      aria-label={`${group.courseTitle} attempts`}
                    >
                      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-surface-secondary/60 px-5 py-4 sm:px-6">
                        <div className="min-w-0">
                          <Link
                            href={`/courses/${group.courseSlug}`}
                            className="truncate font-display text-[15px] font-semibold text-foreground hover:text-accent"
                          >
                            {group.courseTitle}
                          </Link>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                            {group.difficulty && (
                              <span
                                className={`rounded-full border px-2 py-px text-[10px] font-bold ${
                                  difficultyStyle(group.difficulty).className
                                }`}
                              >
                                {difficultyStyle(group.difficulty).label}
                              </span>
                            )}
                            {group.subject && <span>{group.subject}</span>}
                            <span>
                              {group.gradedAttempts} graded
                              {group.unfinishedAttempts > 0
                                ? ` · ${group.unfinishedAttempts} unfinished`
                                : ""}
                            </span>
                            {group.bestPercentage !== null && (
                              <span>· Best {group.bestPercentage}%</span>
                            )}
                          </p>
                        </div>
                        <ButtonLink
                          href={`/courses/${group.courseSlug}`}
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full px-3 text-[12px]"
                        >
                          Course
                        </ButtonLink>
                      </header>

                      <ul className="divide-y divide-border/60">
                        {group.attempts.map((item) => {
                          const meta = attemptStatusMeta(item.status);
                          const open = item.status === "in_progress";
                          const href = open ? `/exam/${item.attemptId}` : `/results/${item.attemptId}`;
                          const date = item.submittedAt ?? item.startedAt;
                          return (
                            <li key={item.attemptId}>
                              <Link
                                href={href}
                                className="group flex flex-wrap items-center gap-4 px-5 py-5 transition-colors hover:bg-surface-secondary sm:px-6"
                              >
                                <span
                                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius)] ${attemptTone(item)}`}
                                >
                                  <AttemptIcon item={item} />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-foreground">
                                      Attempt {item.attemptNumber}
                                    </p>
                                    <span
                                      className={`rounded-full border px-2 py-px text-[10px] font-bold uppercase tracking-wide ${meta.className}`}
                                    >
                                      {meta.label}
                                    </span>
                                  </div>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs leading-relaxed text-muted-foreground">
                                    <span>{formatDate(date)}</span>
                                    <span>· {formatRelative(date)}</span>
                                    {item.hasResult ? (
                                      <>
                                        <span>· {item.correctCount} correct</span>
                                        <span>· {item.incorrectCount} incorrect</span>
                                        <span>· {item.unansweredCount} unanswered</span>
                                        <span>
                                          · {item.answeredCount}/{item.totalQuestions} answered
                                        </span>
                                        <span>· {formatTimeTaken(item.timeTakenSeconds)}</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>
                                          · {item.answeredCount}/{item.totalQuestions} answered
                                        </span>
                                        <span>· no score recorded</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {item.hasResult ? (
                                    <span
                                      className={`font-display text-xl font-semibold ${scoreClasses(item.percentage)}`}
                                    >
                                      {item.percentage}%
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                      {open ? "Resume" : "View"}
                                    </span>
                                  )}
                                  <span className="flex h-9 items-center rounded-full border border-border px-3 text-[11.5px] font-semibold text-foreground transition-colors group-hover:border-accent group-hover:text-accent">
                                    {open ? "Resume" : "View results"}
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                  </span>
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
