"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Lock, Play } from "lucide-react";

import Logo from "@/components/Brand";
import { ease } from "@/components/Motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MAX_QUESTIONS_PER_ATTEMPT } from "@/lib/course-config";
import {
  defaultPreferences,
  preferencesFromSearch,
  preferencesToQuery,
  readStoredPreferences,
  savePreferences,
  type AssessmentPreferences,
} from "@/lib/assessment-preferences";
import { unlockAudio } from "@/lib/sound";
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
  const [understood, setUnderstood] = useState(false);
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
          search !== "" &&
          ["count", "duration", "mode"].some((key) => new URLSearchParams(search).has(key));

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

    unlockAudio();
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
      <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton mt-6 h-8 w-64" />
        <div className="skeleton mt-6 h-40 w-full" />
        <div className="skeleton mt-4 h-12 w-full" />
      </div>
    );
  }

  if (notFound || (!course && !error)) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold sm:text-2xl">Assessment not available</h1>
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
        <h1 className="text-xl font-semibold sm:text-2xl">Could not load this assessment</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild className="mt-6 h-11 px-6">
          <Link href={`/courses/${slug}/configure`}>Back to setup</Link>
        </Button>
      </div>
    );
  }

  const isInstant = preferences.resultMode === "instant";
  const isTimed = preferences.durationMinutes !== null;
  const locked = !course.hasAccess;
  const exhausted = course.attemptsRemaining !== null && course.attemptsRemaining <= 0;
  const resuming = Boolean(course.inProgressAttemptId);
  const query = preferencesToQuery(preferences);
  const canStart = !locked && !exhausted && course.questionCount > 0;
  const startLabel = starting
    ? "Starting…"
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

  const items = [
    `This session has ${preferences.questionCount} randomly selected question${
      preferences.questionCount === 1 ? "" : "s"
    }.`,
    isTimed
      ? `You have ${preferences.durationMinutes} minutes. When time runs out, the session ends and unanswered questions count as incorrect.`
      : "There is no timer. Take as long as you need.",
    isInstant
      ? "Submit each answer to see immediately whether it was right, then continue."
      : "Your answers are saved as you go. The score and full review are revealed when you finish.",
    "Leaving is recorded as a departure. A third departure ends the attempt.",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className="mx-auto max-w-xl px-4 py-10 sm:py-14"
    >
      <Link
        href={`/courses/${course.slug}/configure?${query}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Change settings
      </Link>

      <div className="mt-6">
        <Logo />
      </div>
      <h1 className="mt-5 text-2xl font-semibold sm:text-3xl">Before you begin</h1>
      <p className="mt-2 text-sm text-muted-foreground">{course.title}</p>

      {resuming && (
        <p className="mt-5 flex items-start gap-2 rounded-[5px] bg-secondary p-3.5 text-sm">
          <Play className="mt-0.5 h-4 w-4 shrink-0" />
          You have an assessment in progress. Starting resumes it.
        </p>
      )}

      {locked && (
        <div className="mt-5 rounded-[5px] bg-secondary p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4" />
            A verified purchase is required
          </p>
          <p className="mt-1 text-muted-foreground">
            Complete payment on the course page to unlock the assessment.
          </p>
        </div>
      )}

      <ul className="mt-6 space-y-3.5">
        {items.map((text, index) => (
          <li key={index} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">
              {index + 1}
            </span>
            <p className="pt-0.5 text-sm leading-relaxed text-foreground/90 sm:text-[15px]">
              {text}
            </p>
          </li>
        ))}
      </ul>

      <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-[5px] border border-border bg-card p-4 shadow-sm transition-colors hover:border-foreground/20">
        <Checkbox
          checked={understood}
          onCheckedChange={(value) => setUnderstood(value === true)}
          className="mt-0.5"
        />
        <span className="text-sm">I understand that leaving the quiz may end my attempt.</span>
      </label>

      {error && (
        <p className="mt-4 rounded-[5px] bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        onClick={startAssessment}
        disabled={starting || !isLoaded || !canStart || !understood}
        className="mt-5 h-11 w-full text-[15px]"
      >
        {starting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Starting…
          </>
        ) : (
          <>
            {startLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <div className="mt-6 flex items-center justify-center">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to course
        </Link>
      </div>
    </motion.div>
  );
}
