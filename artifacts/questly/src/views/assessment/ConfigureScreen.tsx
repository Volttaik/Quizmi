"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleInfo,
  Lock,
  Play,
  TriangleExclamation,
} from "@gravity-ui/icons";
import { Button } from "@/components/ui/button";
import {
  DURATION_OPTIONS,
  MAX_QUESTIONS_PER_ATTEMPT,
  QUESTION_COUNT_PRESETS,
  type ResultMode,
} from "@/lib/course-config";
import {
  defaultPreferences,
  preferencesFromSearch,
  preferencesToQuery,
  readStoredPreferences,
  savePreferences,
  type AssessmentPreferences,
} from "@/lib/assessment-preferences";
import type { CourseDetail } from "@/lib/types";

const RESULT_MODES: Array<{
  value: ResultMode;
  label: string;
  summary: string;
}> = [
  {
    value: "instant",
    label: "Instant Results",
    summary: "Check each answer as you go.",
  },
  {
    value: "end",
    label: "Results at the End",
    summary: "See your score when you finish.",
  },
];

export default function ConfigureScreen() {
  const params = useParams() as { slug?: string };
  const slug = params?.slug ?? "";
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<AssessmentPreferences | null>(null);
  const [countInput, setCountInput] = useState("20");

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
        const fallback = defaultPreferences(cap, data.durationMinutes);
        const stored = readStoredPreferences(data.slug);
        let initial = fallback;

        if (stored) {
          initial = {
            ...stored,
            questionCount: Math.max(1, Math.min(stored.questionCount, cap)),
          };
        }

        const search = window.location.search;
        if (search && ["count", "duration", "mode"].some((key) => new URLSearchParams(search).has(key))) {
          initial = preferencesFromSearch(search, cap, initial);
        }

        setPreferences(initial);
        setCountInput(String(initial.questionCount));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load this course"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug || !preferences) return;
    savePreferences(slug, preferences);
  }, [slug, preferences]);

  const available = Math.max(
    0,
    Math.min(course?.questionCount ?? 0, MAX_QUESTIONS_PER_ATTEMPT)
  );

  const countPresets = useMemo(() => {
    if (available <= 0) return [];
    const values = new Set<number>();
    for (const value of QUESTION_COUNT_PRESETS) {
      if (value <= available) values.add(value);
    }
    values.add(Math.min(20, available));
    values.add(available);
    return Array.from(values).sort((a, b) => a - b);
  }, [available]);

  const parsedCount = Number(countInput);
  const countValid =
    Number.isInteger(parsedCount) && parsedCount >= 1 && parsedCount <= available;

  const selectCount = (value: number) => {
    const next = Math.max(1, Math.min(value, available));
    setCountInput(String(next));
    setPreferences((current) => (current ? { ...current, questionCount: next } : current));
  };

  const updatePreferences = (patch: Partial<AssessmentPreferences>) => {
    setPreferences((current) => (current ? { ...current, ...patch } : current));
  };

  const locked = Boolean(course && !course.hasAccess);
  const exhausted = Boolean(
    course && course.attemptsRemaining !== null && course.attemptsRemaining <= 0
  );
  const canContinue =
    Boolean(course) && countValid && !locked && !exhausted && available > 0 && Boolean(preferences);

  const goNext = useCallback(() => {
    if (!course || !preferences || !countValid) {
      setError(`Choose between 1 and ${available} questions.`);
      return;
    }
    const next: AssessmentPreferences = {
      questionCount: parsedCount,
      durationMinutes: preferences.durationMinutes,
      resultMode: preferences.resultMode,
    };
    savePreferences(course.slug, next);
    const nextUrl = `/courses/${course.slug}/instructions?${preferencesToQuery(next)}`;
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=${encodeURIComponent(nextUrl)}`);
      return;
    }
    router.push(nextUrl);
  }, [course, preferences, countValid, available, parsedCount, isSignedIn, router]);

  if (loading) {
    return (
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="skeleton h-6 w-28 rounded-lg" />
          <div className="skeleton mt-4 h-9 w-72 rounded-lg" />
          <div className="skeleton mt-6 h-40 rounded-xl" />
          <div className="skeleton mt-4 h-32 rounded-xl" />
          <div className="skeleton mt-4 h-40 rounded-xl" />
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
          <h1 className="text-xl font-extrabold text-foreground">Course unavailable</h1>
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
          <h1 className="text-xl font-extrabold text-foreground">Could not load this course</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="mt-6 rounded-lg">
            <Link href={`/courses/${slug}`}>Back to course</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Course details
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="eyebrow">Step 1 of 2 · Configuration</span>
          {course.code && (
            <span className="rounded-full bg-accent-soft px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-accent-soft-foreground">
              {course.code}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-display-lg text-foreground">Set up your assessment.</h1>
        <p className="mt-2 text-[14px] text-muted-foreground">{course.title}</p>

        {course.inProgressAttemptId && (
          <p className="mt-5 flex items-start gap-2 text-[12.5px] font-medium text-accent-soft-foreground">
            <Play className="mt-0.5 h-4 w-4 flex-shrink-0" />
            You have an assessment in progress. Starting again resumes it.
          </p>
        )}

        {locked && (
          <div className="mt-5 rounded-2xl border border-warning/25 bg-warning-soft p-4">
            <p className="flex items-start gap-2 text-sm font-semibold text-warning-soft-foreground">
              <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
              This course needs a verified purchase
            </p>
            <p className="mt-1 text-xs leading-relaxed text-warning-soft-foreground/85">
              Complete payment on the course page to unlock the assessment.
            </p>
            <Button asChild size="sm" className="mt-3 rounded-lg">
              <Link href={`/courses/${course.slug}`}>
                Go to course
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-8 divide-y divide-border/70 border-y border-border/70">
        {/* A. Duration */}
        <section className="py-6 sm:py-7">
          <h2 className="font-display text-lg font-semibold text-foreground">Time Limit</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            The countdown starts when you begin.
          </p>

          <div
            className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
            role="radiogroup"
            aria-label="Assessment duration"
          >
            {DURATION_OPTIONS.map((option) => {
              const selected = preferences.durationMinutes === option.minutes;
              return (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => updatePreferences({ durationMinutes: option.minutes })}
                  className={`flex min-h-[4.25rem] flex-col items-start justify-center rounded-2xl border px-3.5 py-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 ${
                    selected
                      ? "border-accent bg-accent-soft shadow-[0_10px_24px_-20px_rgba(91,75,255,0.8)]"
                      : "border-border bg-background text-foreground hover:border-accent/40"
                  }`}
                >
                  <span className={`text-[13.5px] font-semibold ${selected ? "text-accent-soft-foreground" : "text-foreground"}`}>
                    {option.minutes === null ? "Unlimited" : `${option.minutes} minutes`}
                  </span>
                  <span
                    className={`mt-0.5 text-[11px] font-medium ${
                      selected ? "text-accent-soft-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {option.minutes === null ? "No deadline" : "Timed"}
                  </span>
                </button>
              );
            })}
          </div>

        </section>

        {/* B. Question count */}
        <section className="py-6 sm:py-7">
          <h2 className="font-display text-lg font-semibold text-foreground">Questions</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {available.toLocaleString()} available. A random set is picked when you start.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl"
              onClick={() => selectCount((countValid ? parsedCount : preferences.questionCount) - 5)}
              disabled={!countValid || parsedCount <= 1}
              aria-label="Fewer questions"
            >
              −
            </Button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={available}
              value={countInput}
              onChange={(event) => {
                const value = event.target.value;
                setCountInput(value);
                const parsed = Number(value);
                if (Number.isInteger(parsed) && parsed >= 1 && parsed <= available) {
                  updatePreferences({ questionCount: parsed });
                }
              }}
              onBlur={() => {
                if (!countValid) selectCount(preferences.questionCount);
              }}
              aria-label="Number of questions"
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-center font-display text-lg font-semibold text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl"
              onClick={() => selectCount((countValid ? parsedCount : preferences.questionCount) + 5)}
              disabled={!countValid || parsedCount >= available}
              aria-label="More questions"
            >
              +
            </Button>
          </div>

          {!countValid && (
            <p className="mt-2 text-xs font-semibold text-destructive">
              {available === 0
                ? "This course has no questions yet."
                : `Enter a whole number from 1 to ${available}.`}
            </p>
          )}

          {countPresets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {countPresets.map((value) => {
                const selected = countValid && parsedCount === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectCount(value)}
                    aria-pressed={selected}
                    className={`min-h-9 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                      selected
                        ? "border-accent bg-accent-soft text-accent-soft-foreground"
                        : "border-border text-muted-foreground hover:border-accent/40 hover:text-foreground"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* C. Result preference */}
        <section className="py-6 sm:py-7">
          <h2 className="font-display text-lg font-semibold text-foreground">Results</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Choose when you see your score.</p>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Result preference">
            {RESULT_MODES.map((mode) => {
              const selected = preferences.resultMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => updatePreferences({ resultMode: mode.value })}
                  className={`flex flex-col rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 ${
                    selected
                      ? "border-accent bg-accent-soft"
                      : "border-border bg-background hover:border-accent/40"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                        selected ? "bg-accent text-accent-foreground" : "bg-surface-secondary text-muted-foreground"
                      }`}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </span>
                    <span className="font-display text-[15px] font-semibold text-foreground">{mode.label}</span>
                  </span>
                  <span className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    {mode.summary}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        </div>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger-soft-foreground">
            <TriangleExclamation className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}

        {/* D. Navigation directly beneath the configuration */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            onClick={goNext}
            disabled={!canContinue || !isLoaded}
            className="h-12 rounded-full px-8 text-sm font-semibold shadow-[0_14px_30px_-18px_rgba(91,75,255,0.9)]"
          >
            {!isLoaded
              ? "Loading…"
              : locked
                ? "Purchase required"
                : exhausted
                  ? "No attempts left"
                  : available === 0
                    ? "No questions yet"
                    : !isSignedIn
                      ? "Sign in to continue"
                      : "Next"}
            {canContinue && isLoaded && isSignedIn && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>

      </main>
    </div>
  );
}
