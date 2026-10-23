"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  Flag,
  Loader2,
  Send,
  ShieldAlert,
  Timer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCountdown } from "@/lib/format";
import type { AttemptState } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PALETTE_PAGE_SIZE = 60;
const AUTOSAVE_DELAY = 650;
const CLIENT_DEPARTURE_DEDUPE = 5000;

type SaveState = "idle" | "saving" | "saved" | "error";

export default function ExamPage() {
  const params = useParams() as { attemptId?: string };
  const attemptId = Number(params?.attemptId);
  const router = useRouter();

  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [terminated, setTerminated] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palettePage, setPalettePage] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveNonce, setSaveNonce] = useState(0);

  const dirtyRef = useRef<Set<number>>(new Set());
  const savingRef = useRef(false);
  const autoSubmitted = useRef(false);
  const finishedRef = useRef(false);
  const submitRef = useRef<() => Promise<void>>(async () => {});
  const lastDepartureRef = useRef(0);
  const attemptRef = useRef<AttemptState | null>(null);
  const answersRef = useRef(answers);

  answersRef.current = answers;
  attemptRef.current = attempt;

  /* ── Load the attempt ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!Number.isFinite(attemptId) || attemptId <= 0) {
      setLoadError("This attempt link is not valid.");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetch(`/api/attempts/${attemptId}`)
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (response.status === 401) {
          router.replace(`/sign-in?redirect_url=/exam/${attemptId}`);
          return null;
        }
        if (!response.ok) throw new Error(data?.error ?? "Could not load this attempt");
        return data as AttemptState;
      })
      .then((data) => {
        if (!active || !data) return;

        if (data.status === "terminated") {
          setAttempt(data);
          setTerminated(true);
          return;
        }
        if (data.status !== "in_progress") {
          finishedRef.current = true;
          router.replace(`/results/${attemptId}`);
          return;
        }

        const initial: Record<number, number | null> = {};
        for (const answer of data.answers) initial[answer.questionId] = answer.selectedIndex;

        setAttempt(data);
        setAnswers(initial);
        setDeadline(
          data.secondsRemaining !== null ? Date.now() + data.secondsRemaining * 1000 : null
        );
      })
      .catch((err: unknown) => {
        if (active) setLoadError(err instanceof Error ? err.message : "Could not load this attempt");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [attemptId, router]);

  /* ── Clock ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (deadline === null) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [deadline]);

  const secondsLeft = deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));
  const urgent = secondsLeft !== null && secondsLeft <= 60;

  /* ── Incremental autosave ─────────────────────────────────────────────── */
  const persistDirty = useCallback(async () => {
    const currentAttempt = attemptRef.current;
    if (!currentAttempt || currentAttempt.status !== "in_progress") return;
    // Serialise saves so two overlapping merges cannot drop a selection.
    if (savingRef.current) return;

    const ids = Array.from(dirtyRef.current);
    if (ids.length === 0) return;

    const sent = ids.map((questionId) => ({
      questionId,
      selectedIndex: answersRef.current[questionId] ?? null,
    }));
    for (const id of ids) dirtyRef.current.delete(id);

    savingRef.current = true;
    setSaveState("saving");
    try {
      const response = await fetch(`/api/attempts/${currentAttempt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: sent }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error("save failed");

      if (data?.status && data.status !== "in_progress") {
        finishedRef.current = true;
        router.replace(`/results/${currentAttempt.id}`);
        return;
      }
      setSaveState("saved");
    } catch {
      // Keep the changed answers dirty so the next attempt retries them.
      for (const item of sent) dirtyRef.current.add(item.questionId);
      setSaveState("error");
      // Retry after a short delay; a transient network blip should not lose work.
      setTimeout(() => setSaveNonce((value) => value + 1), 2000);
    } finally {
      savingRef.current = false;
      if (dirtyRef.current.size > 0) setSaveNonce((value) => value + 1);
    }
  }, [router]);

  useEffect(() => {
    if (!attempt) return;
    if (dirtyRef.current.size === 0) return;

    const timer = setTimeout(() => {
      void persistDirty();
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [answers, attempt, persistDirty, saveNonce]);

  /* ── Submission ───────────────────────────────────────────────────────── */
  const submit = useCallback(async () => {
    const currentAttempt = attemptRef.current;
    if (!currentAttempt || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const payload = Object.entries(answersRef.current).map(([questionId, selectedIndex]) => ({
      questionId: Number(questionId),
      selectedIndex,
    }));

    try {
      const response = await fetch(`/api/attempts/${currentAttempt.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? "Could not submit your assessment");

      finishedRef.current = true;
      router.replace(`/results/${currentAttempt.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not submit your assessment"
      );
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }, [router, submitting]);

  submitRef.current = submit;

  useEffect(() => {
    if (secondsLeft === 0 && attempt && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submitRef.current();
    }
  }, [secondsLeft, attempt]);

  /* ── Departure enforcement ────────────────────────────────────────────── */
  const sendDeparture = useCallback((reason: string) => {
    const currentAttempt = attemptRef.current;
    if (!currentAttempt || currentAttempt.status !== "in_progress" || finishedRef.current) {
      return;
    }

    const nowMs = Date.now();
    if (nowMs - lastDepartureRef.current < CLIENT_DEPARTURE_DEDUPE) return;
    lastDepartureRef.current = nowMs;

    const body = JSON.stringify({ reason });
    const url = `/api/attempts/${currentAttempt.id}/departure`;

    try {
      const sent = navigator.sendBeacon(
        url,
        new Blob([body], { type: "application/json" })
      );
      if (sent) return;
    } catch {
      // Fall through to a keepalive fetch.
    }

    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, []);

  const refreshAttempt = useCallback(async () => {
    const currentAttempt = attemptRef.current;
    if (!currentAttempt) return;

    try {
      const response = await fetch(`/api/attempts/${currentAttempt.id}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as AttemptState;
      setAttempt(data);

      if (data.status === "terminated") {
        finishedRef.current = true;
        setTerminated(true);
        return;
      }
      if (data.status !== "in_progress") {
        finishedRef.current = true;
        router.replace(`/results/${currentAttempt.id}`);
        return;
      }
      if (data.secondsRemaining !== null) {
        setDeadline(Date.now() + data.secondsRemaining * 1000);
      }
    } catch {
      // A transient network failure leaves the local attempt intact.
    }
  }, [router]);

  useEffect(() => {
    if (!attempt) return;

    const onPageHide = () => {
      if (finishedRef.current) return;
      // Save the last selection before the page freezes where possible.
      if (dirtyRef.current.size > 0) {
        const currentAttempt = attemptRef.current;
        if (currentAttempt) {
          const payload = Array.from(dirtyRef.current).map((questionId) => ({
            questionId,
            selectedIndex: answersRef.current[questionId] ?? null,
          }));
          void fetch(`/api/attempts/${currentAttempt.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: payload }),
            keepalive: true,
          }).catch(() => {});
        }
      }
      sendDeparture("page unloaded");
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        sendDeparture("tab hidden");
      } else {
        // The server may have terminated the attempt while we were away.
        void refreshAttempt();
      }
    };

    const onPopState = () => {
      sendDeparture("browser back");
    };

    const onPageShow = (event: PageTransitionEvent) => {
      // Returning from the back/forward cache does not reload the page; check
      // the server before letting the learner continue.
      if (event.persisted) void refreshAttempt();
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (finishedRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [attempt, refreshAttempt, sendDeparture]);

  /* ── Activity heartbeat ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!attempt) return;
    const ping = () => {
      if (document.visibilityState !== "visible" || finishedRef.current) return;
      void fetch(`/api/attempts/${attempt.id}/heartbeat`, { method: "POST" }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 30_000);
    return () => clearInterval(interval);
  }, [attempt]);

  /* ── Answer selection ─────────────────────────────────────────────────── */
  const questions = attempt?.questions ?? [];
  const question = questions[current];

  const selectOption = useCallback((index: number) => {
    if (!question) return;
    setAnswers((previous) => ({ ...previous, [question.id]: index }));
    dirtyRef.current.add(question.id);
    setSaveState("idle");
  }, [question]);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(Math.min(Math.max(index, 0), Math.max(0, questions.length - 1)));
      setPalettePage(Math.floor(Math.min(Math.max(index, 0), Math.max(0, questions.length - 1)) / PALETTE_PAGE_SIZE));
    },
    [questions.length]
  );

  useEffect(() => {
    if (!attempt) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (confirmOpen) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(current + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(current - 1);
      } else if (/^[1-9]$/.test(event.key)) {
        const optionIndex = Number(event.key) - 1;
        if (question && optionIndex < question.options.length) {
          event.preventDefault();
          selectOption(optionIndex);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [attempt, question, current, goTo, selectOption, confirmOpen]);

  const answeredCount = Object.values(answers).filter(
    (value) => value !== null && value !== undefined
  ).length;

  const leaveAssessment = () => {
    if (
      window.confirm(
        "Leave this assessment? Leaving is recorded as a departure. On the third departure, the assessment is terminated.",
      )
    ) {
      sendDeparture("left assessment");
      finishedRef.current = true;
      router.push("/dashboard");
    }
  };

  /* ── Render: loading / errors / termination ───────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Preparing your assessment…</p>
      </div>
    );
  }

  if (terminated && attempt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-extrabold text-foreground">Assessment terminated</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          This attempt ended because you left the assessment three times. Your saved answers were
          scored and you cannot resume this attempt. You can start a new assessment from the course
          page.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/results/${attempt.id}`}>
            <Button className="rounded-full">View result</Button>
          </Link>
          <Link href={`/courses/${attempt.courseSlug}`}>
            <Button variant="outline" className="rounded-full">
              Back to course
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadError || !attempt || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground">
          {loadError ?? "This attempt could not be opened"}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your attempt may have been submitted, terminated, or the course no longer has questions.
        </p>
        <Link href="/dashboard">
          <Button className="rounded-full">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  const palettePages = Math.ceil(questions.length / PALETTE_PAGE_SIZE);
  const paletteStart = palettePage * PALETTE_PAGE_SIZE;
  const paletteQuestions = questions.slice(paletteStart, paletteStart + PALETTE_PAGE_SIZE);
  const selection = answers[question.id] ?? null;
  const unanswered = questions.length - answeredCount;
  const departures = attempt.departures;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={leaveAssessment}
            aria-label="Leave assessment"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{attempt.courseTitle}</p>
            <p className="truncate text-xs text-muted-foreground">
              {attempt.subject ?? "General"} · Question {current + 1} of {questions.length}
            </p>
          </div>

          {departures > 0 && (
            <span
              className="hidden items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 sm:inline-flex"
              title="Departures recorded"
            >
              <Flag className="h-3.5 w-3.5" />
              {departures}/{attempt.maxDepartures}
            </span>
          )}

          {secondsLeft !== null ? (
            <div
              aria-live="polite"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold tabular-nums transition-colors ${
                urgent
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-muted text-foreground"
              }`}
            >
              <Timer className="h-4 w-4" />
              {formatCountdown(secondsLeft)}
            </div>
          ) : (
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
              Untimed
            </span>
          )}

          <Button onClick={() => setConfirmOpen(true)} className="hidden rounded-full sm:inline-flex" size="sm">
            <Send className="h-3.5 w-3.5" />
            Submit
          </Button>
        </div>

        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${questions.length === 0 ? 0 : (answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {departures > 0 && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5">
          <p className="mx-auto flex max-w-6xl items-start gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {departures >= attempt.maxDepartures - 1
              ? `Departure ${departures} of ${attempt.maxDepartures} recorded. The next departure will end this assessment.`
              : `Departure ${departures} of ${attempt.maxDepartures} recorded. Leaving again adds to the count; the third departure ends the assessment.`}
          </p>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
        {/* Question column */}
        <main className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
              Question {current + 1}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              {question.marks} mark{question.marks === 1 ? "" : "s"}
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground">
              {saveState === "saving" && (
                <>
                  <Cloud className="h-3.5 w-3.5 animate-pulse" /> Saving…
                </>
              )}
              {saveState === "saved" && (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Saved
                </>
              )}
              {saveState === "error" && (
                <>
                  <CloudOff className="h-3.5 w-3.5 text-rose-500" /> Save failed
                </>
              )}
            </span>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <h1 className="text-base font-bold leading-relaxed text-card-foreground sm:text-lg">
              {question.prompt}
            </h1>

            {question.imageUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.imageUrl}
                  alt="Question illustration"
                  className="max-h-72 w-full object-contain"
                />
              </div>
            )}

            <div className="mt-6 space-y-2.5" role="radiogroup" aria-label="Answer options">
              {question.options.map((option, index) => {
                const selected = selection === index;
                return (
                  <button
                    key={index}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => selectOption(index)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/70 bg-background hover:border-primary/30 hover:bg-muted/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {LETTERS[index] ?? index + 1}
                    </span>
                    <span
                      className={`text-sm leading-relaxed ${
                        selected ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {option}
                    </span>
                    {selected && <Check className="ml-auto mt-1 h-4 w-4 flex-shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          {submitError && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              {submitError}
            </p>
          )}

          <div className="mt-5 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <Button variant="outline" onClick={() => setPaletteOpen(true)} className="rounded-full lg:hidden">
              All questions
            </Button>

            {current === questions.length - 1 ? (
              <Button onClick={() => setConfirmOpen(true)} className="ml-auto rounded-full">
                Review &amp; submit
                <Send className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button onClick={() => goTo(current + 1)} className="ml-auto rounded-full">
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="mt-3 hidden text-[11px] text-muted-foreground sm:block">
            Shortcuts: <kbd className="rounded bg-muted px-1">1</kbd>–
            <kbd className="rounded bg-muted px-1">4</kbd> answer ·{" "}
            <kbd className="rounded bg-muted px-1">←</kbd>{" "}
            <kbd className="rounded bg-muted px-1">→</kbd> navigate
          </p>
        </main>

        {/* Palette (desktop) */}
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                Question map
              </p>
              <p className="text-xs font-bold text-foreground">
                {answeredCount}/{questions.length}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-6 gap-1.5">
              {paletteQuestions.map((item, offset) => {
                const index = paletteStart + offset;
                const answered = answers[item.id] !== null && answers[item.id] !== undefined;
                const isCurrent = index === current;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      goTo(index);
                      setPaletteOpen(false);
                    }}
                    aria-label={`Go to question ${index + 1}${answered ? ", answered" : ""}`}
                    aria-current={isCurrent ? "true" : undefined}
                    className={`flex h-8 items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : answered
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {palettePages > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setPalettePage((page) => Math.max(0, page - 1))}
                  disabled={palettePage === 0}
                  className="rounded p-1 disabled:opacity-40"
                  aria-label="Previous questions page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  {palettePage + 1} / {palettePages}
                </span>
                <button
                  type="button"
                  onClick={() => setPalettePage((page) => Math.min(palettePages - 1, page + 1))}
                  disabled={palettePage === palettePages - 1}
                  className="rounded p-1 disabled:opacity-40"
                  aria-label="Next questions page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-[11px] font-medium text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary/20" /> Answered
              </p>
              <p className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-muted" /> Not answered
              </p>
            </div>

            <Button onClick={() => setConfirmOpen(true)} className="mt-4 w-full rounded-full" size="sm">
              <Send className="h-3.5 w-3.5" />
              Submit assessment
            </Button>
          </div>
        </aside>
      </div>

      {/* Mobile submit bar */}
      <div className="sticky bottom-0 border-t border-border bg-card px-4 py-3 sm:hidden">
        <Button onClick={() => setConfirmOpen(true)} className="w-full rounded-full">
          <Send className="h-4 w-4" />
          Submit ({answeredCount}/{questions.length})
        </Button>
      </div>

      {/* Mobile palette sheet */}
      {paletteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="max-h-[75vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Question map"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-extrabold text-foreground">
                {answeredCount} of {questions.length} answered
              </p>
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Close question map"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-8 gap-1.5">
              {paletteQuestions.map((item, offset) => {
                const index = paletteStart + offset;
                const answered = answers[item.id] !== null && answers[item.id] !== undefined;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      goTo(index);
                      setPaletteOpen(false);
                    }}
                    className={`flex h-9 items-center justify-center rounded-lg text-xs font-bold ${
                      index === current
                        ? "bg-primary text-primary-foreground"
                        : answered
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {palettePages > 1 && (
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setPalettePage((page) => Math.max(0, page - 1))}
                  disabled={palettePage === 0}
                  className="rounded p-1 disabled:opacity-40"
                  aria-label="Previous questions page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  {palettePage + 1} / {palettePages}
                </span>
                <button
                  type="button"
                  onClick={() => setPalettePage((page) => Math.min(palettePages - 1, page + 1))}
                  disabled={palettePage === palettePages - 1}
                  className="rounded p-1 disabled:opacity-40"
                  aria-label="Next questions page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit confirmation */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-title"
          >
            <h2 id="submit-title" className="text-lg font-extrabold text-foreground">
              Submit this assessment?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You have answered {answeredCount} of {questions.length} questions.
              {unanswered > 0
                ? ` ${unanswered} question${unanswered === 1 ? "" : "s"} will be marked unanswered.`
                : " Every question has an answer."}
            </p>
            {secondsLeft !== null && (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                Time remaining: {formatCountdown(secondsLeft)}
              </p>
            )}
            {submitError && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {submitError}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                Keep working
              </Button>
              <Button
                className="rounded-full"
                onClick={() => void submit()}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Submit assessment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
