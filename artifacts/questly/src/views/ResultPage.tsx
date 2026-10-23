"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatDate,
  formatTimeTaken,
  scoreClasses,
} from "@/lib/format";
import type { AttemptResult } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PAGE_SIZE = 20;

type Filter = "all" | "incorrect" | "correct";

export default function ResultPage() {
  const params = useParams() as { id?: string };
  const id = Number(params?.id);
  const router = useRouter();

  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inProgress, setInProgress] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setError("This result link is not valid.");
      setLoading(false);
      return;
    }

    let active = true;
    fetch(`/api/attempts/${id}/result`)
      .then(async (response) => {
        if (response.status === 401) {
          router.replace(`/sign-in?redirect_url=/results/${id}`);
          return null;
        }
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
    if (filter === "incorrect") return result.questions.filter((question) => !question.correct);
    return result.questions;
  }, [result, filter]);

  useEffect(() => setVisible(PAGE_SIZE), [filter]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (inProgress) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Clock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">This attempt is still running</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit or finish the exam to see your result.
          </p>
          <Link href={`/exam/${id}`} className="mt-6">
            <Button className="rounded-full">Return to exam</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <XCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">
            {error ?? "Result unavailable"}
          </h1>
          <Link href="/history" className="mt-6">
            <Button className="rounded-full">View history</Button>
          </Link>
        </div>
      </div>
    );
  }

  const unanswered = result.questions.filter((question) => question.selectedIndex === null).length;
  const incorrect = result.totalQuestions - result.correctCount;
  const isExpired = result.status === "expired";
  const isTerminated = result.status === "terminated";

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Attempt history
        </Link>

        {/* Score hero */}
        <section
          className={`mt-5 overflow-hidden rounded-3xl border p-6 ${
            result.passed
              ? "border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card"
              : "border-rose-500/25 bg-gradient-to-br from-rose-500/10 via-card to-card"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {result.subject ?? "General"} · {formatDate(result.submittedAt)}
              </p>
              <h1 className="mt-1.5 text-2xl font-extrabold leading-tight text-foreground">
                {result.courseTitle}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
                    result.passed
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {result.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {result.passed ? "Passed" : "Not passed"}
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Pass mark {result.passScore}%
                </span>
                {isExpired && (
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                    Time expired
                  </span>
                )}
                {isTerminated && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" /> Terminated
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className={`text-5xl font-black leading-none ${scoreClasses(result.percentage)}`}>
                {result.percentage}%
              </p>
              <p className="mt-1.5 text-sm font-semibold text-muted-foreground">
                {result.score} / {result.totalMarks} marks
              </p>
            </div>
          </div>
        </section>

        {isTerminated && (
          <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            This assessment was terminated automatically because you left it three times. Your last
            saved answers were scored and this attempt cannot be resumed. You can start a new
            assessment from the course page.
          </div>
        )}

        {/* Breakdown */}
        {result.hasReview ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: CheckCircle2, label: "Correct", value: result.correctCount, tone: "text-emerald-500" },
            { icon: XCircle, label: "Incorrect", value: incorrect, tone: "text-rose-500" },
            { icon: Target, label: "Unanswered", value: unanswered, tone: "text-amber-500" },
            {
              icon: Clock,
              label: "Time taken",
              value: formatTimeTaken(result.timeTakenSeconds),
              tone: "text-primary",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/70 bg-card p-4">
              <item.icon className={`h-4 w-4 ${item.tone}`} />
              <p className="mt-2.5 text-xl font-extrabold text-card-foreground">{item.value}</p>
              <p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            A detailed answer review is not available for this attempt. The score shown above is
            your recorded result.
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link href={`/courses/${result.courseSlug}`} className="flex-1">
            <Button className="w-full rounded-full">
              <RotateCcw className="h-4 w-4" />
              Open this course
            </Button>
          </Link>
          <Link href="/courses" className="flex-1">
            <Button variant="outline" className="w-full rounded-full">
              <BookOpen className="h-4 w-4" />
              Browse courses
            </Button>
          </Link>
        </div>

        {/* Review */}
        {result.hasReview && (
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-foreground">Answer review</h2>
            <div className="flex items-center gap-1 rounded-full bg-muted p-1">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "incorrect", label: "Incorrect" },
                  { key: "correct", label: "Correct" },
                ] as Array<{ key: Filter; label: string }>
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  aria-pressed={filter === tab.key}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                    filter === tab.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-border/70 bg-card p-8 text-center">
              <Trophy className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
              <p className="text-sm font-semibold text-foreground">
                {filter === "incorrect" ? "No incorrect answers — excellent work." : "Nothing to show here."}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.slice(0, visible).map((question, index) => (
                <article
                  key={question.id}
                  className={`rounded-2xl border bg-card p-5 ${
                    question.correct ? "border-emerald-500/25" : "border-rose-500/25"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                        question.correct
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-relaxed text-card-foreground">
                        {question.prompt}
                      </p>

                      <div className="mt-3 space-y-1.5">
                        {question.options.map((option, optionIndex) => {
                          const isCorrect = optionIndex === question.correctIndex;
                          const isChosen = optionIndex === question.selectedIndex;
                          const classes = isCorrect
                            ? "border-emerald-500/50 bg-emerald-500/5 text-foreground"
                            : isChosen
                              ? "border-rose-500/50 bg-rose-500/5 text-foreground"
                              : "border-border/60 text-muted-foreground";

                          return (
                            <div
                              key={optionIndex}
                              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm ${classes}`}
                            >
                              <span className="mt-0.5 text-xs font-extrabold">
                                {LETTERS[optionIndex] ?? optionIndex + 1}
                              </span>
                              <span className="flex-1">{option}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                  Correct
                                </span>
                              )}
                              {isChosen && !isCorrect && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                                  Your answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {question.selectedIndex === null && (
                        <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          You did not answer this question.
                        </p>
                      )}

                      {question.explanation && (
                        <div className="mt-3 rounded-xl bg-muted/60 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Explanation
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                            {question.explanation}
                          </p>
                          {question.reference && (
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              Reference: {question.reference}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              {visible < filtered.length && (
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => setVisible((count) => count + PAGE_SIZE)}
                >
                  Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
                </Button>
              )}
            </div>
          )}
        </section>
        )}
      </main>
    </div>
  );
}
