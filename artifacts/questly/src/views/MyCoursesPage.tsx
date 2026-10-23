"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  HelpCircle,
  Library,
  PlayCircle,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { difficultyStyle, formatDate } from "@/lib/format";
import type { CourseSummary } from "@/lib/types";

function initialFor(title: string): string {
  return title.trim().slice(0, 1).toUpperCase() || "Q";
}

function CourseRow({ course }: { course: CourseSummary }) {
  const difficulty = difficultyStyle(course.difficulty);
  const [coverOk, setCoverOk] = useState(true);
  const resume = Boolean(course.inProgressAttemptId);
  const actionLabel = resume
    ? "Resume assessment"
    : course.attemptsUsed > 0
      ? "Practise again"
      : "Start assessment";

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:items-center"
    >
      {course.coverImageUrl && coverOk ? (
        // Course artwork can be hosted on any origin, so it renders as a plain
        // image like question illustrations do. A failed load falls back to
        // the icon tile instead of a broken-image glyph.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.coverImageUrl}
          alt=""
          onError={() => setCoverOk(false)}
          className="h-16 w-16 flex-shrink-0 rounded-xl border border-border/60 bg-muted object-cover"
        />
      ) : (
        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <BookOpen className="h-6 w-6" strokeWidth={1.9} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {course.code && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-accent-foreground">
              {course.code}
            </span>
          )}
          <span
            className={`rounded-full border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${difficulty.className}`}
          >
            {difficulty.label}
          </span>
          {course.subject && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
              {course.subject}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400">
            <Check className="h-3 w-3" /> Purchased
          </span>
        </div>

        <h2 className="mt-1.5 truncate text-sm font-bold text-card-foreground group-hover:text-primary sm:text-base">
          {course.title}
        </h2>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            {course.questionCount.toLocaleString()} question
            {course.questionCount === 1 ? "" : "s"}
          </span>
          {course.bestPercentage !== null ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Trophy className="h-3 w-3" /> Best {course.bestPercentage}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Target className="h-3 w-3" /> Not attempted yet
            </span>
          )}
          {course.purchasedAt && <span>Purchased {formatDate(course.purchasedAt)}</span>}
        </div>
      </div>

      <span className="mt-1 inline-flex flex-shrink-0 items-center gap-1 self-end text-xs font-bold text-primary sm:mt-0 sm:self-center">
        {resume && <PlayCircle className="h-4 w-4" />}
        <span className="hidden sm:inline">{actionLabel}</span>
        <span className="sm:hidden">{resume ? "Resume" : "Open"}</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
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
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Your library
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              My courses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Courses you have purchased. Open one to keep practising.
            </p>
          </div>
          {!loading && !error && courses.length > 0 && (
            <p className="text-xs font-semibold text-muted-foreground">
              {courses.length} course{courses.length === 1 ? "" : "s"} owned
            </p>
          )}
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-card p-8 text-center">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </Button>
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-10 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Library className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-base font-bold text-foreground">No courses yet</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Courses you purchase appear here with your best scores and a one-tap path back into
              practice. Browse the catalogue to find one that fits what you are preparing for.
            </p>
            <Button asChild className="mt-5 rounded-lg">
              <Link href="/courses">
                Explore courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-3">
              {courses.map((course) => (
                <CourseRow key={course.id} course={course} />
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Button asChild variant="outline" className="rounded-lg px-6">
                <Link href="/courses">
                  Explore more courses
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
