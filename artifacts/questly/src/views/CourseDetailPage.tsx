"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Infinity as InfinityIcon,
  Loader2,
  Lock,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  Timer,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_DURATION_MINUTES,
  DURATION_OPTIONS,
  MAX_QUESTIONS_PER_ATTEMPT,
  QUESTION_COUNT_PRESETS,
} from "@/lib/course-config";
import { difficultyStyle, formatDuration, formatPrice } from "@/lib/format";
import type { CourseDetail } from "@/lib/types";

type Notice = { tone: "success" | "error"; message: string };

export default function CourseDetailPage() {
  const params = useParams() as { slug?: string };
  const slug = params?.slug ?? "";
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [buying, setBuying] = useState(false);
  const [questionCount, setQuestionCount] = useState("20");
  const [duration, setDuration] = useState<number | null>(DEFAULT_DURATION_MINUTES);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadCourse = () => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
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
        const available = Math.min(data.questionCount, MAX_QUESTIONS_PER_ATTEMPT);
        setQuestionCount(String(Math.max(1, Math.min(20, available))));
        setDuration(
          data.durationMinutes !== null && DURATION_OPTIONS.some((option) => option.minutes === data.durationMinutes)
            ? data.durationMinutes
            : DEFAULT_DURATION_MINUTES
        );
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load this course");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const payment = query.get("payment");
    if (payment === "success") {
      setNotice({ tone: "success", message: "Payment confirmed. This course is now in your account." });
      window.history.replaceState({}, "", window.location.pathname);
    } else if (payment === "failed" || payment === "missing") {
      setNotice({
        tone: "error",
        message: "The payment could not be confirmed. You have not been charged for access.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const available = Math.min(course?.questionCount ?? 0, MAX_QUESTIONS_PER_ATTEMPT);
  const parsedCount = Number(questionCount);
  const countValid =
    Number.isInteger(parsedCount) && parsedCount >= 1 && parsedCount <= available;

  const presets = useMemo(() => {
    if (available <= 0) return [];
    const values = new Set<number>();
    for (const value of QUESTION_COUNT_PRESETS) {
      if (value <= available) values.add(value);
    }
    values.add(available);
    return Array.from(values).sort((a, b) => a - b);
  }, [available]);

  const beginAssessment = async () => {
    if (!course) return;
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/courses/${course.slug}`);
      return;
    }
    if (!countValid) {
      setError(`Choose between 1 and ${available} questions.`);
      return;
    }

    setStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: course.slug,
          questionCount: parsedCount,
          durationMinutes: duration,
        }),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.push(`/sign-in?redirect_url=/courses/${course.slug}`);
        return;
      }
      if (!response.ok) {
        setError(data?.error ?? "Could not start this assessment");
        return;
      }
      router.push(`/exam/${data.id}`);
    } catch {
      setError("Could not start this assessment. Check your connection and try again.");
    } finally {
      setStarting(false);
    }
  };

  const buyCourse = async () => {
    if (!course) return;
    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/courses/${course.slug}`);
      return;
    }

    setBuying(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: course.slug }),
      });
      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.push(`/sign-in?redirect_url=/courses/${course.slug}`);
        return;
      }
      if (!response.ok) {
        setError(data?.error ?? "Could not start checkout");
        return;
      }

      if (data.kind === "redirect" && data.authorizationUrl) {
        window.location.assign(data.authorizationUrl);
        return;
      }
      if (data.kind === "owned" || data.kind === "free") {
        loadCourse();
        return;
      }
      setError("Checkout did not return a payment link. Try again.");
    } catch {
      setError("Could not reach the payment provider. Try again.");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="skeleton h-8 w-40 rounded-lg" />
          <div className="skeleton mt-6 h-36 rounded-2xl" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="bg-background">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Course unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This course may have been unpublished or the link is incorrect.
          </p>
          <Link href="/courses" className="mt-6">
            <Button className="rounded-full">Back to courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const difficulty = difficultyStyle(course.difficulty);
  const exhausted = course.attemptsRemaining !== null && course.attemptsRemaining <= 0;
  const resumeId = course.inProgressAttemptId;
  const locked = !course.hasAccess;

  return (
    <div className="bg-background">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Courses
        </Link>

        {notice && (
          <p
            className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-xs font-semibold ${
              notice.tone === "success"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {notice.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            )}
            {notice.message}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${difficulty.className}`}
          >
            {difficulty.label}
          </span>
          {course.subject && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {course.subject}
            </span>
          )}
          {course.isPurchased && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Check className="h-3 w-3" /> Purchased
            </span>
          )}
          {course.isFree && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              Free course
            </span>
          )}
          {resumeId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <PlayCircle className="h-3 w-3" /> In progress
            </span>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
          {course.title}
        </h1>
        {course.description && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {course.description}
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: HelpCircle, label: "Questions available", value: course.questionCount.toLocaleString() },
            { icon: Clock, label: "Timer", value: "10–60 min or unlimited" },
            { icon: Trophy, label: "Pass mark", value: `${course.passScore}%` },
            {
              icon: BookOpen,
              label: "Attempts",
              value: course.maxAttempts
                ? `${course.attemptsUsed} of ${course.maxAttempts} used`
                : `${course.attemptsUsed} taken`,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/70 bg-card p-4">
              <item.icon className="h-4 w-4 text-primary" />
              <p className="mt-3 text-base font-extrabold text-card-foreground">{item.value}</p>
              <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card p-6">
              <h2 className="text-base font-bold text-card-foreground">How this assessment runs</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  Answers are scored on the server. Correct answers are only revealed after you submit.
                </li>
                <li className="flex gap-3">
                  <Timer className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  Choose any number of questions up to {available.toLocaleString()}, then select a
                  timer from 10 to 60 minutes or take it untimed.
                </li>
                <li className="flex gap-3">
                  <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  You can move between questions freely. Answers save automatically as you go.
                </li>
                <li className="flex gap-3">
                  <Trophy className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  Pass mark is {course.passScore}%. Your full answer review is available immediately
                  after submission.
                </li>
              </ul>

              {course.attemptsUsed > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-muted/50 p-4 text-center">
                  <div>
                    <p className="text-lg font-extrabold text-foreground">{course.bestPercentage ?? 0}%</p>
                    <p className="text-[11px] font-semibold text-muted-foreground">Your best</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-foreground">{course.lastPercentage ?? 0}%</p>
                    <p className="text-[11px] font-semibold text-muted-foreground">Last score</p>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-foreground">
                      {course.averagePercentage ?? 0}%
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground">All takers</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-6">
              <h2 className="text-base font-bold text-card-foreground">What you get</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {[
                  "Access to the full question bank for this course",
                  "Choose the number of questions for each attempt",
                  "Timed or unlimited computer-based practice",
                  "Saved progress if the page refreshes",
                  "Instant score, pass/fail status and answer review",
                  "Attempt history and performance analytics",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="lg:sticky lg:top-24 lg:self-start">
            {locked ? (
              <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                  <ShoppingBag className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-wide">Course access</p>
                </div>
                <p className="mt-4 text-3xl font-black tracking-tight text-foreground">
                  {formatPrice(course.priceKobo, course.currency)}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">One-time payment</p>

                <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" /> Full question bank
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    {course.maxAttempts
                      ? `${course.maxAttempts} attempt${course.maxAttempts === 1 ? "" : "s"} included`
                      : "Unlimited practice attempts"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500" /> Results and history stay in your account
                  </li>
                </ul>

                {error && (
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    {error}
                  </p>
                )}

                <Button
                  onClick={buyCourse}
                  disabled={buying || !isLoaded || course.questionCount === 0}
                  className="mt-5 h-12 w-full rounded-full text-sm font-bold"
                >
                  {buying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Starting checkout…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      {course.questionCount === 0
                        ? "Not open for enrolment yet"
                        : isSignedIn
                          ? "Buy this course"
                          : "Sign in to buy"}
                    </>
                  )}
                </Button>

                {course.questionCount === 0 && (
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                    This course has no questions yet. It will open for enrolment once its assessment
                    is available.
                  </p>
                )}

                {!course.paymentConfigured && course.questionCount > 0 && (
                  <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
                    Online checkout is not configured on this deployment yet. Add the Paystack server
                    key to enable purchases.
                  </p>
                )}
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Secure checkout by Paystack. Access is granted after the server verifies payment.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                {resumeId ? (
                  <>
                    <h2 className="text-base font-bold text-card-foreground">Attempt in progress</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Continue where you left off. If you chose a timer, it is still running on the
                      server.
                    </p>
                    <Link href={`/exam/${resumeId}`} className="mt-5 block">
                      <Button className="h-12 w-full rounded-full text-sm font-bold">
                        <PlayCircle className="h-4 w-4" /> Resume assessment
                      </Button>
                    </Link>
                  </>
                ) : exhausted ? (
                  <div className="rounded-xl bg-muted/60 p-4 text-center">
                    <p className="text-sm font-bold text-foreground">No attempts left</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      You have used all {course.maxAttempts} attempts for this course.
                    </p>
                    <Link href="/courses" className="mt-3 inline-block">
                      <Button variant="outline" size="sm" className="rounded-full">
                        Find another course
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-bold text-card-foreground">Start an assessment</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Set your question count and timer before you begin.
                    </p>

                    <div className="mt-5">
                      <label
                        htmlFor="question-count"
                        className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
                      >
                        Number of questions
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl"
                          onClick={() =>
                            setQuestionCount(String(Math.max(1, (parsedCount || 1) - 5)))
                          }
                          aria-label="Fewer questions"
                        >
                          −
                        </Button>
                        <input
                          id="question-count"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={available}
                          value={questionCount}
                          onChange={(event) => setQuestionCount(event.target.value)}
                          className="h-10 min-w-0 flex-1 rounded-xl border border-border/70 bg-background px-3 text-center text-sm font-bold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl"
                          onClick={() =>
                            setQuestionCount(String(Math.min(available, (parsedCount || 0) + 5)))
                          }
                          aria-label="More questions"
                        >
                          +
                        </Button>
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Up to {available.toLocaleString()} available for this course.
                      </p>
                      {presets.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {presets.map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setQuestionCount(String(value))}
                              aria-pressed={parsedCount === value}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                parsedCount === value
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Timer
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {DURATION_OPTIONS.map((option) => {
                          const selected = duration === option.minutes;
                          return (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => setDuration(option.minutes)}
                              aria-pressed={selected}
                              className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-bold transition-colors ${
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {option.minutes === null ? (
                                <InfinityIcon className="h-3.5 w-3.5" />
                              ) : (
                                <Timer className="h-3.5 w-3.5" />
                              )}
                              {option.minutes === null ? "Unlimited" : `${option.minutes} min`}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {duration === null
                          ? "No deadline. Submit whenever you are ready."
                          : `Deadline enforced after ${formatDuration(duration)}.`}
                      </p>
                    </div>

                    {error && (
                      <p className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        {error}
                      </p>
                    )}

                    <Button
                      onClick={beginAssessment}
                      disabled={starting || !isLoaded || !countValid || available === 0}
                      className="mt-5 h-12 w-full rounded-full text-sm font-bold"
                    >
                      {starting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Preparing assessment…
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4" />
                          {isSignedIn ? "Start assessment" : "Sign in to start"}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <p className="mt-3 text-center text-[11px] text-muted-foreground">
                      {available === 0
                        ? "This course does not have questions yet."
                        : `${parsedCount || 0} questions · ${formatDuration(duration)}`}
                    </p>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
