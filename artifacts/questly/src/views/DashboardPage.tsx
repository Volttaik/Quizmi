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
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
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
      ) : data ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Dashboard</p>
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
            <Link href="/courses">
              <Button className="w-full rounded-full sm:w-auto">
                Browse courses
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={BookOpenCheck}
              label="My courses"
              value={data.stats.purchasedCourses}
              hint={`${data.stats.coursesTaken} course${data.stats.coursesTaken === 1 ? "" : "s"} attempted`}
            />
            <StatCard
              icon={BarChart3}
              label="Completed attempts"
              value={data.stats.completedAttempts}
              hint={data.stats.completedAttempts === 1 ? "1 result saved" : "Results saved"}
            />
            <StatCard
              icon={Target}
              label="Average score"
              value={`${data.stats.averagePercentage}%`}
              tone={hasActivity ? (data.stats.averagePercentage >= 70 ? "good" : "warn") : "default"}
            />
            <StatCard
              icon={Trophy}
              label="Pass rate"
              value={`${data.stats.passRate}%`}
              tone={hasActivity ? (data.stats.passRate >= 50 ? "good" : "default") : "default"}
            />
          </div>

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
                    className="flex items-center gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
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

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-foreground">Your courses</h2>
              <Link
                href="/courses"
                className="text-xs font-bold text-primary underline-offset-4 hover:underline"
              >
                Course catalogue
              </Link>
            </div>

            {data.purchasedCourses.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-border/70 bg-card p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground">You have not added a course yet</p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                  Purchased courses appear here. Browse the catalogue to find one that fits what you
                  are preparing for.
                </p>
                <Link href="/courses" className="mt-4 inline-block">
                  <Button size="sm" className="rounded-full">
                    Browse courses
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.purchasedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-foreground">Recent results</h2>
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
              <div className="mt-3 rounded-2xl border border-border/70 bg-card p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground">No attempts yet</p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                  Open one of your courses and start an assessment. Your score and answer review will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="mt-3 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card">
                {data.recentResults.map((result) => {
                  const terminated = result.status === "terminated";
                  return (
                    <Link
                      key={result.attemptId}
                      href={`/results/${result.attemptId}`}
                      className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
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

          {data.subjectPerformance.length > 0 && (
            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-foreground">Performance by subject</h2>
                <Link
                  href="/history"
                  className="text-xs font-bold text-primary underline-offset-4 hover:underline"
                >
                  Full analytics
                </Link>
              </div>
              <div className="mt-3 space-y-4 rounded-2xl border border-border/70 bg-card p-5">
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
            </section>
          )}

          {data.recommended.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-extrabold text-foreground">Explore more courses</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.recommended.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}
    </main>
  );
}
