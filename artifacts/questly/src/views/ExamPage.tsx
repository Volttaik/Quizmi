"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
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
  const questionScrollRef = useRef<HTMLElement | null>(null);
  const answerScrollRef = useRef<HTMLDivElement | null>(null);

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
        // of leaving the question stuck on Submit Answer.
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

  // The question and answer panes scroll on their own, so a new question
  // resets both to the top instead of moving the page.
  useEffect(() => {
    if (!attempt) return;
    if (seenQuestionRef.current === null) {
      seenQuestionRef.current = current;
      return;
    }
    if (seenQuestionRef.current !== current) {
      seenQuestionRef.current = current;
      questionScrollRef.current?.scrollTo({ top: 0 });
      answerScrollRef.current?.scrollTo({ top: 0 });
    }
  }, [attempt, current]);

  // A verdict appears below the options, so bring it into view once it lands.
  useEffect(() => {
    if (!feedbackNotice) return;
    const pane = answerScrollRef.current;
    if (pane) pane.scrollTo({ top: pane.scrollHeight, behavior: "smooth" });
  }, [feedbackNotice]);

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
        "Leave this assessment? This counts as a departure, and the timer keeps running."
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
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-background">
        <Stopwatch className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Preparing your assessment…</p>
      </div>
    );
  }

  if (terminated && attempt) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <TriangleExclamation className="h-7 w-7 text-warning" />
        <h1 className="font-display text-xl font-semibold text-foreground">Assessment ended</h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          You left this assessment {attempt.maxDepartures} times. Your saved answers were scored and
          this attempt cannot be resumed.
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="rounded-xl">
            <Link href={`/results/${attempt.id}`}>View Results</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/courses/${attempt.courseSlug}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loadError || !attempt || !question) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <TriangleExclamation className="h-7 w-7 text-muted-foreground" />
        <h1 className="font-display text-lg font-semibold text-foreground">
          {loadError ?? "This assessment could not be opened"}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          It may already be submitted or ended.
        </p>
        <Button asChild className="mt-1 rounded-xl">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
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
  const lastDepartureWarning = departures >= attempt.maxDepartures - 1;
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
    <div className="flex h-[100dvh] min-h-[26rem] flex-col overflow-hidden bg-background">
      {/* Header: title, timer and progress stay locked in place. */}
      <header className="z-30 shrink-0 border-b border-border/70 bg-background">
        <div className="mx-auto flex w-full max-w-4xl flex-col px-4 sm:px-6 lg:max-w-6xl">
          <div className="flex h-14 items-center gap-2.5">
            <button
              type="button"
              onClick={leaveAssessment}
              aria-label="Leave assessment"
              className="-ml-1.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <p className="min-w-0 flex-1 truncate font-display text-[15px] font-semibold text-foreground">
              {attempt.courseTitle}
            </p>

            {streak >= 2 && (
              <span
                key={streak}
                aria-label={`${streak} correct answers in a row`}
                className="animate-pop flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success-soft-foreground"
              >
                <Flame className="h-3.5 w-3.5" />
                {streak}
              </span>
            )}

            {departures > 0 && (
              <span
                title={`${departures} of ${attempt.maxDepartures} departures`}
                aria-label={`${departures} of ${attempt.maxDepartures} departures recorded`}
                className="flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-bold text-warning-soft-foreground"
              >
                <Flag className="h-3.5 w-3.5" />
                {departures}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 pb-3">
            <p className="whitespace-nowrap text-[12px] font-medium text-muted-foreground">
              Question <span className="font-bold text-foreground">{current + 1}</span> of{" "}
              {totalQuestions}
            </p>

            <div
              className="h-1 flex-1 overflow-hidden rounded-full bg-surface-secondary"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalQuestions}
              aria-valuenow={progressCount}
              aria-label="Assessment progress"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{
                  width: `${totalQuestions === 0 ? 0 : (progressCount / totalQuestions) * 100}%`,
                }}
              />
            </div>

            {secondsLeft !== null ? (
              <p
                aria-live="polite"
                aria-label={`Time left ${formatCountdown(secondsLeft)}`}
                className={`flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold tabular-nums ${
                  urgent ? "text-danger" : "text-muted-foreground"
                }`}
              >
                <Stopwatch className="h-3.5 w-3.5" />
                Time Left
                <span className={`text-[13px] font-bold ${urgent ? "text-danger" : "text-foreground"}`}>
                  {formatCountdown(secondsLeft)}
                </span>
              </p>
            ) : (
              <p className="whitespace-nowrap text-[11px] font-semibold text-muted-foreground">
                Untimed
              </p>
            )}
          </div>
        </div>
      </header>

      {lastDepartureWarning && (
        <p className="shrink-0 bg-warning-soft px-4 py-2 text-center text-[11.5px] font-semibold text-warning-soft-foreground sm:px-6">
          {departures >= attempt.maxDepartures
            ? "This was your final departure."
            : "One more departure ends this assessment."}
        </p>
      )}

      {/* Three fixed regions: question, answers, actions. Each scrolls alone. */}
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-0">
        <section
          ref={questionScrollRef}
          aria-label="Question"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 lg:px-10 lg:py-9"
        >
          <h1
            id="question-prompt"
            className="break-words whitespace-pre-line font-display text-[1.35rem] font-semibold leading-[1.36] tracking-[-0.02em] text-foreground sm:text-[1.6rem]"
          >
            {question.prompt}
          </h1>

          {question.imageUrl && (
            <div className="mt-5 overflow-hidden rounded-xl border border-border/70 bg-surface">
              {/* Question artwork can be hosted on any origin. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={question.imageUrl}
                alt="Question illustration"
                className="max-h-72 w-full object-contain"
              />
            </div>
          )}
        </section>

        <section
          aria-label="Answer options"
          className="flex min-h-0 flex-[1.15] flex-col border-t border-border/70 lg:flex-1 lg:border-l lg:border-t-0"
        >
          <div
            ref={answerScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 lg:px-10 lg:py-9"
          >
            <div className="space-y-2.5" role="radiogroup" aria-labelledby="question-prompt">
              {question.options.map((option, index) => {
                const selected = selection === index;
                const isCorrectOption = Boolean(
                  currentFeedback && index === currentFeedback.correctIndex
                );
                const isWrongChoice = Boolean(currentFeedback && selected && !currentFeedback.correct);

                let surface =
                  "border-border/70 bg-surface hover:border-primary/40 hover:bg-surface-secondary/60";
                let letter = "bg-surface-secondary text-foreground/80";
                let text = "text-foreground";

                if (currentFeedback) {
                  if (isCorrectOption) {
                    surface = "border-success/60 bg-success-soft";
                    letter = "bg-success text-success-foreground";
                    text = "font-semibold text-foreground";
                  } else if (isWrongChoice) {
                    surface = "border-danger/60 bg-danger-soft";
                    letter = "bg-danger text-danger-foreground";
                    text = "font-semibold text-foreground";
                  } else {
                    surface = "border-border/50 bg-surface opacity-55";
                    letter = "bg-surface-secondary text-muted-foreground";
                  }
                } else if (selected) {
                  surface = "border-primary/70 bg-accent-soft ring-1 ring-primary/25";
                  letter = "bg-primary text-primary-foreground";
                  text = "font-semibold text-foreground";
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
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left shadow-card transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 disabled:cursor-default ${surface}`}
                  >
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${letter}`}
                    >
                      {optionLetter(index)}
                    </span>
                    <span
                      className={`min-w-0 flex-1 break-words whitespace-pre-line pt-1 text-[14.5px] leading-[1.55] ${text}`}
                    >
                      {option}
                    </span>
                    {isCorrectOption && (
                      <CircleCheck className="mt-1.5 h-4 w-4 flex-shrink-0 text-success" />
                    )}
                    {isWrongChoice && (
                      <CircleXmark className="mt-1.5 h-4 w-4 flex-shrink-0 text-danger" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Verdict, shown right beneath the options. */}
            {notice && currentFeedback && (
              <div
                key={notice.nonce}
                role="status"
                aria-live="polite"
                className={`mt-4 border-l-2 pl-3.5 ${
                  notice.kind === "correct"
                    ? notice.milestone
                      ? "animate-fade-up border-warning text-warning-soft-foreground"
                      : "animate-fade-up border-success text-success-soft-foreground"
                    : "animate-shake-soft border-danger text-danger-soft-foreground"
                }`}
              >
                <p className="text-sm font-bold">{notice.message}</p>

                {!currentFeedback.correct && correctOptionText && (
                  <p className="mt-1 text-[13.5px] leading-relaxed text-foreground">
                    Answer:{" "}
                    <strong className="font-bold">
                      {optionLetter(currentFeedback.correctIndex)}
                    </strong>{" "}
                    · {correctOptionText}
                  </p>
                )}

                {currentFeedback.explanation && (
                  <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-muted-foreground">
                    {currentFeedback.explanation}
                  </p>
                )}

                {currentFeedback.reference && (
                  <p className="mt-1 text-[11.5px] font-medium text-muted-foreground">
                    Reference: {currentFeedback.reference}
                  </p>
                )}
              </div>
            )}

            {/* Ten consecutive misses: an optional, quiet nudge. */}
            {showStudyNudge && (
              <div
                role="dialog"
                aria-label="Study suggestion"
                className="animate-fade-up mt-4 flex items-start gap-3 border-l-2 border-primary pl-3.5"
              >
                <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Stuck in a rough patch?</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    That usually just means the material is still new. Review the course, or keep
                    going — the timer runs either way.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        // The departure and draft are handled by the existing
                        // pagehide handlers; the timer keeps running.
                        window.location.assign(`/courses/${attempt.courseSlug}`);
                      }}
                    >
                      Review Course
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => setShowStudyNudge(false)}
                    >
                      Keep Going
                    </Button>
                  </div>
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
            )}

            {(answerError || submitError) && (
              <p className="mt-3 flex items-start gap-2 text-xs font-semibold text-danger">
                <TriangleExclamation className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {answerError ?? submitError}
              </p>
            )}

            {expired && (
              <p className="mt-3 flex items-start gap-2 text-xs font-semibold text-warning-soft-foreground">
                <Stopwatch className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {submittingAttempt ? "Time is up. Submitting your answers…" : "Time is up."}
              </p>
            )}
          </div>

          {/* Actions sit with the answers and never scroll away. */}
          <div className="flex flex-shrink-0 items-center gap-2 border-t border-border/70 px-4 py-3 sm:px-6 lg:px-10">
            {isInstant ? (
              !currentFeedback ? (
                <Button
                  onClick={() => void submitAnswer()}
                  disabled={selection === null || submittingAnswer || expired}
                  className="h-11 w-full rounded-xl px-6 text-sm font-semibold sm:w-auto"
                >
                  {submittingAnswer ? "Submitting…" : "Submit Answer"}
                </Button>
              ) : isFinalQuestion ? (
                <Button
                  onClick={() => void finalize()}
                  disabled={submittingAttempt}
                  className="h-11 w-full rounded-xl px-6 text-sm font-semibold sm:w-auto"
                >
                  {submittingAttempt ? "Finishing…" : "View Results"}
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  className="h-11 w-full rounded-xl px-6 text-sm font-semibold sm:w-auto"
                >
                  Next Question
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => goTo(current - 1)}
                  disabled={isFirstQuestion}
                  className="h-11 rounded-xl px-4 text-sm font-semibold"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="ml-auto flex items-center gap-2.5">
                  {saveState !== "idle" && (
                    <span
                      aria-live="polite"
                      className={`hidden items-center gap-1.5 text-[11px] font-medium sm:flex ${
                        saveState === "error" ? "text-danger" : "text-muted-foreground"
                      }`}
                    >
                      {saveState === "saving" && "Saving…"}
                      {saveState === "saved" && (
                        <>
                          <CloudCheck className="h-3.5 w-3.5 text-success" /> Saved
                        </>
                      )}
                      {saveState === "error" && (
                        <>
                          <CloudSlash className="h-3.5 w-3.5" /> Not saved
                        </>
                      )}
                    </span>
                  )}

                  {isFinalQuestion ? (
                    <Button
                      onClick={() => setConfirmOpen(true)}
                      disabled={submittingAttempt || expired}
                      className="h-11 rounded-xl px-5 text-sm font-semibold"
                    >
                      Finish Assessment
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={goNext}
                      className="h-11 rounded-xl px-5 text-sm font-semibold"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Finish confirmation, required before a Results at the End attempt closes. */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--backdrop)] px-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => {
            if (!submittingAttempt) setConfirmOpen(false);
          }}
        >
          <div
            className="animate-fade-up w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="finish-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="finish-title" className="font-display text-xl font-semibold text-foreground">
              Finish Assessment?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You answered {answeredCount} of {totalQuestions}.
              {unansweredCount > 0
                ? ` ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"} score${unansweredCount === 1 ? "s" : ""} zero.`
                : " Every question has an answer."}
            </p>
            {submitError && (
              <p className="mt-3 flex items-start gap-2 text-xs font-semibold text-danger">
                <TriangleExclamation className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {submitError}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setConfirmOpen(false)}
                disabled={submittingAttempt}
              >
                Keep Going
              </Button>
              <Button
                className="rounded-xl"
                onClick={() => void finalize()}
                disabled={submittingAttempt}
              >
                {submittingAttempt ? "Submitting…" : "Finish Assessment"}
                {!submittingAttempt && <Check className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
