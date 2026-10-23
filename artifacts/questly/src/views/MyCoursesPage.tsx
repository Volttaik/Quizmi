"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Chip } from "@heroui/react";
import {
  ArrowRight,
  BookOpen,
  CircleCheck,
  Clock,
  PlayFill,
  Target,
} from "@gravity-ui/icons";
import ButtonLink from "@/components/ui/ButtonLink";
import { formatDate } from "@/lib/format";
import type { CourseSummary } from "@/lib/types";

function CourseRow({ course }: { course: CourseSummary }) {
  const [coverOk, setCoverOk] = useState(true);
  const resume = Boolean(course.inProgressAttemptId);
  const actionLabel = resume
    ? "Resume assessment"
    : course.attemptsUsed > 0
      ? "Practise again"
      : "Start assessment";

  return (
    <Card className="group overflow-hidden rounded-[1.65rem] border border-border/70 bg-surface p-0 transition-all duration-300 hover:border-accent/25 hover:shadow-[0_22px_48px_-28px_rgba(35,25,80,0.45)]">
      <Link
        href={`/courses/${course.slug}`}
        className="flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 sm:flex-row"
      >
        <div className="relative h-40 w-full flex-shrink-0 overflow-hidden bg-surface-secondary sm:h-auto sm:w-52 lg:w-64">
          {course.coverImageUrl && coverOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.coverImageUrl}
              alt=""
              onError={() => setCoverOk(false)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div aria-hidden className="brand-gradient flex h-full min-h-40 w-full items-center justify-center">
              <BookOpen className="h-9 w-9 text-white/70" />
            </div>
          )}
          {course.isPurchased && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#241f33]">
              <CircleCheck className="h-3 w-3" /> Owned
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {course.code && (
                <Chip size="sm" variant="soft" color="accent">
                  {course.code}
                </Chip>
              )}
              {course.subject && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {course.subject}
                </span>
              )}
              {resume && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-[10.5px] font-semibold text-warning-soft-foreground">
                  <PlayFill className="h-3 w-3" /> In progress
                </span>
              )}
            </div>

            <h2 className="mt-2.5 font-display text-[1.3rem] font-semibold leading-tight tracking-[-0.02em] text-foreground transition-colors group-hover:text-accent">
              {course.title}
            </h2>

            {course.description && (
              <p className="mt-2 line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                {course.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              {course.questionCount.toLocaleString()} question
              {course.questionCount === 1 ? "" : "s"} available
            </span>
            {course.durationMinutes && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {course.durationMinutes} min default
              </span>
            )}
            {course.bestPercentage !== null ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-success">
                <CircleCheck className="h-3.5 w-3.5" />
                Best score {course.bestPercentage}%
              </span>
            ) : (
              <span>Not attempted yet</span>
            )}
            {course.purchasedAt && <span>Added {formatDate(course.purchasedAt)}</span>}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border/60 px-5 py-4 sm:border-l sm:border-t-0 sm:px-6">
          <span className="text-[12px] font-semibold text-accent">{actionLabel}</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
            {resume ? (
              <PlayFill className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </span>
        </div>
      </Link>
    </Card>
  );
}

export default function MyCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch("/api/my-courses")
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/sign-in?redirect_url=/my-courses");
          return null;
        }
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error ?? "Could not load your courses");
        return data as { courses: CourseSummary[] };
      })
      .then((data) => {
        if (active && data) setCourses(Array.isArray(data.courses) ? data.courses : []);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load your courses");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router, reloadKey]);

  return (
    <div className="bg-background">
      <section className="hero-mesh border-b border-border/60">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Your library</p>
              <h1 className="mt-3 text-display-lg text-foreground">My courses</h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                The courses you&apos;ve unlocked, with your best score and a direct route back into
                practice.
              </p>
            </div>
            {!loading && !error && courses.length > 0 && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {courses.length} course{courses.length === 1 ? "" : "s"} owned
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton h-52 rounded-[1.65rem]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-danger/25 bg-danger-soft px-6 py-14 text-center">
            <p className="text-sm font-semibold text-danger-soft-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 rounded-full"
              onPress={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </Button>
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-[2rem] border border-border/80 bg-surface px-6 py-20 text-center">
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-accent-soft text-accent-soft-foreground">
              <BookOpen className="h-7 w-7" />
            </span>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Your library starts here
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Courses you purchase appear here with your best scores and a one-tap path back into
              practice. Browse the catalogue to find one that fits what you&apos;re preparing for.
            </p>
            <ButtonLink href="/courses" className="mt-7 rounded-full" size="lg">
              Explore courses
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {courses.map((course) => (
                <CourseRow key={course.id} course={course} />
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3 border-t border-border/70 pt-10">
              <p className="text-[12.5px] text-muted-foreground">
                Looking for another subject to practise?
              </p>
              <ButtonLink href="/courses" variant="outline" className="rounded-full">
                Explore the catalogue
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
