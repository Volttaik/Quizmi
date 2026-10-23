"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  HelpCircle,
  KeyRound,
  Loader2,
  Lock,
  PlayCircle,
  ShieldCheck,
  Target,
  Trophy,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { difficultyStyle, formatDuration } from "@/lib/format";
import type { QuizDetail } from "@/lib/types";

export default function QuizDetailPage() {
  const params = useParams() as { slug?: string };
  const slug = params?.slug ?? "";
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);

    fetch(`/api/quizzes/${slug}`)
      .then(async (response) => {
        if (response.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!response.ok) throw new Error("Could not load this quiz");
        return (await response.json()) as QuizDetail;
      })
      .then((data) => {
        if (active && data) setQuiz(data);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const startAttempt = async () => {
    if (!quiz) return;
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/quizzes/${quiz.slug}`);
      return;
    }

    setStarting(true);
    setError(null);
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: quiz.slug, accessCode: accessCode.trim() || undefined }),
      });
      const data = await response.json();

      if (response.status === 401) {
        router.push(`/sign-in?redirect_url=/quizzes/${quiz.slug}`);
        return;
      }
      if (!response.ok) {
        setError(data?.error ?? "Could not start this quiz");
        return;
      }
      router.push(`/exam/${data.id}`);
    } catch {
      setError("Could not start this quiz. Check your connection and try again.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="skeleton h-8 w-40 rounded-lg" />
          <div className="skeleton mt-6 h-40 rounded-2xl" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !quiz) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Quiz unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This quiz may have been unpublished or the link is incorrect.
          </p>
          <Link href="/quizzes" className="mt-6">
            <Button className="rounded-full">Back to library</Button>
          </Link>
        </div>
      </div>
    );
  }

  const difficulty = difficultyStyle(quiz.difficulty);
  const exhausted = quiz.attemptsRemaining !== null && quiz.attemptsRemaining <= 0;
  const resumeId = quiz.inProgressAttemptId;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/quizzes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quiz library
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${difficulty.className}`}
          >
            {difficulty.label}
          </span>
          {quiz.subject && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {quiz.subject}
            </span>
          )}
          {quiz.isRestricted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Lock className="h-3 w-3" /> Access code required
            </span>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
          {quiz.title}
        </h1>
        {quiz.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {quiz.description}
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: HelpCircle, label: "Questions", value: quiz.questionCount.toLocaleString() },
            { icon: Clock, label: "Time limit", value: formatDuration(quiz.durationMinutes) },
            { icon: Target, label: "Pass mark", value: `${quiz.passScore}%` },
            {
              icon: Trophy,
              label: "Attempts",
              value: quiz.maxAttempts
                ? `${quiz.attemptsUsed} of ${quiz.maxAttempts} used`
                : `${quiz.attemptsUsed} taken`,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/70 bg-card p-4">
              <item.icon className="h-4 w-4 text-primary" />
              <p className="mt-3 text-lg font-extrabold text-card-foreground">{item.value}</p>
              <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-border/70 bg-card p-6">
            <h2 className="text-base font-bold text-card-foreground">How this exam runs</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                Answers are scored on the server. Correct answers are only revealed after you submit.
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                {quiz.durationMinutes
                  ? `The timer starts immediately and submits automatically after ${formatDuration(quiz.durationMinutes)}.`
                  : "This quiz is untimed — take as long as you need."}
              </li>
              <li className="flex gap-3">
                <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                You can move between questions freely. Answers save automatically as you go.
              </li>
              <li className="flex gap-3">
                <Trophy className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                Pass mark is {quiz.passScore}%. Your full answer review is available immediately after submission.
              </li>
            </ul>

            {quiz.attemptsUsed > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-muted/50 p-4 text-center">
                <div>
                  <p className="text-lg font-extrabold text-foreground">{quiz.bestPercentage ?? 0}%</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">Your best</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-foreground">{quiz.lastPercentage ?? 0}%</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">Last score</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-foreground">
                    {quiz.averagePercentage ?? 0}%
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground">All takers</p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
            <h2 className="text-base font-bold text-card-foreground">
              {resumeId ? "You have an attempt in progress" : "Ready when you are"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {resumeId
                ? "Continue where you left off — the timer is still running."
                : "Make sure you have enough uninterrupted time before you begin."}
            </p>

            {quiz.isRestricted && !resumeId && (
              <div className="mt-5">
                <label htmlFor="access-code" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Access code
                </label>
                <div className="relative mt-2">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="access-code"
                    value={accessCode}
                    onChange={(event) => {
                      setAccessCode(event.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="Enter code"
                    autoComplete="off"
                    className="h-11 w-full rounded-xl border border-border/70 bg-background pl-10 pr-3 text-sm font-semibold uppercase tracking-wider text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </p>
            )}

            {exhausted ? (
              <div className="mt-5 rounded-xl bg-muted/60 p-4 text-center">
                <p className="text-sm font-bold text-foreground">No attempts left</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You have used all {quiz.maxAttempts} attempts for this quiz.
                </p>
                <Link href="/quizzes" className="mt-3 inline-block">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Find another quiz
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                onClick={startAttempt}
                disabled={starting || !isLoaded}
                className="mt-5 h-12 w-full rounded-full text-sm font-bold"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                  </>
                ) : resumeId ? (
                  <>
                    <PlayCircle className="h-4 w-4" /> Resume attempt
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    {isSignedIn ? "Start exam" : "Sign in to start"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              {resumeId
                ? "Your saved answers will be restored."
                : `${quiz.questionCount.toLocaleString()} questions · ${quiz.totalMarks.toLocaleString()} total marks`}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
