"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  CircleInfo,
  Lock,
  Play,
  TriangleExclamation,
} from "@gravity-ui/icons";
import { Button } from "@/components/ui/button";
import { MAX_QUESTIONS_PER_ATTEMPT } from "@/lib/course-config";
import {
  defaultPreferences,
  preferencesFromSearch,
  preferencesToQuery,
  readStoredPreferences,
  savePreferences,
  type AssessmentPreferences,
} from "@/lib/assessment-preferences";
import type { CourseDetail } from "@/lib/types";

export default function InstructionScreen() {
  const params = useParams() as { slug?: string };
  const slug = params?.slug ?? "";
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [preferences, setPreferences] = useState<AssessmentPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const startingRef = useRef(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    fetch(`/api/courses/${slug}`)
      .then(async (response) => {
        if (response.status === 404) {
          setNotFound(true);
          return null;
        }
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error ?? "Could not load this course");
        return data as CourseDetail;
      })
      .then((data) => {
        if (!data) return;
        setCourse(data);

        const cap = Math.max(1, Math.min(data.questionCount, MAX_QUESTIONS_PER_ATTEMPT));
        const search = window.location.search;
        const stored = readStoredPreferences(data.slug);
        const hasQuery =
          search !== "" && ["count", "duration", "mode"].some((key) => new URLSearchParams(search).has(key));

        if (!hasQuery && !stored) {
          setRedirecting(true);
          router.replace(`/courses/${data.slug}/configure`);
          return;
        }

        let base = defaultPreferences(cap, data.durationMinutes);
        if (stored) {
          base = {
            ...stored,
            questionCount: Math.max(1, Math.min(stored.questionCount, cap)),
          };
        }

        const resolved = hasQuery ? preferencesFromSearch(search, cap, base) : base;
        setPreferences(resolved);
        savePreferences(data.slug, resolved);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load this course"))
      .finally(() => setLoading(false));
  }, [slug, router]);

  const startAssessment = useCallback(async () => {
    if (!course || !preferences || startingRef.current) return;

    if (!isSignedIn) {
      const query = preferencesToQuery(preferences);
      const nextUrl = `/courses/${course.slug}/instructions?${query}`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(nextUrl)}`);
      return;
    }

    startingRef.current = true;
    setStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: course.slug,
          questionCount: preferences.questionCount,
          durationMinutes: preferences.durationMinutes,
          resultMode: preferences.resultMode,
        }),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        const query = preferencesToQuery(preferences);
        const nextUrl = `/courses/${course.slug}/instructions?${query}`;
        router.push(`/sign-in?redirect_url=${encodeURIComponent(nextUrl)}`);
        return;
      }
      if (!response.ok) {
        setError(data?.error ?? "Could not start this assessment");
        return;
      }

      router.replace(`/exam/${data.id}`);
    } catch {
      setError("Could not start this assessment. Check your connection and try again.");
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }, [course, preferences, isSignedIn, router]);

  if (loading || redirecting) {
    return (
      <div className="bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="skeleton h-6 w-32 rounded-lg" />
          <div className="skeleton mt-4 h-9 w-64 rounded-lg" />
          <div className="skeleton mt-6 h-36 rounded-xl" />
          <div className="skeleton mt-4 h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || (!course && !error)) {
    return (
      <div className="bg-background">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <CircleInfo className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Assessment not available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This course may have been unpublished or the link is incorrect.
          </p>
          <Button asChild className="mt-6 rounded-lg">
            <Link href="/courses">Back to courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!course || !preferences) {
    return (
      <div className="bg-background">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <TriangleExclamation className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Could not load this assessment</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="mt-6 rounded-lg">
            <Link href={`/courses/${slug}/configure`}>Back to configuration</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isInstant = preferences.resultMode === "instant";
  const isTimed = preferences.durationMinutes !== null;
  const locked = !course.hasAccess;
  const exhausted = course.attemptsRemaining !== null && course.attemptsRemaining <= 0;
  const resuming = Boolean(course.inProgressAttemptId);
  const query = preferencesToQuery(preferences);
  const durationLabel =
    preferences.durationMinutes === null
      ? "Unlimited"
      : `${preferences.durationMinutes} minutes`;
  const canStart = !locked && !exhausted && course.questionCount > 0;
  const startLabel = starting
    ? "Starting assessment…"
    : !isLoaded
      ? "Loading…"
      : locked
        ? "Purchase required"
        : exhausted
          ? "No attempts left"
          : course.questionCount === 0
            ? "No questions yet"
            : !isSignedIn
              ? "Sign in to start"
              : resuming
                ? "Resume Assessment"
                : "Start Assessment";

  return (
    <div className="bg-background">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <Link
          href={`/courses/${course.slug}/configure?${query}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Change settings
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="eyebrow">Step 2 of 2 · Instructions</span>
          {course.code && (
            <span className="rounded-full bg-accent-soft px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-accent-soft-foreground">
              {course.code}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-display-lg text-foreground">Before you begin.</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">{course.title}</p>

        {resuming && (
          <p className="mt-5 flex items-start gap-2 text-[12.5px] font-medium text-accent-soft-foreground">
            <Play className="mt-0.5 h-4 w-4 flex-shrink-0" />
            You have an assessment in progress. Starting resumes it.
          </p>
        )}

        {locked && (
          <div className="mt-5 rounded-2xl border border-warning/25 bg-warning-soft p-4 text-xs leading-relaxed text-warning-soft-foreground">
            <p className="flex items-center gap-2 font-bold">
              <Lock className="h-4 w-4" /> A verified purchase is required
            </p>
            <p className="mt-1">Complete payment on the course page to unlock the assessment.</p>
          </div>
        )}

        {/* Settings summary */}
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border/70 py-4 sm:grid-cols-4">
          {[
            { label: "Questions", value: String(preferences.questionCount) },
            { label: "Time Limit", value: durationLabel },
            { label: "Results", value: isInstant ? "Instant" : "At the End" },
            { label: "Pass Mark", value: `${course.passScore}%` },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 font-display text-[15px] font-semibold leading-tight text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Rules */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-foreground">How it works</h2>

          <ul className="mt-3 divide-y divide-border/70 border-y border-border/70 text-[13.5px] leading-relaxed text-muted-foreground">
            {isInstant ? (
              <>
                <li className="py-3">
                  Choose an answer, then tap{" "}
                  <strong className="font-semibold text-foreground">Submit Answer</strong> to see if
                  it was right.
                </li>
                <li className="py-3">
                  Submitted answers are locked. Read the explanation if there is one, then tap{" "}
                  <strong className="font-semibold text-foreground">Next Question</strong>.
                </li>
                <li className="py-3">
                  <strong className="font-semibold text-foreground">View Results</strong> on the last
                  question shows your score.
                </li>
              </>
            ) : (
              <>
                <li className="py-3">
                  Choose an answer for each question. Your answers save as you go.
                </li>
                <li className="py-3">
                  Use <strong className="font-semibold text-foreground">Previous</strong> and{" "}
                  <strong className="font-semibold text-foreground">Next</strong> to move around, and
                  change an answer at any time.
                </li>
                <li className="py-3">
                  <strong className="font-semibold text-foreground">Finish Assessment</strong> on the
                  last question shows your score.
                </li>
              </>
            )}

            <li className="py-3">
              {isTimed
                ? `You have ${durationLabel}. When it runs out, the assessment ends and your saved answers are scored.`
                : "There is no time limit."}
            </li>

            <li className="py-3">Unanswered questions score zero.</li>

            <li className="py-3">
              Leaving is recorded as a departure. The third departure ends the attempt.
            </li>
          </ul>
        </section>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger-soft-foreground">
            <TriangleExclamation className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}

        {/* Start action directly beneath the instructions */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/courses/${course.slug}/configure?${query}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Change settings
          </Link>

          <Button
            onClick={startAssessment}
            disabled={starting || !isLoaded || !canStart}
            className="h-12 rounded-full px-8 text-sm font-semibold shadow-[0_16px_34px_-18px_rgba(91,75,255,0.9)]"
          >
            {startLabel}
            {!starting && isLoaded && canStart && <Play className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mt-5 flex items-center justify-center">
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Course
          </Link>
        </div>
      </main>
    </div>
  );
}
