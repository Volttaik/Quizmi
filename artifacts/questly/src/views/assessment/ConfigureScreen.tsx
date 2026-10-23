"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Infinity as InfinityIcon,
  Layers,
  ListChecks,
  Loader2,
  Minus,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Reveal } from "@/components/Motion";
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
  icon: typeof Sparkles;
}> = [
  {
    value: "instant",
    label: "Instant Results",
    summary: "Check each answer as you go.",
    icon: Sparkles,
  },
  {
    value: "end",
    label: "Results at the End",
    summary: "See your score when you finish.",
    icon: ListChecks,
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
  const [busy, setBusy] = useState(false);

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

  const available = Math.max(0, Math.min(course?.questionCount ?? 0, MAX_QUESTIONS_PER_ATTEMPT));

  const parsedCount = Number(countInput);
  const countValid = Number.isInteger(parsedCount) && parsedCount >= 1 && parsedCount <= available;

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

  const presets = Array.from(
    new Set(
      [5, 10, 20, ...QUESTION_COUNT_PRESETS, available].filter((value) => value <= available)
    )
  ).sort((a, b) => a - b);

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
    setBusy(true);
    router.push(nextUrl);
  }, [course, preferences, countValid, available, parsedCount, isSignedIn, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton mt-4 h-9 w-72" />
        <div className="skeleton mt-3 h-4 w-full max-w-xl" />
        <div className="skeleton mt-8 h-56 w-full" />
        <div className="skeleton mt-5 h-44 w-full" />
      </div>
    );
  }

  if (notFound || (!course && !error)) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold sm:text-2xl">Course unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This course may have been unpublished or the link is incorrect.
        </p>
        <Button asChild className="mt-6 h-11 px-6">
          <Link href="/courses">Back to courses</Link>
        </Button>
      </div>
    );
  }

  if (!course || !preferences) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold sm:text-2xl">Could not load this course</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild className="mt-6 h-11 px-6">
          <Link href={`/courses/${slug}/configure`}>Try again</Link>
        </Button>
      </div>
    );
  }

  const isInstant = preferences.resultMode === "instant";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={`/courses/${course.slug}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Course
      </Link>

      <Reveal className="mt-4">
        <h1 className="text-xl font-semibold sm:text-2xl">{course.title}</h1>
        <p className="mt-2.5 max-w-2xl text-sm text-muted-foreground">
          Each session draws a fresh, random set of questions. Answer, get feedback, and review
          everything at the end.
        </p>
      </Reveal>

      {course.inProgressAttemptId && (
        <p className="mt-5 flex items-start gap-2 text-sm text-foreground">
          <Play className="mt-0.5 h-4 w-4 shrink-0" />
          You have an assessment in progress. Starting again resumes it.
        </p>
      )}

      {locked && (
        <div className="mt-5 rounded-[5px] bg-secondary p-4">
          <p className="text-sm font-semibold">This course needs a verified purchase</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete payment on the course page to unlock the assessment.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href={`/courses/${course.slug}`}>
              Go to course
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {/* Number of questions */}
          <Reveal className="rounded-[5px] border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Number of questions</h2>
                <p className="text-sm text-muted-foreground">
                  {available.toLocaleString()} available in this course
                </p>
              </div>
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="mt-5 flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-card"
                onClick={() => selectCount((countValid ? parsedCount : preferences.questionCount) - 1)}
                disabled={!countValid || parsedCount <= 1}
                aria-label="Fewer questions"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-14 text-center font-serif text-3xl font-semibold" aria-live="polite">
                {countValid ? parsedCount : preferences.questionCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-card"
                onClick={() => selectCount((countValid ? parsedCount : preferences.questionCount) + 1)}
                disabled={!countValid || parsedCount >= available}
                aria-label="More questions"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Slider
              className="mt-5"
              min={1}
              max={Math.max(1, available)}
              step={1}
              value={[countValid ? parsedCount : preferences.questionCount]}
              onValueChange={([value]) => selectCount(value)}
              aria-label="Question count"
            />

            {presets.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {presets.map((value) => {
                  const selected = countValid && parsedCount === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectCount(value)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        selected ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
                      }`}
                    >
                      {value === available ? `All ${value}` : value}
                    </button>
                  );
                })}
              </div>
            )}

            {!countValid && (
              <p className="mt-3 text-sm text-destructive">
                {available === 0
                  ? "This course has no questions yet."
                  : `Enter a whole number from 1 to ${available}.`}
              </p>
            )}
          </Reveal>

          {/* Timer */}
          <Reveal
            delay={0.05}
            className="rounded-[5px] border border-border bg-card p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Timer</h2>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { value: true, label: "Timed", detail: "Race the clock", icon: Clock },
                { value: false, label: "Untimed", detail: "Take your time", icon: InfinityIcon },
              ].map((option) => {
                const selected = (preferences.durationMinutes !== null) === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      updatePreferences({
                        durationMinutes: option.value
                          ? preferences.durationMinutes ?? 30
                          : null,
                      })
                    }
                    className={`rounded-[5px] border-2 p-3.5 text-left transition-colors ${
                      selected
                        ? "border-accent bg-secondary"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <option.icon className="h-5 w-5" />
                    <p className="mt-2 font-semibold">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.detail}</p>
                  </button>
                );
              })}
            </div>

            {preferences.durationMinutes !== null && (
              <div className="mt-5 flex flex-wrap gap-2">
                {DURATION_OPTIONS.filter((option) => option.minutes !== null).map((option) => {
                  const selected = preferences.durationMinutes === option.minutes;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => updatePreferences({ durationMinutes: option.minutes })}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        selected ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
                      }`}
                    >
                      {option.minutes} min
                    </button>
                  );
                })}
              </div>
            )}
          </Reveal>

          {/* Result preference */}
          <Reveal
            delay={0.1}
            className="rounded-[5px] border border-border bg-card p-5 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-semibold">Results</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {RESULT_MODES.map((option) => {
                const selected = preferences.resultMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => updatePreferences({ resultMode: option.value })}
                    className={`rounded-[5px] border-2 p-3.5 text-left transition-colors ${
                      selected
                        ? "border-accent bg-secondary"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <option.icon className="h-5 w-5" />
                      {selected && <Check className="h-4 w-4 text-accent" />}
                    </div>
                    <p className="mt-2 font-semibold">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.summary}</p>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        {/* Session summary — Lumio's dark panel with the accent action. */}
        <Reveal
          delay={0.15}
          className="h-fit rounded-[5px] bg-primary p-5 text-primary-foreground shadow-md sm:p-6 lg:sticky lg:top-24"
        >
          <h2 className="text-lg font-semibold">Session summary</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-primary-foreground/70">Course</dt>
              <dd className="text-right font-semibold">{course.title}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-primary-foreground/70">Questions</dt>
              <dd className="font-semibold">{countValid ? parsedCount : preferences.questionCount} random</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-primary-foreground/70">Timer</dt>
              <dd className="font-semibold">
                {preferences.durationMinutes === null ? "Off" : `${preferences.durationMinutes} minutes`}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-primary-foreground/70">Results</dt>
              <dd className="text-right font-semibold">{isInstant ? "Instant" : "At the end"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-primary-foreground/70">Pass mark</dt>
              <dd className="font-semibold">{course.passScore}%</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-primary-foreground/70">
            Stay on the quiz page once you begin. Leaving may end your attempt.
          </p>

          {error && (
            <p className="mt-3 rounded-[5px] bg-destructive/20 px-3.5 py-2.5 text-xs" role="alert">
              {error}
            </p>
          )}

          <Button
            onClick={goNext}
            disabled={!canContinue || !isLoaded || busy}
            className="mt-5 h-11 w-full bg-accent text-[15px] text-accent-foreground hover:bg-accent/90"
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing…
              </>
            ) : !isLoaded ? (
              "Loading…"
            ) : locked ? (
              "Purchase required"
            ) : exhausted ? (
              "No attempts left"
            ) : available === 0 ? (
              "No questions yet"
            ) : !isSignedIn ? (
              "Sign in to continue"
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <Link
            href={`/courses/${course.slug}`}
            className="mt-3 flex items-center justify-center gap-2 text-xs text-primary-foreground/70 transition-colors hover:text-primary-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Back to course
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
