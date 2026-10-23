"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { animate, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Flame,
  LayoutDashboard,
  Loader2,
  Minus,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Motion";
import ShareResultButton from "@/views/ShareResultButton";
import { formatTimeTaken } from "@/lib/format";
import { useSessionRequest } from "@/lib/use-session-request";
import { attemptStatusMeta } from "@/lib/attempt-status";
import type { AttemptResult, ResultQuestion } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PAGE_SIZE = 20;

type Filter = "all" | "incorrect" | "correct" | "unanswered";

function assess(pct: number) {
  if (pct >= 85) return { label: "Excellent", tone: "text-success" };
  if (pct >= 65) return { label: "Good", tone: "text-foreground" };
  if (pct >= 45) return { label: "Fair", tone: "text-warning" };
  return { label: "Needs improvement", tone: "text-destructive" };
}

/** Question verdicts are three distinct states, not two. */
function verdict(question: ResultQuestion): {
  label: string;
  tone: string;
  icon: typeof Check;
} {
  if (question.selectedIndex === null) {
    return { label: "Not answered", tone: "text-warning", icon: Minus };
  }
  if (question.correct) return { label: "Correct", tone: "text-success", icon: Check };
  return { label: "Incorrect", tone: "text-destructive", icon: X };
}

/** Lumio's animated accuracy ring. */
function Ring({ pct }: { pct: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const controls = animate(0, pct, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [pct]);

  const r = 70;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative h-40 w-40 sm:h-44 sm:w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
        <motion.circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-4xl font-semibold">{shown}%</span>
        <span className="text-xs text-muted-foreground">accuracy</span>
      </div>
    </div>
  );
}

function OptionList({ question }: { question: ResultQuestion }) {
  if (question.options.length === 0) {
    return (
      <p className="mt-3 rounded-[5px] bg-muted px-3 py-2 text-xs text-muted-foreground">
        The options for this question were not stored with the attempt.
      </p>
    );
  }

  return (
    <ul className="mt-3 space-y-1.5">
      {question.options.map((option, index) => {
        const isCorrect = index === question.correctIndex;
        const isSelected = index === question.selectedIndex;
        return (
          <li
            key={`${question.id}-${index}`}
            className={`flex items-start gap-2.5 rounded-[5px] border px-3 py-2 text-sm ${
              isCorrect
                ? "border-success/40 bg-success-soft"
                : isSelected
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border bg-card"
            }`}
          >
            <span
              className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isCorrect
                  ? "bg-success text-primary-foreground"
                  : isSelected
                    ? "bg-destructive text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {LETTERS[index] ?? index + 1}
            </span>
            <span className="min-w-0 flex-1">{option}</span>
            <span className="ml-2 flex shrink-0 flex-col items-end gap-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {isSelected && <span className="text-destructive">Your answer</span>}
              {isCorrect && <span className="text-success">Correct answer</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function ResultPage() {
  const params = useParams() as { id?: string };
  const id = Number(params?.id);
  const router = useRouter();
  const sessionFetch = useSessionRequest();
  // Keep the fetcher in a ref: re-running the loader mid-review would reset
  // the learner's scroll position and filter.
  const sessionFetchRef = useRef(sessionFetch);
  sessionFetchRef.current = sessionFetch;
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inProgress, setInProgress] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [retaking, setRetaking] = useState(false);
  const reviewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setError("This result link is not valid.");
      setLoading(false);
      return;
    }

    let active = true;
    sessionFetchRef
      .current(`/api/attempts/${id}/result`, { cache: "no-store" })
      .then(async (outcome) => {
        if (!outcome.ok) {
          if (outcome.failure === "unauthenticated") {
            // Only a rejected *fresh* token is a real sign-out.
            router.replace(`/sign-in?redirect_url=/results/${id}`);
          } else {
            // A connection/Clerk problem is retryable, not a sign-out.
            throw new Error("We couldn't load this result just now. Try again in a moment.");
          }
          return null;
        }
        const response = outcome.response;
        if (response.status === 409) {
          setInProgress(true);
          return null;
        }
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error ?? "Could not load this result");
        return data as AttemptResult;
      })
      .then((data) => {
        if (active && data) setResult(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load this result");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, router]);

  const filtered = useMemo(() => {
    if (!result) return [];
    if (filter === "correct") return result.questions.filter((question) => question.correct);
    if (filter === "incorrect") {
      return result.questions.filter(
        (question) => question.selectedIndex !== null && !question.correct
      );
    }
    if (filter === "unanswered") {
      return result.questions.filter((question) => question.selectedIndex === null);
    }
    return result.questions;
  }, [result, filter]);

  useEffect(() => setVisible(PAGE_SIZE), [filter]);

  /**
   * Retake uses the same course, question count and timer as this attempt.
   * The server creates a new attempt row; the stored result below is never
   * overwritten, and attempt-limit rules still apply.
   */
  const retake = async () => {
    if (!result || retaking) return;
    setRetaking(true);
    try {
      const outcome = await sessionFetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: result.courseSlug,
          questionCount: result.totalQuestions > 0 ? result.totalQuestions : undefined,
          durationMinutes: result.durationMinutes,
          resultMode: result.resultMode,
        }),
      });

      if (!outcome.ok) {
        if (outcome.failure === "unauthenticated") {
          router.push(`/sign-in?redirect_url=/results/${result.id}`);
        } else {
          toast.error("We couldn't reach the server. Your result is safe — try again.");
        }
        return;
      }

      const data = await outcome.response.json().catch(() => null);
      if (!outcome.response.ok) {
        toast.error(data?.error ?? "Could not start a new attempt");
        return;
      }
      router.push(`/exam/${data.id}`);
    } catch {
      toast.error("Could not start a new attempt. Check your connection and try again.");
    } finally {
      setRetaking(false);
    }
  };

  const jumpToReview = (target: Filter) => {
    setFilter(target);
    setVisible(PAGE_SIZE);
    reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  if (inProgress) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-secondary">
          <Clock className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold sm:text-2xl">This attempt is still running</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit or finish the exam to see your result.
        </p>
        <Button asChild className="mt-6 h-11 px-6">
          <Link href={`/exam/${id}`}>Return to exam</Link>
        </Button>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold sm:text-2xl">{error ?? "Result unavailable"}</h1>
        <Button asChild className="mt-6 h-11 px-6">
          <Link href="/history">View history</Link>
        </Button>
      </div>
    );
  }

  const meta = attemptStatusMeta(result.status);
  const isNotSubmitted = !result.hasResult;
  const unanswered = result.unansweredCount;
  const incorrect = result.incorrectCount;
  const pct = result.percentage;
  const verdictLabel = assess(pct);
  const isExpired = result.status === "expired";
  const isTerminated = result.status === "terminated";
  const stats = [
    { icon: Check, label: "Correct", value: result.correctCount, tone: "text-success" },
    { icon: X, label: "Incorrect", value: incorrect, tone: "text-destructive" },
    { icon: Minus, label: "Unanswered", value: unanswered, tone: "text-warning" },
    {
      icon: Clock,
      label: "Time taken",
      value: formatTimeTaken(result.timeTakenSeconds),
      tone: "text-muted-foreground",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/history"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Attempt history
      </Link>

      {isNotSubmitted ? (
        <div className="mt-6 rounded-[5px] border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-secondary">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">{result.courseTitle}</p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">Attempt not submitted</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            This attempt ended before it was submitted, so no score was recorded. It stays in
            your history as <strong className="font-semibold">{meta.label.toLowerCase()}</strong>{" "}
            and is not counted as a completed attempt.
          </p>
          <dl className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3">
            <div className="rounded-[5px] bg-muted p-3">
              <dt className="text-xs text-muted-foreground">Started</dt>
              <dd className="mt-1 text-sm font-semibold">
                {new Date(result.startedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </dd>
            </div>
            <div className="rounded-[5px] bg-muted p-3">
              <dt className="text-xs text-muted-foreground">Answered</dt>
              <dd className="mt-1 text-sm font-semibold">
                {result.answeredCount}/{result.totalQuestions}
              </dd>
            </div>
          </dl>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => void retake()} disabled={retaking} className="h-11 px-5">
              {retaking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Take this quiz
                </>
              )}
            </Button>
            <Button asChild variant="outline" className="h-11 px-5">
              <Link href={`/courses/${result.courseSlug}`}>Back to course</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-5">
              <Link href="/history">History</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {(isExpired || isTerminated) && (
            <div className="mt-5 flex items-start gap-3 rounded-[5px] bg-secondary p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {isExpired
                  ? "Time ran out, so your saved answers were submitted."
                  : "This attempt ended because you left the quiz."}
                {unanswered > 0 &&
                  ` ${unanswered} unanswered question${unanswered === 1 ? " was" : "s were"} marked incorrect.`}
              </p>
            </div>
          )}

          <p className="mt-6 text-sm text-muted-foreground">{result.courseTitle}</p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">Your result</h1>

          <Reveal className="dotted-edge mt-5 flex flex-col items-center rounded-[5px] border border-border bg-card p-6 text-center shadow-md sm:p-8">
            <Ring pct={pct} />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className={`mt-4 font-serif text-2xl font-semibold ${verdictLabel.tone}`}
            >
              {verdictLabel.label}
            </motion.p>
            <p className="mt-1 text-muted-foreground">
              You scored {result.score} of {result.totalMarks} marks · pass mark{" "}
              {result.passScore}%
            </p>
            {pct >= 85 && <p className="font-hand mt-2 text-3xl text-accent">Outstanding work!</p>}

            {result.hasReview && (
              <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.08 }}
                    className="dotted-edge dotted-edge-sm rounded-[5px] bg-muted p-3.5 shadow-2xs"
                  >
                    <stat.icon className={`mx-auto h-4 w-4 ${stat.tone}`} />
                    <p className="mt-1 font-serif text-xl font-semibold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => void retake()} disabled={retaking} className="h-12 px-6">
                {retaking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retake quiz
                  </>
                )}
              </Button>
              {result.hasReview && (
                <Button variant="outline" onClick={() => jumpToReview("all")} className="h-12 px-6">
                  Review answers
                </Button>
              )}
              <Button asChild variant="outline" className="h-12 px-6">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>

            <div className="mt-4 flex w-full flex-col items-center justify-between gap-2 sm:flex-row">
              <ShareResultButton result={result} className="h-10 w-full sm:w-auto" />
              <Link
                href={`/courses/${result.courseSlug}`}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Back to course
              </Link>
            </div>
          </Reveal>

          {result.hasReview ? (
            <section ref={reviewRef} className="mt-10 scroll-mt-20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Trophy className="h-5 w-5" />
                  Question review
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { key: "all", label: "All" },
                      { key: "incorrect", label: "Incorrect" },
                      { key: "unanswered", label: "Unanswered" },
                      { key: "correct", label: "Correct" },
                    ] as Array<{ key: Filter; label: string }>
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFilter(tab.key)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        filter === tab.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-secondary"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="mt-4 rounded-[5px] border-2 border-dashed border-border p-8 text-center">
                  <p className="text-sm font-semibold">
                    {filter === "incorrect"
                      ? "No incorrect answers — excellent work."
                      : filter === "unanswered"
                        ? "You answered every question."
                        : "Nothing to show here."}
                  </p>
                </div>
              ) : (
                <>
                  <ol className="mt-4 space-y-3">
                    {filtered.slice(0, visible).map((question, index) => {
                      const item = verdict(question);
                      const Icon = item.icon;
                      const chapterLabel =
                        question.chapterNumber !== null
                          ? `Chapter ${question.chapterNumber}${
                              question.chapterTitle ? ` · ${question.chapterTitle}` : ""
                            }`
                          : question.chapterTitle;
                      return (
                        <li
                          key={question.id}
                          className="dotted-edge rounded-[5px] border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-5"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-foreground ${
                                question.selectedIndex === null
                                  ? "bg-warning"
                                  : question.correct
                                    ? "bg-success"
                                    : "bg-destructive"
                              }`}
                              aria-hidden
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="font-medium">
                                  {index + 1}. {question.prompt}
                                </p>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                                <span className={`font-semibold ${item.tone}`}>{item.label}</span>
                                {chapterLabel && (
                                  <span className="rounded-full bg-muted px-2 py-px text-[10px] font-semibold text-muted-foreground">
                                    {chapterLabel}
                                  </span>
                                )}
                                <span className="text-muted-foreground">
                                  {question.marksAwarded}/{question.marks} mark
                                  {question.marks === 1 ? "" : "s"}
                                </span>
                              </div>

                              <OptionList question={question} />

                              <p className="mt-3 text-sm">
                                Your answer:{" "}
                                <strong>
                                  {question.selectedIndex !== null
                                    ? `${LETTERS[question.selectedIndex]}. ${
                                        question.options[question.selectedIndex] ?? ""
                                      }`
                                    : "Not answered"}
                                </strong>
                              </p>
                              {!question.correct && (
                                <p className="text-sm text-success">
                                  Correct answer:{" "}
                                  <strong>
                                    {LETTERS[question.correctIndex]}.{" "}
                                    {question.options[question.correctIndex] ?? ""}
                                  </strong>
                                </p>
                              )}
                              {question.explanation && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {question.explanation}
                                </p>
                              )}
                              {question.reference && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Reference: {question.reference}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  {visible < filtered.length && (
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => setVisible((count) => count + PAGE_SIZE)}
                    >
                      Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
                    </Button>
                  )}
                </>
              )}
            </section>
          ) : (
            <p className="mt-8 flex items-center gap-2 rounded-[5px] bg-muted p-4 text-sm text-muted-foreground">
              <Flame className="h-4 w-4" />
              A detailed answer review is not available for this attempt. The score above is your
              recorded result.
            </p>
          )}
        </>
      )}
    </div>
  );
}
