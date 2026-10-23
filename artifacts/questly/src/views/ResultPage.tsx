"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Button } from "@/components/ui/button";
import ShareResultButton from "@/views/ShareResultButton";
import { formatDate, formatTimeTaken } from "@/lib/format";
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
  const [retaking, setRetaking] = useState(false);
  const reviewRef = useRef<HTMLDivElement | null>(null);

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

  /**
   * Retake uses the same course, question count and timer as this attempt.
   * The server creates a new attempt row; the stored result below is never
   * overwritten, and attempt-limit rules still apply.
   */
  const retake = async () => {
    if (!result || retaking) return;
    setRetaking(true);
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: result.courseSlug,
          questionCount: result.totalQuestions > 0 ? result.totalQuestions : undefined,
          durationMinutes: result.durationMinutes,
          resultMode: result.resultMode,
        }),
      });
      const data = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push(`/sign-in?redirect_url=/results/${result.id}`);
        return;
      }
      if (!response.ok) {
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
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (inProgress) {
    return (
      <div className="bg-background">
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
      <div className="bg-background">
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
  const incorrect = result.questions.filter(
    (question) => question.selectedIndex !== null && !question.correct
  ).length;
  const isExpired = result.status === "expired";
  const isTerminated = result.status === "terminated";

  return (
    <div className="bg-background">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Attempt history
        </Link>

        {/* Score hero */}
        <section className="relative mt-5 overflow-hidden rounded-[2rem] brand-gradient p-6 text-white shadow-[0_30px_70px_-34px_rgba(67,45,160,0.7)] sm:p-8">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/15" />
            <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full border border-white/10" />
          </div>
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
                {result.subject ?? "General"} · {formatDate(result.submittedAt)}
              </p>
              <h1 className="mt-2 max-w-xl font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[2.1rem]">
                {result.courseTitle}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold text-white backdrop-blur">
                  {result.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {result.passed ? "Passed" : "Not passed"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11.5px] font-medium text-white/85 backdrop-blur">
                  Pass mark {result.passScore}%
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11.5px] font-medium text-white/85 backdrop-blur">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Assessment complete
                </span>
                {isExpired && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold text-white">
                    Time expired
                  </span>
                )}
                {isTerminated && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11.5px] font-semibold text-white">
                    <AlertTriangle className="h-3.5 w-3.5" /> Terminated
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="font-display text-[3.75rem] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[4.5rem]">
                {result.percentage}%
              </p>
              <p className="mt-2 text-[12.5px] font-medium text-white/70">
                {result.score} of {result.totalMarks} marks
              </p>
            </div>
          </div>
        </section>

        {isTerminated && (
          <div className="mt-4 rounded-2xl border border-warning/25 bg-warning-soft p-4 text-sm leading-relaxed text-warning-soft-foreground">
            This assessment was terminated automatically because you left it three times. Your last
            saved answers were scored and this attempt cannot be resumed. You can start a new
            assessment from the course page.
          </div>
        )}

        {/* Breakdown */}
        {result.hasReview ? (
        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[1.5rem] border border-border/80 bg-border/60 sm:grid-cols-4">
          {[
            { icon: CheckCircle2, label: "Correct", value: result.correctCount, tone: "text-success" },
            { icon: XCircle, label: "Incorrect", value: incorrect, tone: "text-danger" },
            { icon: Target, label: "Unanswered", value: unanswered, tone: "text-warning" },
            {
              icon: Clock,
              label: "Time taken",
              value: formatTimeTaken(result.timeTakenSeconds),
              tone: "text-accent",
            },
          ].map((item) => (
            <div key={item.label} className="bg-surface px-5 py-4">
              <dt className="flex items-center gap-2 text-[11.5px] font-semibold text-muted-foreground">
                <item.icon className={`h-3.5 w-3.5 ${item.tone}`} />
                {item.label}
              </dt>
              <dd className="mt-2 font-display text-[1.6rem] font-semibold leading-none text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
        ) : (
          <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4 text-sm leading-relaxed text-muted-foreground">
            A detailed answer review is not available for this attempt. The score shown above is
            your recorded result.
          </div>
        )}

        {/* Focus area: real, data-backed nudge toward the answers to review */}
        {result.hasReview && incorrect > 0 && (
          <button
            type="button"
            onClick={() => jumpToReview("incorrect")}
            className="mt-4 flex w-full items-start gap-3 rounded-2xl border border-warning/25 bg-warning-soft p-4 text-left transition-colors hover:border-warning/45"
          >
            <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-soft-foreground" />
            <span className="flex-1 text-sm leading-relaxed text-warning-soft-foreground">
              <span className="font-bold">Focus area:</span> review your {incorrect} incorrect
              answer{incorrect === 1 ? "" : "s"} — the explanations are in the answer review below.
            </span>
            <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-soft-foreground" />
          </button>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {result.hasReview && (
            <Button
              variant="outline"
              onClick={() => jumpToReview("all")}
              className="w-full rounded-full"
            >
              <BookOpen className="h-4 w-4" />
              Review Answers
            </Button>
          )}
          <ShareResultButton result={result} className="w-full rounded-full" />
          <Button
            variant="outline"
            onClick={() => void retake()}
            disabled={retaking}
            className="w-full rounded-full"
          >
            {retaking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Starting…
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" /> Retake Assessment
              </>
            )}
          </Button>
          <Link href={`/courses/${result.courseSlug}`} className="w-full">
            <Button variant="outline" className="w-full rounded-full">
              <BookOpen className="h-4 w-4" />
              Return to Course
            </Button>
          </Link>
        </div>

        {/* Review */}
        {result.hasReview && (
        <section ref={reviewRef} className="mt-8 scroll-mt-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-foreground">Answer review</h2>
            <ToggleButtonGroup
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([filter])}
              onSelectionChange={(keys) => {
                const next = Array.from(keys)[0];
                if (next) setFilter(String(next) as Filter);
              }}
              size="sm"
              className="rounded-full bg-surface-secondary p-1"
            >
              {(
                [
                  { key: "all", label: "All" },
                  { key: "incorrect", label: "Incorrect" },
                  { key: "correct", label: "Correct" },
                ] as Array<{ key: Filter; label: string }>
              ).map((tab) => (
                <ToggleButton key={tab.key} id={tab.key} className="rounded-full px-3 text-[12px] font-semibold">
                  {tab.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-border/70 bg-card p-8 text-center">
              <Trophy className="mx-auto mb-2 h-6 w-6 text-success" />
              <p className="text-sm font-semibold text-foreground">
                {filter === "incorrect" ? "No incorrect answers — excellent work." : "Nothing to show here."}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.slice(0, visible).map((question, index) => (
                <article
                  key={question.id}
                  className={`rounded-2xl border bg-surface p-5 ${
                    question.correct ? "border-success/25" : "border-danger/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                        question.correct
                          ? "bg-success-soft text-success-soft-foreground"
                          : "bg-danger-soft text-danger-soft-foreground"
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
                            ? "border-success/45 bg-success-soft text-foreground"
                            : isChosen
                              ? "border-danger/40 bg-danger-soft text-foreground"
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
                                <span className="text-[10px] font-bold uppercase tracking-wide text-success-soft-foreground">
                                  Correct
                                </span>
                              )}
                              {isChosen && !isCorrect && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-danger-soft-foreground">
                                  Your answer
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {question.selectedIndex === null && (
                        <p className="mt-2 text-xs font-semibold text-warning-soft-foreground">
                          You did not answer this question.
                        </p>
                      )}

                      {question.explanation && (
                        <div className="mt-3 rounded-xl bg-surface-secondary p-3.5">
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
