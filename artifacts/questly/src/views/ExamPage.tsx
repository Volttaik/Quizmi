"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Flame,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import BackgroundOrbs from "@/components/BackgroundOrbs";
import { QuizmiLoader } from "@/components/Brand";
import Graffiti from "@/components/Graffiti";
import { ease } from "@/components/Motion";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCountdown } from "@/lib/format";
import { feedbackCue, play, preloadClips, unlockAudio, type Cue } from "@/lib/sound";
import type { AnswerFeedback, AttemptState, ResultMode } from "@/lib/types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const AUTOSAVE_DELAY = 650;
const CLIENT_DEPARTURE_DEDUPE = 5000;
const AUTO_SUBMIT_RETRY_MS = 5000;
const AUTO_SUBMIT_MAX_RETRIES = 6;
const SOUND_KEY = "quizmi.sound";

type SaveState = "idle" | "saving" | "saved" | "error";

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
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNonce, setSaveNonce] = useState(0);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [celebrate, setCelebrate] = useState<3 | 5 | null>(null);
  const [showStudyNudge, setShowStudyNudge] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

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
  const soundOnRef = useRef(true);
  const playedCuesRef = useRef<Set<number>>(new Set());

  answersRef.current = answers;
  feedbackRef.current = feedbackByQuestion;
  attemptRef.current = attempt;
  soundOnRef.current = soundOn;

  const mode: ResultMode = attempt?.resultMode ?? "instant";
  const isInstant = mode === "instant";

  const sound = useCallback((cue: Cue) => {
    if (soundOnRef.current) play(cue);
  }, []);

  /* ── Sound preference + clip warm-up ──────────────────────────────────── */
  useEffect(() => {
    preloadClips();
    try {
      const stored = window.localStorage.getItem(SOUND_KEY);
      if (stored !== null) setSoundOn(stored === "true");
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundOnRef.current = next;
    try {
      window.localStorage.setItem(SOUND_KEY, String(next));
    } catch {
      /* ignore quota/private-mode errors */
    }
    if (next) {
      unlockAudio();
      play("tap");
    }
  };

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
  const applyFeedback = useCallback(
    (items: AnswerFeedback[]) => {
      for (const item of items) {
        if (!item || typeof item.questionId !== "number") continue;
        if (gradedOnceRef.current.has(item.questionId)) continue;
        gradedOnceRef.current.add(item.questionId);

        setFeedbackByQuestion((previous) => ({ ...previous, [item.questionId]: item }));

        let cue: Cue = "correct";
        if (item.correct) {
          streakRef.current += 1;
          incorrectStreakRef.current = 0;
          const count = streakRef.current;
          setStreak(count);
          cue = feedbackCue(true, count);

          if (count === 3 || count === 5) {
            setCelebrate(count === 5 ? 5 : 3);
            setTimeout(() => setCelebrate(null), 2200);
          }
        } else {
          incorrectStreakRef.current += 1;
          streakRef.current = 0;
          setStreak(0);
          cue = "wrong";

          if (incorrectStreakRef.current >= 10 && !studyNudgeShownRef.current) {
            studyNudgeShownRef.current = true;
            setShowStudyNudge(true);
          }
        }

        // Each question plays at most once, so a retried submission cannot
        // repeat or stack a sound.
        if (!playedCuesRef.current.has(item.questionId)) {
          playedCuesRef.current.add(item.questionId);
          sound(cue);
        }
      }
    },
    [sound]
  );

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

    unlockAudio();
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
        // of leaving the question stuck on Submit.
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
      setQuitOpen(false);

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

        sound("complete");
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
    [router, sound]
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
      unlockAudio();
      sound("tap");
      setAnswers((previous) => ({ ...previous, [question.id]: index }));
      setAnswerError(null);
      if (!isInstant) {
        dirtyRef.current.add(question.id);
        setSaveState("idle");
      }
    },
    [question, expired, isInstant, sound]
  );

  const goTo = useCallback(
    (index: number) => {
      const next = Math.min(Math.max(index, 0), Math.max(0, questions.length - 1));
      setCurrent(next);
    },
    [questions.length]
  );

  const goNext = useCallback(() => {
    if (current >= questions.length - 1) return;
    goTo(current + 1);
  }, [current, questions.length, goTo]);

  useEffect(() => {
    if (!confirmOpen && !quitOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (confirmOpen && !submittingAttempt) setConfirmOpen(false);
      if (quitOpen) setQuitOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen, quitOpen, submittingAttempt]);

  useEffect(() => {
    if (!attempt) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (confirmOpen || quitOpen) return;

      const key = event.key.toLowerCase();
      const digit = /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : -1;
      const letterIndex = /^[a-h]$/.test(key) ? key.charCodeAt(0) - 97 : -1;
      const optionIndex = digit >= 0 ? digit : letterIndex;

      if (optionIndex >= 0 && question && optionIndex < question.options.length) {
        event.preventDefault();
        selectOption(optionIndex);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (!isInstant) {
          if (current === questions.length - 1) setConfirmOpen(true);
          else goNext();
          return;
        }
        if (currentFeedback) {
          if (current === questions.length - 1) void finalize();
          else goNext();
        } else {
          void submitAnswer();
        }
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
  }, [
    attempt,
    question,
    confirmOpen,
    quitOpen,
    isInstant,
    selectOption,
    goNext,
    goTo,
    current,
    currentFeedback,
    finalize,
    submitAnswer,
    questions.length,
  ]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value !== null && value !== undefined).length,
    [answers]
  );

  const leaveAssessment = () => {
    if (finishedRef.current) return;
    sound("tap");
    sendDeparture("left assessment");
    finishedRef.current = true;
    router.push(`/courses/${attempt?.courseSlug ?? ""}`);
  };

  /* ── Loading / terminal states ────────────────────────────────────────── */
  if (loading) {
    return <QuizmiLoader message="Setting up your quiz…" />;
  }

  if (terminated && attempt) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:py-24">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-destructive/10 text-destructive shadow-sm">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold sm:text-2xl">This attempt has ended</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You left {attempt.maxDepartures} times. Your answers were scored and the attempt cannot be
          resumed.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="h-11 px-6">
            <Link href={`/results/${attempt.id}`}>See results</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-6">
            <Link href={`/courses/${attempt.courseSlug}`}>Back to course</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loadError || !attempt || !question) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:py-24">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-destructive/10 text-destructive shadow-sm">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold sm:text-2xl">We couldn’t open that quiz</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {loadError ?? "That attempt is not available."}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => window.location.reload()} className="h-11 px-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline" className="h-11 px-6">
            <Link href="/courses">Back to courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const submittedCount = isInstant
    ? questions.filter((item) => Boolean(feedbackByQuestion[item.id])).length
    : answeredCount;
  const progressCount = isInstant ? submittedCount : answeredCount;
  const isFinalQuestion = current === totalQuestions - 1;
  const isFirstQuestion = current === 0;
  const departures = attempt.departures;
  const correctOptionText =
    currentFeedback && currentFeedback.correctIndex >= 0
      ? question.options[currentFeedback.correctIndex]
      : null;
  const isCorrect = Boolean(currentFeedback?.correct);
  const hint = isInstant
    ? currentFeedback
      ? "Press Enter to continue"
      : selection === null
        ? "Select an answer (A–D)"
        : "Press Enter to submit"
    : saveState === "saving"
      ? "Saving…"
      : selection === null
        ? "Select an answer (A–D)"
        : "Saved automatically";

  return (
    <div className="relative flex min-h-screen flex-col paper-dots">
      <BackgroundOrbs variant="quiz" />

      {/* Sticky runner header — quit, progress, streak, timer, sound. */}
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-4">
          <button
            onClick={() => {
              sound("tap");
              setQuitOpen(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
            aria-label="Leave quiz"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="text-sm font-semibold">
            Question {current + 1}{" "}
            <span className="text-muted-foreground">/ {totalQuestions}</span>
          </p>

          <div className="flex items-center gap-1">
            {streak >= 2 && (
              <span className="hidden items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold sm:flex">
                <Flame className="h-3.5 w-3.5" />
                {streak}
              </span>
            )}
            {departures > 0 && (
              <span
                className="hidden items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold sm:flex"
                title={`${departures} of ${attempt.maxDepartures} departures`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {departures}
              </span>
            )}
            {secondsLeft !== null ? (
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
                  urgent ? "bg-destructive/10 text-destructive" : "bg-muted"
                }`}
                aria-label={`Time remaining ${formatCountdown(secondsLeft)}`}
              >
                <Clock className="h-3.5 w-3.5" />
                {formatCountdown(secondsLeft)}
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                Untimed
              </span>
            )}
            <button
              onClick={toggleSound}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
              aria-label={soundOn ? "Mute sound" : "Unmute sound"}
              aria-pressed={!soundOn}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* One segment per question, filling as the attempt progresses. */}
        <div className="flex h-1 gap-0.5">
          {questions.map((item, index) => {
            const graded = feedbackByQuestion[item.id];
            const answered = answers[item.id] !== null && answers[item.id] !== undefined;
            const fill = graded ? (graded.correct ? "bg-success" : "bg-destructive") : "bg-accent";
            return (
              <div key={item.id} className="h-full flex-1 bg-muted">
                <motion.div
                  className={`h-full ${fill}`}
                  initial={false}
                  animate={{
                    width: graded || answered ? "100%" : index === current ? "40%" : "0%",
                  }}
                  transition={{ duration: 0.3, ease }}
                />
              </div>
            );
          })}
        </div>

        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(current - 1)}
            disabled={isInstant || isFirstQuestion || submittingAttempt}
            className="h-9 bg-card px-3 shadow-sm sm:px-4"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Previous
          </Button>
          <p className="hidden text-xs text-muted-foreground sm:block">{hint}</p>

          {isInstant ? (
            currentFeedback ? (
              isFinalQuestion ? (
                <Button
                  size="sm"
                  onClick={() => void finalize()}
                  disabled={submittingAttempt}
                  className="h-9 px-4 sm:px-5"
                >
                  {submittingAttempt ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      See results
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button size="sm" onClick={goNext} className="h-9 px-4 sm:px-5">
                  Next
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )
            ) : (
              <Button
                size="sm"
                onClick={() => void submitAnswer()}
                disabled={selection === null || submittingAnswer || expired}
                className="h-9 px-4 sm:px-5"
              >
                {submittingAnswer ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            )
          ) : isFinalQuestion ? (
            <Button
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={submittingAttempt || expired}
              className="h-9 px-4 sm:px-5"
            >
              Finish Assessment
              <Check className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={goNext} className="h-9 px-4 sm:px-5">
              Next
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            role="status"
            className="fixed left-1/2 top-32 z-30 -translate-x-1/2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground shadow-xl"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Flame className="h-4 w-4 text-accent" />
              {celebrate === 3 ? "Very good! 3 in a row" : "You’re on fire! 5 in a row"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-3 py-6 sm:px-4 sm:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease }}
          >
            {attempt.subject && (
              <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                {attempt.subject}
              </span>
            )}
            <h1 className="mt-3 whitespace-pre-line text-pretty text-lg font-semibold leading-snug sm:text-xl">
              {question.prompt}
            </h1>

            {question.imageUrl && (
              <div className="mt-4 overflow-hidden rounded-[5px] border border-border bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.imageUrl}
                  alt="Question illustration"
                  className="max-h-72 w-full object-contain"
                />
              </div>
            )}

            <div className="relative mt-6">
              {isCorrect && <Graffiti seed={current} />}
              <motion.div
                className="space-y-2.5"
                animate={currentFeedback && !isCorrect ? { x: [0, -7, 7, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                role="radiogroup"
                aria-label="Answer options"
              >
                {question.options.map((option, index) => {
                  const selected = selection === index;
                  const right = Boolean(currentFeedback && index === currentFeedback.correctIndex);
                  const wrongSel = Boolean(currentFeedback && selected && !currentFeedback.correct);
                  return (
                    <motion.button
                      key={index}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={answerLocked || expired}
                      onClick={() => selectOption(index)}
                      whileTap={answerLocked || expired ? undefined : { scale: 0.985 }}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04, ease }}
                      className={`flex w-full items-center gap-3 rounded-full border-2 bg-card px-4 py-3 text-left transition-colors sm:gap-4 sm:py-3.5 ${
                        right
                          ? "border-success bg-success/10"
                          : wrongSel
                            ? "border-destructive bg-destructive/10"
                            : selected
                              ? "border-accent bg-secondary"
                              : "border-transparent shadow-sm hover:border-border"
                      } ${currentFeedback && !right && !wrongSel ? "opacity-55" : ""}`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          right
                            ? "bg-success text-primary-foreground"
                            : wrongSel
                              ? "bg-destructive text-primary-foreground"
                              : selected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                        }`}
                      >
                        {right ? (
                          <Check className="h-4 w-4" />
                        ) : wrongSel ? (
                          <X className="h-4 w-4" />
                        ) : (
                          optionLetter(index)
                        )}
                      </span>
                      <span className="flex-1 whitespace-pre-line text-sm leading-snug sm:text-[15px]">
                        {option}
                      </span>
                      {right && (
                        <span className="hidden text-xs font-semibold text-success sm:inline">
                          Correct
                        </span>
                      )}
                      {wrongSel && (
                        <span className="hidden text-xs font-semibold text-destructive sm:inline">
                          Your answer
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            <AnimatePresence>
              {isInstant && currentFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease }}
                  className={`mt-5 rounded-[5px] border px-4 py-3.5 ${
                    isCorrect
                      ? "border-success/30 bg-success/10"
                      : "border-destructive/30 bg-destructive/10"
                  }`}
                  role="status"
                >
                  <p
                    className={`text-sm font-semibold ${
                      isCorrect ? "text-success" : "text-destructive"
                    }`}
                  >
                    {isCorrect ? "Correct!" : "Not quite."}
                  </p>
                  {!isCorrect && correctOptionText && (
                    <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                      Correct answer:{" "}
                      <strong className="font-bold">
                        {optionLetter(currentFeedback.correctIndex)}
                      </strong>
                      . {correctOptionText}
                    </p>
                  )}
                  {currentFeedback.explanation && (
                    <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                      <span className="font-semibold">Explanation. </span>
                      {currentFeedback.explanation}
                    </p>
                  )}
                  {currentFeedback.reference && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reference: {currentFeedback.reference}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {showStudyNudge && (
              <div
                role="dialog"
                aria-label="Study suggestion"
                className="animate-fade-up mt-5 flex items-start gap-3 rounded-[5px] border border-border bg-card px-4 py-3.5 shadow-sm"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Stuck in a rough patch?</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    That usually just means the material is still new. Review the course, or keep
                    going — the timer runs either way.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => window.location.assign(`/courses/${attempt.courseSlug}`)}
                    >
                      Review course
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowStudyNudge(false)}
                    >
                      Keep going
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {answerError && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease }}
                  className="mt-5 rounded-[5px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  role="alert"
                >
                  {answerError}
                </motion.p>
              )}
            </AnimatePresence>

            {submitError && (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[5px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <span className="flex-1">{submitError}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void finalize()}
                  className="h-8 bg-card"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Retry
                </Button>
              </div>
            )}

            {expired && (
              <p className="mt-5 flex items-center gap-2 rounded-[5px] bg-secondary px-4 py-3 text-sm">
                <Clock className="h-4 w-4" />
                {submittingAttempt ? "Time is up. Submitting your answers…" : "Time is up."}
              </p>
            )}

            <p className="mt-7 text-center text-xs text-muted-foreground">
              {progressCount} of {totalQuestions} {isInstant ? "submitted" : "answered"} · saved
              automatically
            </p>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Leaving ends the attempt, so it is always confirmed. */}
      <AlertDialog open={quitOpen} onOpenChange={setQuitOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5" />
              Leave this quiz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Leaving is recorded as a departure
              {departures > 0 ? ` (${departures} of ${attempt.maxDepartures} used)` : ""}. This
              attempt will not resume — starting again begins at the first question with a fresh
              timer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                leaveAssessment();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <Check className="h-5 w-5" />
              Finish Assessment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You answered {answeredCount} of {totalQuestions}.
              {totalQuestions - answeredCount > 0
                ? ` ${totalQuestions - answeredCount} unanswered question${
                    totalQuestions - answeredCount === 1 ? "" : "s"
                  } score${totalQuestions - answeredCount === 1 ? "s" : ""} zero.`
                : " Every question has an answer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submittingAttempt}>Keep going</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void finalize();
              }}
              disabled={submittingAttempt}
            >
              {submittingAttempt ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Finish Assessment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
