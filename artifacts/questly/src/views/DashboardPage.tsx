"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  PlayCircle,
  Search,
  Target,
  Trophy,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { formatCountdown, formatRelative, scoreClasses } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exploreQuery, setExploreQuery] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/dashboard")
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/sign-in");
          return null;
        }
        if (!response.ok) throw new Error("Could not load your dashboard");
        return (await response.json()) as DashboardData;
      })
      .then((payload) => {
        if (active && payload) setData(payload);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load your dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const firstName = data?.user.name?.split(" ")[0] ?? "";
  const hasActivity = (data?.stats.completedAttempts ?? 0) > 0;

  const explore = (event: React.FormEvent) => {
    event.preventDefault();
    const query = exploreQuery.trim();
    router.push(query ? `/courses?q=${encodeURIComponent(query)}` : "/courses");
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {loading ? (
        <div className="space-y-6">
          <div className="skeleton h-10 w-64 rounded-lg" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-44 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center">
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 rounded-lg"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : data ? (
        <>
          {/* Welcome */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                QUIZIMI dashboard
              </p>
              <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.inProgress.length > 0
                  ? "Pick up your assessment or review your latest results."
                  : hasActivity
                    ? "Review your progress or start another assessment."
                    : "Choose a course to begin your first assessment."}
              </p>
            </div>
            <Button asChild className="w-full rounded-lg sm:w-auto">
              <Link href="/courses">
                Browse courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Real aggregate figures */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={BookOpenCheck}
              label="My courses"
              value={data.stats.purchasedCourses}
              hint={
                data.stats.purchasedCourses === 0
                  ? "No purchases yet"
                  : `${data.stats.coursesTaken} course${data.stats.coursesTaken === 1 ? "" : "s"} attempted`
              }
            />
            <StatCard
              icon={BarChart3}
              label="Completed attempts"
              value={data.stats.completedAttempts}
              hint={
                hasActivity
                  ? `${data.stats.completedAttempts === 1 ? "1 result" : "Results"} saved`
                  : "No results yet"
              }
            />
            <StatCard
              icon={Target}
              label="Average score"
              value={`${data.stats.averagePercentage}%`}
              hint={hasActivity ? "Across completed attempts" : "No results yet"}
              tone={hasActivity ? (data.stats.averagePercentage >= 70 ? "good" : "warn") : "default"}
            />
            <StatCard
              icon={Trophy}
              label="Pass rate"
              value={`${data.stats.passRate}%`}
              hint={hasActivity ? `${data.stats.bestPercentage}% best score` : "No attempts yet"}
              tone={hasActivity ? (data.stats.passRate >= 50 ? "good" : "default") : "default"}
            />
          </div>

          {/* In progress */}
          {data.inProgress.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                In progress
              </h2>
              <div className="mt-3 space-y-3">
                {data.inProgress.map((attempt) => (
                  <Link
                    key={attempt.attemptId}
                    href={`/exam/${attempt.attemptId}`}
                    className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-card p-4 transition-colors hover:border-primary/60"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <PlayCircle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{attempt.courseTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.answered} of {attempt.questionCount} answered
                        {attempt.secondsRemaining !== null &&
                          ` · ${formatCountdown(attempt.secondsRemaining)} remaining`}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs font-bold text-primary">Resume</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* My courses */}
          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-foreground">My courses</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Courses you have purchased or claimed.
                </p>
              </div>
              <Link
                href="/my-courses"
                className="text-xs font-bold text-primary underline-offset-4 hover:underline"
              >
                View my courses
              </Link>
            </div>

            {data.purchasedCourses.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-border bg-card p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground">You have not added a course yet</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Purchased courses appear here. Browse the catalogue to find one that fits what you
                  are preparing for.
                </p>
                <Button asChild size="sm" className="mt-4 rounded-lg">
                  <Link href="/courses">Browse courses</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.purchasedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>

          {/* Explore */}
          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-foreground">Explore courses</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Search the full catalogue for another subject to practise.
                </p>
              </div>
              <Link
                href="/courses"
                className="text-xs font-bold text-primary underline-offset-4 hover:underline"
              >
                View all
              </Link>
            </div>

            <form onSubmit={explore} className="mt-3 flex flex-col gap-2 sm:flex-row" role="search">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={exploreQuery}
                  onChange={(event) => setExploreQuery(event.target.value)}
                  placeholder="Search by course, subject or topic"
                  aria-label="Search the course catalogue"
                  className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <Button type="submit" className="h-11 rounded-xl px-5 font-bold">
                Search
              </Button>
            </form>

            {data.recommended.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-border bg-card p-6 text-center">
                <p className="text-sm font-bold text-foreground">Nothing new to recommend</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  Every published course is already in your account, or the catalogue is empty
                  right now.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
                  <Link href="/courses">Open the catalogue</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.recommended.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>

          {/* Recent activity */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-foreground">Recent activity</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  The latest attempts saved to your account.
                </p>
              </div>
              {hasActivity && (
                <Link
                  href="/history"
                  className="text-xs font-bold text-primary underline-offset-4 hover:underline"
                >
                  View all
                </Link>
              )}
            </div>

            {data.recentResults.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-border bg-card p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground">No attempts yet</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Open one of your courses and start an assessment. Your score and answer review will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {data.recentResults.map((result) => {
                  const terminated = result.status === "terminated";
                  return (
                    <Link
                      key={result.attemptId}
                      href={`/results/${result.attemptId}`}
                      className="flex items-center gap-3 p-4 transition-colors hover:bg-muted"
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                          terminated
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : result.passed
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {terminated ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : result.passed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Target className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {result.courseTitle}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {terminated ? "Terminated · " : ""}
                          {result.score}/{result.totalMarks} marks ·{" "}
                          {formatRelative(result.submittedAt)}
                        </p>
                      </div>
                      <span className={`text-lg font-extrabold ${scoreClasses(result.percentage)}`}>
                        {result.percentage}%
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Learning progress */}
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-foreground">Learning progress</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Average score by subject, from completed attempts only.
                </p>
              </div>
              {hasActivity && (
                <Link
                  href="/history"
                  className="text-xs font-bold text-primary underline-offset-4 hover:underline"
                >
                  Full analytics
                </Link>
              )}
            </div>

            {data.subjectPerformance.length > 0 ? (
              <div className="mt-3 space-y-4 rounded-2xl border border-border bg-card p-5">
                {data.subjectPerformance.map((subject) => (
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
            ) : (
              <div className="mt-3 rounded-2xl border border-border bg-card p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground">Progress starts with a result</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Complete an assessment and your average score by subject will be calculated from
                  your saved results.
                </p>
                <Button asChild size="sm" className="mt-4 rounded-lg">
                  <Link href="/courses">Start an assessment</Link>
                </Button>
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
