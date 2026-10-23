"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleXmark,
  CloudCheck,
  CloudSlash,
  Flag,
  Flame,
  ListCheck,
  Play,
  Stopwatch,
  TriangleExclamation,
  Xmark,
} from "@gravity-ui/icons";
import { Button } from "@/components/ui/button";
import { formatCountdown } from "@/lib/format";
import type { AnswerFeedback, AttemptState, ResultMode } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const AUTOSAVE_DELAY = 650;
const CLIENT_DEPARTURE_DEDUPE = 5000;
const AUTO_SUBMIT_RETRY_MS = 5000;
const AUTO_SUBMIT_MAX_RETRIES = 6;
const CONFETTI_COLORS = ["#8b5cf6", "#4ade80", "#fbbf24", "#fb7185", "#60a5fa"];

type SaveState = "idle" | "saving" | "saved" | "error";

type FeedbackNotice = {
  questionId: number;
  kind: "correct" | "incorrect";
  message: string;
  milestone: boolean;
  nonce: number;
};

function streakMessage(count: number): { message: string; milestone: boolean } {
  if (count >= 10 && count % 10 === 0) {
    return { message: `Outstanding — ${count} correct in a row!`, milestone: true };
  }
  if (count === 7) return { message: "You're on fire! 7 in a row", milestone: true };
  if (count === 5) return { message: "Very good! 5 in a row", milestone: true };
  if (count === 3) return { message: "Nice streak! 3 in a row", milestone: true };
  return { message: "Correct!", milestone: false };
}

function optionLetter(index: number): string {
  return LETTERS[index] ?? String(index + 1);
}

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
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<number, AnswerFeedback>>({});
  const [feedbackNotice, setFeedbackNotice] = useState<FeedbackNotice | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNonce, setSaveNonce] = useState(0);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showStudyNudge, setShowStudyNudge] = useState(false);

  const dirtyRef = useRef<Set<number>>(new Set());
  const savingRef = useRef(false);
  const finishedRef = useRef(false);
  const attemptRef = useRef<AttemptState | null>(null);
  const answersRef = useRef(answers);
  const feedbackRef = useRef(feedbackByQuestion);
  const submittingAnswerRef = useRef(false);
  const submittingAttemptRef = useRef(false);
  const finalizeRef = useRef<(isAuto?: boolean) => Promise<void>>(async () => {});
  const lastDepartureRef = useRef(0);
  const autoSubmitRetriesRef = useRef(0);
  const autoSubmittedRef = useRef(false);
  const gradedOnceRef = useRef<Set<number>>(new Set());
  const streakRef = useRef(0);
  const incorrectStreakRef = useRef(0);
  const studyNudgeShownRef = useRef(false);
  const seenQuestionRef = useRef<number | null>(null);

  answersRef.current = answers;
  feedbackRef.current = feedbackByQuestion;
  attemptRef.current = attempt;

  const mode: ResultMode = attempt?.resultMode ?? "instant";
  const isInstant = mode === "instant";

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

        const initialAnswers: Record<number, number | null> = {};
        for (const answer of data.answers) initialAnswers[answer.questionId] = answer.selectedIndex;

        const initialFeedback: Record<number, AnswerFeedback> = {};
        for (const item of data.feedback) {
          initialFeedback[item.questionId] = item;
          gradedOnceRef.current.add(item.questionId);
        }

        // Rebuild the streak from the graded answers already persisted so a
        // refresh does not silently reset the encouragement.
        let correctRun = 0;
        let wrongRun = 0;
        for (const item of data.feedback) {
          if (item.correct) {
            correctRun += 1;
            wrongRun = 0;
          } else {
            correctRun = 0;
            wrongRun += 1;
          }
        }
        streakRef.current = correctRun;
        incorrectStreakRef.current = wrongRun;
        setStreak(correctRun);

        // Instant Results resumes at the first answer that has not been
        // submitted; Results at the End starts at the beginning so the learner
        // can review their saved answers in order.
        let startIndex = 0;
        if (data.resultMode === "instant") {
          const submitted = new Set(Object.keys(initialFeedback).map(Number));
          const firstOpen = data.questions.findIndex((question) => !submitted.has(question.id));
          startIndex = firstOpen === -1 ? Math.max(0, data.questions.length - 1) : firstOpen;
        }

        setAttempt(data);
        setAnswers(initialAnswers);
        setFeedbackByQuestion(initialFeedback);
        setCurrent(startIndex);
        setDeadline(
          data.secondsRemaining !== null ? Date.now() + data.secondsRemaining * 1000 : null
        );
      })
      .catch((err) => {
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
  const expired = secondsLeft === 0;
  const questions = attempt?.questions ?? [];
  const question = questions[current];

  /* ── Instant feedback & streaks ───────────────────────────────────────── */
  const applyFeedback = useCallback((items: AnswerFeedback[]) => {
    for (const item of items) {
      if (!item || typeof item.questionId !== "number") continue;
      if (gradedOnceRef.current.has(item.questionId)) continue;
      gradedOnceRef.current.add(item.questionId);

      setFeedbackByQuestion((previous) => ({ ...previous, [item.questionId]: item }));

      if (item.correct) {
        streakRef.current += 1;
        incorrectStreakRef.current = 0;
        const count = streakRef.current;
        setStreak(count);

        const { message, milestone } = streakMessage(count);
        setFeedbackNotice({
          questionId: item.questionId,
          kind: "correct",
          message,
          milestone,
          nonce: Date.now() + Math.random(),
        });
        setBurst((value) => value + 1);
      } else {
        incorrectStreakRef.current += 1;
        streakRef.current = 0;
        setStreak(0);
        setFeedbackNotice({
          questionId: item.questionId,
          kind: "incorrect",
          message: "Not quite.",
          milestone: false,
          nonce: Date.now() + Math.random(),
        });

        if (incorrectStreakRef.current >= 10 && !studyNudgeShownRef.current) {
          studyNudgeShownRef.current = true;
          setShowStudyNudge(true);
        }
      }
    }
  }, []);

  /* ── Incremental autosave (Results at the End) ─────────────────────────── */
  const persistDirty = useCallback(async () => {
    const currentAttempt = attemptRef.current;
    if (!currentAttempt || currentAttempt.status !== "in_progress") return;
    if (savingRef.current) return;
    if (dirtyRef.current.size === 0) return;

    const ids = Array.from(dirtyRef.current);
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
      for (const item of sent) dirtyRef.current.add(item.questionId);
      setSaveState("error");
      setTimeout(() => setSaveNonce((value) => value + 1), 2000);
    } finally {
      savingRef.current = false;
      if (dirtyRef.current.size > 0) setSaveNonce((value) => value + 1);
    }
  }, [router]);

  useEffect(() => {
    if (!attempt || isInstant) return;
    if (dirtyRef.current.size === 0) return;

    const timer = setTimeout(() => {
      void persistDirty();
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [answers, attempt, isInstant, persistDirty, saveNonce]);

  /* ── Submit one answer (Instant Results) ──────────────────────────────── */
  const selection = question ? answers[question.id] ?? null : null;
  const currentFeedback = question ? feedbackByQuestion[question.id] : undefined;
  const answerLocked = isInstant && Boolean(currentFeedback);

  const submitAnswer = useCallback(async () => {
    const currentAttempt = attemptRef.current;
    const activeQuestion = currentAttempt?.questions[current];
    if (!currentAttempt || !activeQuestion || submittingAnswerRef.current) return;
    if (currentAttempt.resultMode !== "instant") return;
    if (feedbackRef.current[activeQuestion.id]) return;

    const selectedIndex = answersRef.current[activeQuestion.id];
    if (selectedIndex === null || selectedIndex === undefined) return;

    submittingAnswerRef.current = true;
    setSubmittingAnswer(true);
    setAnswerError(null);

    try {
      const response = await fetch(`/api/attempts/${currentAttempt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [{ questionId: activeQuestion.id, selectedIndex }],
        }),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(`/sign-in?redirect_url=/exam/${currentAttempt.id}`);
        return;
      }
      if (!response.ok) throw new Error(data?.error ?? "Could not submit your answer");

      if (data?.status && data.status !== "in_progress") {
        finishedRef.current = true;
        router.replace(`/results/${currentAttempt.id}`);
        return;
      }

      if (Array.isArray(data?.graded) && data.graded.length > 0) {
        applyFeedback(data.graded as AnswerFeedback[]);
      } else {
        // A previous request may have graded this answer even if its response
        // was lost. Re-read the attempt so feedback stays consistent instead
        // of leaving the question stuck on Submit answer.
        const refreshed = await fetch(`/api/attempts/${currentAttempt.id}`, {
          cache: "no-store",
        });
        if (refreshed.ok) {
          const state = (await refreshed.json()) as AttemptState;
          if (state.status !== "in_progress") {
            finishedRef.current = true;
            router.replace(`/results/${currentAttempt.id}`);
            return;
          }
          const stored = state.feedback.find((item) => item.questionId === activeQuestion.id);
          if (stored) {
            applyFeedback([stored]);
          } else {
            setAnswerError("Your answer was saved but could not be verified. Submit it again.");
          }
        } else {
          setAnswerError("Your answer was sent but could not be verified. Submit it again.");
        }
      }
      setSaveState("saved");
    } catch (err) {
      setAnswerError(
        err instanceof Error ? err.message : "Could not submit your answer. Check your connection."
      );
    } finally {
      submittingAnswerRef.current = false;
      setSubmittingAnswer(false);
    }
  }, [applyFeedback, current, router]);

  /* ── Finalize the whole attempt ───────────────────────────────────────── */
  const finalize = useCallback(
    async (isAuto = false) => {
      const currentAttempt = attemptRef.current;
      if (!currentAttempt || submittingAttemptRef.current || finishedRef.current) return;

      submittingAttemptRef.current = true;
      setSubmittingAttempt(true);
      setSubmitError(null);
      setConfirmOpen(false);

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

        if (response.status === 401) {
          router.replace(`/sign-in?redirect_url=/exam/${currentAttempt.id}`);
          return;
        }
        if (!response.ok) throw new Error(data?.error ?? "Could not submit your assessment");

        finishedRef.current = true;
        router.replace(`/results/${currentAttempt.id}`);
      } catch (err) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Could not submit your assessment. Check your connection and try again."
        );
        submittingAttemptRef.current = false;
        setSubmittingAttempt(false);

        if (isAuto && autoSubmitRetriesRef.current < AUTO_SUBMIT_MAX_RETRIES) {
          autoSubmitRetriesRef.current += 1;
          setTimeout(() => {
            if (!finishedRef.current) void finalizeRef.current(true);
          }, AUTO_SUBMIT_RETRY_MS);
        }
      }
    },
    [router]
  );

  finalizeRef.current = finalize;

  useEffect(() => {
    if (secondsLeft === 0 && attempt && !autoSubmittedRef.current && !finishedRef.current) {
      autoSubmittedRef.current = true;
      void finalizeRef.current(true);
    }
  }, [secondsLeft, attempt]);

  /* ── Departure enforcement ────────────────────────────────────────────── */
  const sendDeparture = useCallback((reason: string) => {
    const currentAttempt = attemptRef.current;
    if (!currentAttempt || currentAttempt.status !== "in_progress" || finishedRef.current) return;

    const nowMs = Date.now();
    if (nowMs - lastDepartureRef.current < CLIENT_DEPARTURE_DEDUPE) return;
    lastDepartureRef.current = nowMs;

    const body = JSON.stringify({ reason });
    const url = `/api/attempts/${currentAttempt.id}/departure`;

    try {
      const sent = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
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
        void refreshAttempt();
      }
    };

    const onPopState = () => {
      sendDeparture("browser back");
    };

    const onPageShow = (event: PageTransitionEvent) => {
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

  /* ── Selection & navigation ───────────────────────────────────────────── */
  const selectOption = useCallback(
    (index: number) => {
      if (!question || expired) return;
      if (isInstant && feedbackRef.current[question.id]) return;
      setAnswers((previous) => ({ ...previous, [question.id]: index }));
      setAnswerError(null);
      if (!isInstant) {
        dirtyRef.current.add(question.id);
        setSaveState("idle");
      }
    },
    [question, expired, isInstant]
  );

  const goTo = useCallback(
    (index: number) => {
      const next = Math.min(Math.max(index, 0), Math.max(0, questions.length - 1));
      setCurrent(next);
      setFeedbackNotice(null);
    },
    [questions.length]
  );

  const goNext = useCallback(() => {
    if (current >= questions.length - 1) return;
    goTo(current + 1);
  }, [current, questions.length, goTo]);

  // Keep the question at the top of the viewport when moving through a long
  // assessment, without yanking the page on the first render.
  useEffect(() => {
    if (!attempt) return;
    if (seenQuestionRef.current === null) {
      seenQuestionRef.current = current;
      return;
    }
    if (seenQuestionRef.current !== current) {
      seenQuestionRef.current = current;
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [attempt, current]);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submittingAttempt) setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen, submittingAttempt]);

  useEffect(() => {
    if (!attempt) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (confirmOpen) return;

      const key = event.key.toLowerCase();
      const digit = /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : -1;
      const letterIndex = /^[a-h]$/.test(key) ? key.charCodeAt(0) - 97 : -1;
      const optionIndex = digit >= 0 ? digit : letterIndex;

      if (optionIndex >= 0 && question && optionIndex < question.options.length) {
        event.preventDefault();
        selectOption(optionIndex);
        return;
      }

      if (!isInstant) {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goNext();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(current - 1);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [attempt, question, confirmOpen, isInstant, selectOption, goNext, goTo, current]);

  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((value) => value !== null && value !== undefined).length,
    [answers]
  );

  const leaveAssessment = () => {
    if (finishedRef.current) return;
    if (
      window.confirm(
        "Leave this assessment? Leaving is recorded as a departure. On the third departure, the assessment is terminated."
      )
    ) {
      sendDeparture("left assessment");
      finishedRef.current = true;
      router.push(`/courses/${attempt?.courseSlug ?? ""}`);
    }
  };

  /* ── Render: loading / errors / termination ───────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Stopwatch className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Preparing your assessment…</p>
      </div>
    );
  }

  if (terminated && attempt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <TriangleExclamation className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-extrabold text-foreground">Assessment terminated</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          This attempt ended because you left the assessment three times. Your saved answers were
          scored and you cannot resume this attempt. You can start a new assessment from the course
          page.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/results/${attempt.id}`}>
            <Button className="rounded-lg">View result</Button>
          </Link>
          <Link href={`/courses/${attempt.courseSlug}`}>
            <Button variant="outline" className="rounded-lg">
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
          <TriangleExclamation className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground">
          {loadError ?? "This attempt could not be opened"}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your attempt may have been submitted, terminated, or the course no longer has questions.
        </p>
        <Link href="/dashboard">
          <Button className="rounded-lg">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  const totalQuestions = questions.length;
  // Instant Results only counts an answer once the server has graded it;
  // a selection that has not been submitted is not progress yet.
  const submittedCount = isInstant
    ? questions.filter((item) => Boolean(feedbackByQuestion[item.id])).length
    : answeredCount;
  const progressCount = isInstant ? submittedCount : answeredCount;
  const unansweredCount = Math.max(0, totalQuestions - progressCount);
  const isFinalQuestion = current === totalQuestions - 1;
  const isFirstQuestion = current === 0;
  const departures = attempt.departures;
  const notice =
    feedbackNotice && feedbackNotice.questionId === question.id
      ? feedbackNotice
      : currentFeedback
        ? {
            questionId: question.id,
            kind: currentFeedback.correct ? ("correct" as const) : ("incorrect" as const),
            message: currentFeedback.correct ? "Correct!" : "Not quite.",
            milestone: false,
            nonce: question.id,
          }
        : null;

  const correctOptionText =
    currentFeedback && currentFeedback.correctIndex >= 0
      ? question.options[currentFeedback.correctIndex]
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Focused exam header: no site header, no bottom navigation. */}
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-3 sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={leaveAssessment}
            aria-label="Leave assessment"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{attempt.courseTitle}</p>
            <p className="truncate text-[11px] font-semibold text-muted-foreground">
              {isInstant ? "Instant Results" : "Results at the End"} · Question {current + 1} of{" "}
              {totalQuestions}
            </p>
          </div>

          {streak >= 2 && (
            <span
              key={streak}
              aria-label={`${streak} correct answers in a row`}
              className="animate-pop hidden items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 sm:inline-flex"
            >
              <Flame className="h-3.5 w-3.5" /> {streak}
            </span>
          )}

          {departures > 0 && (
            <span
              className="hidden items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 md:inline-flex"
              title="Departures recorded"
            >
              <Flag className="h-3.5 w-3.5" />
              {departures}/{attempt.maxDepartures}
            </span>
          )}

          {secondsLeft !== null ? (
            <div
              aria-live="polite"
              aria-label={`Time remaining ${formatCountdown(secondsLeft)}`}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-extrabold tabular-nums ${
                urgent
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "bg-muted text-foreground"
              }`}
            >
              <Stopwatch className="h-4 w-4" />
              {formatCountdown(secondsLeft)}
            </div>
          ) : (
            <span className="rounded-md bg-muted px-2.5 py-1.5 text-xs font-bold text-muted-foreground">
              Untimed
            </span>
          )}
        </div>

        <div className="border-t border-border/60 bg-background">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2 sm:px-4">
            <span className="whitespace-nowrap text-[11px] font-extrabold uppercase tracking-wide text-foreground">
              Question {current + 1} of {totalQuestions}
            </span>
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalQuestions}
              aria-valuenow={progressCount}
              aria-label="Assessment completion"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{
                  width: `${totalQuestions === 0 ? 0 : (progressCount / totalQuestions) * 100}%`,
                }}
              />
            </div>
            <span className="whitespace-nowrap text-[11px] font-semibold text-muted-foreground">
              {isInstant ? `${submittedCount} submitted` : `${answeredCount} answered`}
              {!isInstant && unansweredCount > 0 ? ` · ${unansweredCount} left` : ""}
            </span>
          </div>
        </div>
      </header>

      {departures > 0 && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5">
          <p className="mx-auto flex max-w-5xl items-start gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <TriangleExclamation className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {departures >= attempt.maxDepartures - 1
              ? `Departure ${departures} of ${attempt.maxDepartures} recorded. The next departure will end this assessment.`
              : `Departure ${departures} of ${attempt.maxDepartures} recorded. Leaving again adds to the count; the third departure ends the assessment.`}
          </p>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-5xl flex-1 items-start gap-6 px-3 py-5 sm:px-4 sm:py-6">
        <main className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="rounded-md bg-primary/10 px-2 py-1 font-extrabold text-primary">
              Question {current + 1} of {totalQuestions}
            </span>
            <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
              {question.marks} mark{question.marks === 1 ? "" : "s"}
            </span>
            {streak >= 2 && (
              <span
                key={streak}
                className={`animate-pop inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                  notice?.milestone
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                <Flame className="h-3 w-3" /> {streak} in a row
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground">
              {isInstant ? (
                currentFeedback ? (
                  <>
                    <CircleCheck className="h-3.5 w-3.5 text-emerald-500" /> Answer submitted
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3" /> Submit to check
                  </>
                )
              ) : (
                <>
                  {saveState === "saving" && (
                    <>
                      <Stopwatch className="h-3.5 w-3.5 animate-pulse" /> Saving…
                    </>
                  )}
                  {saveState === "saved" && (
                    <>
                      <CloudCheck className="h-3.5 w-3.5 text-emerald-500" /> Saved
                    </>
                  )}
                  {saveState === "error" && (
                    <>
                      <CloudSlash className="h-3.5 w-3.5 text-rose-500" /> Save failed
                    </>
                  )}
                </>
              )}
            </span>
          </div>

          <section className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
            {notice?.kind === "correct" && (
              <span key={burst} aria-hidden="true" className="pointer-events-none absolute inset-0">
                {Array.from({ length: 10 }).map((_, index) => {
                  const angle = (Math.PI * 2 * index) / 10 - Math.PI / 2;
                  const distance = 80 + (index % 3) * 40;
                  return (
                    <span
                      key={index}
                      className="confetti-dot"
                      style={{
                        left: "50%",
                        top: "35%",
                        background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                        animationDelay: `${index * 26}ms`,
                        "--tx": `${Math.round(Math.cos(angle) * distance)}px`,
                        "--ty": `${Math.round(Math.sin(angle) * distance)}px`,
                      } as React.CSSProperties}
                    />
                  );
                })}
              </span>
            )}

            <h1
              id="question-prompt"
              className="whitespace-pre-line text-lg font-bold leading-relaxed text-card-foreground sm:text-xl"
            >
              {question.prompt}
            </h1>

            {question.imageUrl && (
              <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted/30">
                {/* Question artwork can be hosted on any origin. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.imageUrl}
                  alt="Question illustration"
                  className="max-h-72 w-full object-contain"
                />
              </div>
            )}

            <div
              className="mt-5 space-y-2.5"
              role="radiogroup"
              aria-labelledby="question-prompt"
            >
              {question.options.map((option, index) => {
                const selected = selection === index;
                const isCorrectOption = Boolean(currentFeedback && index === currentFeedback.correctIndex);
                const isWrongChoice = Boolean(currentFeedback && selected && !currentFeedback.correct);

                let surface =
                  "border-border bg-background hover:border-primary/40 hover:bg-muted/30";
                let letter =
                  "bg-muted text-muted-foreground border border-border/60";
                let text = "text-foreground";

                if (currentFeedback) {
                  if (isCorrectOption) {
                    surface = "border-emerald-500 bg-emerald-500/[0.07]";
                    letter = "bg-emerald-500 text-white border border-emerald-500";
                    text = "text-foreground";
                  } else if (isWrongChoice) {
                    surface = "border-rose-500 bg-rose-500/[0.06]";
                    letter = "bg-rose-500 text-white border border-rose-500";
                    text = "text-foreground";
                  } else {
                    surface = "border-border bg-background opacity-70";
                  }
                } else if (selected) {
                  surface = "border-primary bg-primary/[0.06] ring-1 ring-primary/20";
                  letter = "bg-primary text-primary-foreground border border-primary";
                  text = "font-bold text-foreground";
                }

                return (
                  <button
                    key={index}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={answerLocked || expired}
                    disabled={answerLocked || expired}
                    onClick={() => selectOption(index)}
                    className={`flex min-h-14 w-full items-start gap-3 rounded-lg border-2 p-3.5 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default sm:p-4 ${surface}`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-base font-black ${letter}`}
                    >
                      {optionLetter(index)}
                    </span>
                    <span className={`flex-1 whitespace-pre-line text-[15px] leading-relaxed ${text}`}>
                      {option}
                    </span>
                    {isCorrectOption && (
                      <CircleCheck className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {isWrongChoice && (
                      <CircleXmark className="mt-1 h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                    {!currentFeedback && selected && (
                      <Check className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Feedback panel follows the answer area, never a page-bottom bar. */}
          {notice && currentFeedback && (
            <div
              key={notice.nonce}
              role="status"
              aria-live="polite"
              className={`mt-3 rounded-lg border-2 p-4 ${
                notice.kind === "correct"
                  ? notice.milestone
                    ? "animate-fade-up border-amber-500/50 bg-amber-500/[0.07]"
                    : "animate-fade-up border-emerald-500/50 bg-emerald-500/[0.06]"
                  : "animate-shake-soft border-rose-500/50 bg-rose-500/[0.05]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {notice.kind === "correct" ? (
                  <CircleCheck
                    className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                      notice.milestone
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  />
                ) : (
                  <CircleXmark className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-extrabold ${
                      notice.kind === "correct"
                        ? notice.milestone
                          ? "text-amber-800 dark:text-amber-300"
                          : "text-emerald-800 dark:text-emerald-300"
                        : "text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {notice.message}
                  </p>

                  {!currentFeedback.correct && correctOptionText && (
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                      The correct answer is{" "}
                      <strong className="font-extrabold">
                        {optionLetter(currentFeedback.correctIndex)}
                      </strong>
                      : {correctOptionText}
                    </p>
                  )}

                  {currentFeedback.explanation && (
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
                      {currentFeedback.explanation}
                    </p>
                  )}

                  {currentFeedback.reference && (
                    <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                      Reference: {currentFeedback.reference}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ten consecutive incorrect answers: calm, optional study nudge. */}
          {showStudyNudge && (
            <div
              role="dialog"
              aria-label="Study suggestion"
              className="animate-fade-up mt-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4"
            >
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">
                    You&apos;re working through a challenging stretch.
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Ten answers in a row have not gone your way — that usually means this material is
                    still fresh, not that you can&apos;t do it. Would reviewing the course materials
                    before you continue help?
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => setShowStudyNudge(false)}
                    >
                      Continue Assessment
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        // The departure and draft are handled by the existing
                        // pagehide handlers; the timer keeps running.
                        window.location.assign(`/courses/${attempt.courseSlug}`);
                      }}
                    >
                      Review Course Materials
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    Your answers are saved and the timer keeps running. Leaving is recorded as a
                    departure under this assessment&apos;s rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStudyNudge(false)}
                  aria-label="Dismiss suggestion"
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  <Xmark className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {(answerError || submitError) && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-semibold text-destructive">
              <TriangleExclamation className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              {answerError ?? submitError}
            </p>
          )}

          {expired && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <Stopwatch className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              {submittingAttempt
                ? "Time is up. Submitting your saved answers…"
                : "Time is up. Your saved answers are being scored."}
            </p>
          )}

          {/* Action row: directly beneath the question, answers and feedback. */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            {isInstant ? (
              <>
                {!currentFeedback ? (
                  <Button
                    onClick={() => void submitAnswer()}
                    disabled={selection === null || submittingAnswer || expired}
                    className="h-11 rounded-lg px-6 text-sm font-bold"
                  >
                    {submittingAnswer ? "Checking…" : "Submit answer"}
                    {!submittingAnswer && <Check className="h-4 w-4" />}
                  </Button>
                ) : isFinalQuestion ? (
                  <Button
                    onClick={() => void finalize()}
                    disabled={submittingAttempt}
                    className="h-11 rounded-lg px-6 text-sm font-bold"
                  >
                    {submittingAttempt ? "Calculating result…" : "View results"}
                    {!submittingAttempt && <ArrowRight className="h-4 w-4" />}
                  </Button>
                ) : (
                  <Button onClick={goNext} className="h-11 rounded-lg px-6 text-sm font-bold">
                    Next question
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}

                <p className="text-[11px] font-medium text-muted-foreground sm:ml-2">
                  {currentFeedback
                    ? "Review the feedback above, then continue."
                    : selection === null
                      ? "Choose an option to enable Submit answer."
                      : "Your answer is checked on the server when you submit."}
                </p>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => goTo(current - 1)}
                  disabled={isFirstQuestion}
                  className="h-11 rounded-lg px-5 text-sm font-bold"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {isFinalQuestion ? (
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={submittingAttempt || expired}
                    className="h-11 rounded-lg px-6 text-sm font-bold sm:ml-auto"
                  >
                    Finish Assessment
                    <Check className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={goNext}
                    className="h-11 rounded-lg px-6 text-sm font-bold sm:ml-auto"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          <p className="mt-3 hidden text-[11px] text-muted-foreground sm:block">
            Shortcuts: <kbd className="rounded border border-border bg-card px-1">1</kbd>–
            <kbd className="rounded border border-border bg-card px-1">8</kbd> or{" "}
            <kbd className="rounded border border-border bg-card px-1">A</kbd>–
            <kbd className="rounded border border-border bg-card px-1">H</kbd> answer
            {!isInstant && (
              <>
                {" "}
                · <kbd className="rounded border border-border bg-card px-1">←</kbd>
                <kbd className="rounded border border-border bg-card px-1">→</kbd> navigate
              </>
            )}
          </p>
        </main>

        {/* Compact status / question map. Navigation only — no Submit All. */}
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <div className="sticky top-28 rounded-xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                <ListCheck className="h-3.5 w-3.5" />
                {isInstant ? "Progress" : "Question map"}
              </p>
              <p className="text-[11px] font-bold text-foreground">
                {progressCount}/{totalQuestions}
              </p>
            </div>

            {isInstant ? (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-2">
                  <span className="font-semibold text-muted-foreground">Submitted</span>
                  <span className="font-extrabold text-foreground">{submittedCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-2">
                  <span className="font-semibold text-muted-foreground">Remaining</span>
                  <span className="font-extrabold text-foreground">{unansweredCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-2">
                  <span className="font-semibold text-muted-foreground">Streak</span>
                  <span className="font-extrabold text-foreground">{streak}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 grid max-h-[58vh] grid-cols-6 gap-1.5 overflow-y-auto pr-0.5">
                  {questions.map((item, index) => {
                    const answered =
                      answers[item.id] !== null && answers[item.id] !== undefined;
                    const isCurrent = index === current;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => goTo(index)}
                        aria-label={`Go to question ${index + 1}${answered ? ", answered" : ", unanswered"}`}
                        aria-current={isCurrent ? "true" : undefined}
                        className={`flex h-7 items-center justify-center rounded-md text-[11px] font-bold transition-colors ${
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

                <div className="mt-3 space-y-1.5 border-t border-border/60 pt-2.5 text-[11px] font-medium text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-primary/20" /> Answered
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-muted" /> Unanswered
                  </p>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Finish confirmation, required before a Results at the End attempt closes. */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="presentation"
          onClick={() => {
            if (!submittingAttempt) setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finish-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="finish-title" className="text-lg font-extrabold text-foreground">
              Finish assessment?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You have answered {answeredCount} of {totalQuestions} questions.
              {unansweredCount > 0
                ? ` ${unansweredCount} question${unansweredCount === 1 ? "" : "s"} will be marked unanswered and score zero.`
                : " Every question has an answer."}
            </p>
            {secondsLeft !== null && (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">
                Time remaining: {formatCountdown(secondsLeft)}
              </p>
            )}
            {submitError && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                <TriangleExclamation className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {submitError}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="rounded-lg"
                onClick={() => setConfirmOpen(false)}
                disabled={submittingAttempt}
              >
                Keep working
              </Button>
              <Button
                className="rounded-lg"
                onClick={() => void finalize()}
                disabled={submittingAttempt}
              >
                {submittingAttempt ? "Submitting…" : "Finish & view results"}
                {!submittingAttempt && <Check className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
