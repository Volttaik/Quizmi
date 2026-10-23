"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleInfo,
  Clock,
  ListCheck,
  Lock,
  Play,
  ShieldCheck,
  Sparkles,
  Stopwatch,
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

const LETTERS = "ABCDEFGH".split("");

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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {course.code && (
            <span className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
              {course.code}
            </span>
          )}
          <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            Step 2 of 2 · Instructions
          </span>
        </div>

        <h1 className="mt-2.5 text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl">
          Assessment instructions
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Read this before you start {course.title}. It reflects the settings you just chose.
        </p>

        {resuming && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs font-semibold text-foreground">
            <Play className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            You have an assessment in progress. Starting resumes it with the settings it was created
            with, including its original timer.
          </p>
        )}

        {locked && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            <p className="flex items-center gap-2 font-bold">
              <Lock className="h-4 w-4" /> A verified purchase is required
            </p>
            <p className="mt-1">
              Complete payment on the course page first. The assessment questions and answer key stay
              protected until the server confirms access.
            </p>
          </div>
        )}

        {/* Settings summary */}
        <section className="mt-5 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Questions", value: String(preferences.questionCount), icon: ListCheck },
              { label: "Duration", value: durationLabel, icon: Clock },
              {
                label: "Result mode",
                value: isInstant ? "Instant Results" : "Results at the End",
                icon: Sparkles,
              },
              { label: "Pass mark", value: `${course.passScore}%`, icon: Check },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/50 p-3">
                <item.icon className="h-3.5 w-3.5 text-primary" />
                <p className="mt-1.5 text-sm font-extrabold leading-tight text-foreground">
                  {item.value}
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* A reachable start action near the top, before the longer rules. */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            Ready? The same Start Assessment action is also available below the rules.
          </p>
          <Button
            onClick={startAssessment}
            disabled={starting || !isLoaded || !canStart}
            className="h-11 rounded-lg px-6 text-sm font-bold"
          >
            {startLabel}
            {!starting && isLoaded && canStart && <Play className="h-4 w-4" />}
          </Button>
        </div>

        {/* Rules */}
        <section className="mt-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-bold text-foreground">How this assessment works</h2>

          <ul className="mt-3.5 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {isInstant ? (
              <>
                <li className="flex gap-2.5">
                  <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <span>
                    Select one option, then press <strong className="text-foreground">Submit answer</strong>.
                    The server checks it immediately and tells you whether it was correct.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>
                    After submitting, the correct answer and its explanation are shown when the
                    course provides them. Answer options are locked once submitted.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>
                    Use <strong className="text-foreground">Next question</strong> to continue. On the
                    final question the button becomes <strong className="text-foreground">View results</strong>,
                    which submits the whole attempt and calculates your score.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <ChevronLeft className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span>
                    Previous navigation is not available in Instant Results. Answer options are
                    locked once submitted, and each question moves you forward.
                  </span>
                </li>
              </>
            ) : (
              <>
                <li className="flex gap-2.5">
                  <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  <span>
                    Select one option per question. No correctness feedback is shown while the
                    assessment is running; the final score is calculated when you finish.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <ChevronLeft className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>
                    Use <strong className="text-foreground">Previous</strong> and{" "}
                    <strong className="text-foreground">Next</strong> to move between questions. Your
                    answers are saved as you go and are preserved when you go back.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>
                    Previous is disabled on the first question. On the final question,{" "}
                    <strong className="text-foreground">Finish assessment</strong> replaces Next and
                    asks you to confirm before submitting.
                  </span>
                </li>
              </>
            )}

            <li className="flex gap-2.5">
              <CircleInfo className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>
                Answers are chosen from options labelled{" "}
                {LETTERS.slice(0, 4).join(", ")}. Select by clicking or tapping an option; use the
                keyboard number keys or Tab and Enter where supported.
              </span>
            </li>

            <li className="flex gap-2.5">
              <Stopwatch className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>
                {isTimed
                  ? `You have ${durationLabel}. The countdown runs on the server and is displayed during the assessment.`
                  : "This assessment is unlimited. It never expires because of a timer; submit whenever you are ready."}
              </span>
            </li>

            {isTimed && (
              <li className="flex gap-2.5">
                <TriangleExclamation className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <span>
                  When the timer reaches zero the attempt ends automatically. Your latest saved
                  answers are scored, and the result is marked as expired.
                </span>
              </li>
            )}

            <li className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>
                Unanswered questions score zero and count toward the final result. The score is based
                on the answers submitted for all {preferences.questionCount} questions.
              </span>
            </li>

            <li className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
              <span>
                Scoring and answer validation happen on the server. The browser cannot fabricate a
                score, and the answer key is only revealed according to your result preference and,
                afterwards, the answer review.
              </span>
            </li>

            <li className="flex gap-2.5">
              <TriangleExclamation className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <span>
                Leaving the assessment is recorded as a departure. After two departures you see a
                warning; the third departure ends the attempt. The server owns the count, so
                refreshing the page does not reset it, and detection relies on browser signals so it
                cannot catch everything.
              </span>
            </li>
          </ul>
        </section>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
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
            className="h-12 rounded-lg px-7 text-sm font-bold"
          >
            {startLabel}
            {!starting && isLoaded && canStart && <Play className="h-4 w-4" />}
          </Button>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground sm:text-right">
          The attempt is created only when you press the Start Assessment button on this screen, and
          repeated clicks cannot create a second attempt. Need to change something?{" "}
          <Link
            href={`/courses/${course.slug}/configure?${query}`}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Edit settings
          </Link>
          .
        </p>

        <div className="mt-5 flex items-center justify-center">
          <Link
            href={`/courses/${course.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            Back to course
          </Link>
        </div>
      </main>
    </div>
  );
}
