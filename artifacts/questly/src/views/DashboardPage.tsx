"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ProgressBar, SearchField } from "@heroui/react";
import {
  ArrowRight,
  BookOpen,
  ChartLine,
  CircleCheck,
  CircleExclamation,
  Clock,
  Flame,
  Magnifier,
  PlayFill,
  Sparkles,
  Target,
} from "@gravity-ui/icons";
import CourseCard from "@/components/CourseCard";
import ButtonLink from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";
import { formatCountdown, formatRelative, scoreClasses } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-[1.35rem] font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

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

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="skeleton h-9 w-64 rounded-xl" />
        <div className="skeleton mt-3 h-4 w-80 rounded-lg" />
        <div className="skeleton mt-8 h-32 rounded-[1.75rem]" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton h-80 rounded-[1.75rem]" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20 text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger-soft-foreground">
          <CircleExclamation className="h-6 w-6" />
        </span>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          We couldn&apos;t load your dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6 rounded-full" onPress={() => window.location.reload()}>
          Try again
        </Button>
      </main>
    );
  }

  if (!data) return null;

  const stats = [
    {
      label: "My courses",
      value: data.stats.purchasedCourses,
      hint:
        data.stats.purchasedCourses === 0
          ? "Nothing purchased yet"
          : `${data.stats.coursesTaken} attempted`,
      icon: BookOpen,
    },
    {
      label: "Completed",
      value: data.stats.completedAttempts,
      hint: hasActivity ? "Results saved" : "No results yet",
      icon: CircleCheck,
    },
    {
      label: "Average score",
      value: `${data.stats.averagePercentage}%`,
      hint: hasActivity ? "Across all attempts" : "Start one to see this",
      icon: Target,
    },
    {
      label: "Pass rate",
      value: `${data.stats.passRate}%`,
      hint: hasActivity ? `${data.stats.bestPercentage}% personal best` : "No attempts yet",
      icon: Flame,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1 className="mt-2.5 text-display-md text-foreground">
            {firstName ? `Welcome back, ${firstName}.` : "Welcome back."}
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
            {data.inProgress.length > 0
              ? "You have an assessment open. Pick it back up or start something new."
              : hasActivity
                ? "Review how you're doing, then choose your next attempt."
                : "Pick a course, set your timer and take your first assessment."}
          </p>
        </div>
        <ButtonLink href="/courses" className="rounded-full" size="md">
          Browse courses
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      {/* ── One calm stat strip, not four competing cards ─────────────────── */}
      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-border/80 bg-border/70 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface px-5 py-5">
            <dt className="flex items-center gap-2 text-[11.5px] font-semibold text-muted-foreground">
              <stat.icon className="h-3.5 w-3.5 text-accent" />
              {stat.label}
            </dt>
            <dd className="mt-2.5 font-display text-[1.9rem] font-semibold leading-none tracking-[-0.03em] text-foreground">
              {stat.value}
            </dd>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{stat.hint}</p>
          </div>
        ))}
      </dl>

      {/* ── Continue ─────────────────────────────────────────────────────── */}
      {data.inProgress.length > 0 && (
        <section className="mt-12">
          <SectionHeading title="Continue where you stopped" />
          <div className="mt-4 space-y-3">
            {data.inProgress.map((attempt) => (
              <Link
                key={attempt.attemptId}
                href={`/exam/${attempt.attemptId}`}
                className="brand-gradient group flex items-center gap-4 rounded-[1.5rem] p-5 text-white shadow-[0_22px_50px_-26px_rgba(67,45,160,0.75)] transition-transform duration-300 hover:-translate-y-0.5 sm:p-6"
              >
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <PlayFill className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold">{attempt.courseTitle}</p>
                  <p className="mt-0.5 text-[12px] text-white/75">
                    {attempt.answered} of {attempt.questionCount} answered
                    {attempt.secondsRemaining !== null &&
                      ` · ${formatCountdown(attempt.secondsRemaining)} remaining`}
                  </p>
                </div>
                <span className="flex flex-shrink-0 items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[12.5px] font-semibold backdrop-blur">
                  Resume
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── My courses ───────────────────────────────────────────────────── */}
      <section className="mt-12">
        <SectionHeading
          title="My courses"
          description="Courses you own, with your best score so far."
          action={
            data.purchasedCourses.length > 0 ? (
              <Link
                href="/my-courses"
                className="text-[12.5px] font-semibold text-accent underline-offset-4 hover:underline"
              >
                View library
              </Link>
            ) : undefined
          }
        />

        {data.purchasedCourses.length === 0 ? (
          <div className="mt-4 flex flex-col items-start gap-4 rounded-[1.5rem] border border-dashed border-border bg-surface/50 p-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-soft-foreground">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-[15px] font-semibold text-foreground">
                  Your library is empty
                </p>
                <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
                  Courses you purchase appear here. Browse the catalogue to find something worth
                  preparing for.
                </p>
              </div>
            </div>
            <ButtonLink href="/courses" size="sm" className="flex-shrink-0 rounded-full">
              Explore courses
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.purchasedCourses.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recent results + subject progress ────────────────────────────── */}
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <section>
          <SectionHeading
            title="Recent results"
            action={
              hasActivity ? (
                <Link
                  href="/history"
                  className="text-[12.5px] font-semibold text-accent underline-offset-4 hover:underline"
                >
                  Full history
                </Link>
              ) : undefined
            }
          />

          {data.recentResults.length === 0 ? (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-border bg-surface/50 p-7 text-center">
              <ChartLine className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-3 font-display text-[15px] font-semibold text-foreground">
                No results yet
              </p>
              <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
                Complete an assessment and your score, answer review and progress will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-border/80 bg-surface">
              {data.recentResults.map((result) => {
                const terminated = result.status === "terminated";
                return (
                  <Link
                    key={result.attemptId}
                    href={`/results/${result.attemptId}`}
                    className="group flex items-center gap-4 border-b border-border/60 px-5 py-4 transition-colors last:border-0 hover:bg-surface-secondary"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl",
                        terminated
                          ? "bg-warning-soft text-warning-soft-foreground"
                          : result.passed
                            ? "bg-success-soft text-success-soft-foreground"
                            : "bg-accent-soft text-accent-soft-foreground",
                      )}
                    >
                      {terminated ? (
                        <CircleExclamation className="h-4 w-4" />
                      ) : result.passed ? (
                        <CircleCheck className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-foreground">
                        {result.courseTitle}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                        {terminated ? "Terminated · " : ""}
                        {result.score}/{result.totalMarks} marks · {formatRelative(result.submittedAt)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-display text-lg font-semibold",
                        scoreClasses(result.percentage),
                      )}
                    >
                      {result.percentage}%
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <SectionHeading title="By subject" description="Average of completed attempts." />

          {data.subjectPerformance.length > 0 ? (
            <div className="mt-5 space-y-5">
              {data.subjectPerformance.map((subject) => (
                <ProgressBar
                  key={subject.subject}
                  value={subject.averagePercentage}
                  aria-label={`${subject.subject} average score`}
                  className="w-full"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] font-semibold text-foreground">
                      {subject.subject}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {subject.averagePercentage}% · {subject.attempts} attempt
                      {subject.attempts === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ProgressBar.Track className="mt-2 h-2">
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-border bg-surface/50 p-7 text-center">
              <Target className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-3 font-display text-[15px] font-semibold text-foreground">
                Progress starts with a result
              </p>
              <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
                Complete an assessment and your average score by subject appears here.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ── Explore ──────────────────────────────────────────────────────── */}
      <section className="mt-14 border-t border-border/70 pt-10">
        <SectionHeading
          title="Explore something new"
          description="Search the full catalogue by course name or code."
          action={
            <Link
              href="/courses"
              className="text-[12.5px] font-semibold text-accent underline-offset-4 hover:underline"
            >
              View all
            </Link>
          }
        />

        <form onSubmit={explore} role="search" className="mt-4 flex max-w-xl flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <SearchField aria-label="Search the catalogue" value={exploreQuery} onChange={setExploreQuery}>
              <SearchField.Group className="h-11 rounded-xl border border-border bg-surface focus-within:border-accent/50">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Course name or code" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
          <Button type="submit" className="h-11 rounded-xl px-5">
            Search
            <Magnifier className="h-4 w-4" />
          </Button>
        </form>

        {data.recommended.length === 0 ? (
          <div className="mt-5 rounded-[1.5rem] border border-dashed border-border bg-surface/50 p-7 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-3 font-display text-[15px] font-semibold text-foreground">
              Nothing new right now
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
              Every published course is already in your library, or the catalogue is empty.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommended.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* A quiet closing note, only for learners who have nothing open. */}
      {data.inProgress.length === 0 && hasActivity && (
        <div className="mt-12 flex items-center gap-3 rounded-[1.25rem] bg-surface-secondary px-5 py-4">
          <Clock className="h-4 w-4 flex-shrink-0 text-accent" />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Timers are server-enforced. If you close an assessment, the clock keeps running until
            you submit or it expires.
          </p>
        </div>
      )}
    </main>
  );
}
