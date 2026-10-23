"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  CircleInfo,
  Clock,
  GraduationCap,
  ListCheck,
  Lock,
  Play,
  ShoppingBag,
  TargetDart,
  TriangleExclamation,
} from "@gravity-ui/icons";
import { Button } from "@/components/ui/button";
import { difficultyStyle, formatDate, formatPrice } from "@/lib/format";
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
  const [buying, setBuying] = useState(false);
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
        if (data) setCourse(data);
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
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="skeleton h-6 w-28 rounded-lg" />
          <div className="skeleton mt-5 h-48 rounded-2xl sm:h-64" />
          <div className="skeleton mt-5 h-10 w-64 rounded-lg" />
          <div className="mt-4 grid gap-0.5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || (!course && !error)) {
    return (
      <div className="bg-background">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <CircleInfo className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Course unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This course may have been unpublished or the link is incorrect.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link href="/courses">Back to courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="bg-background">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <TriangleExclamation className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Could not load this course</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-6 rounded-full" onClick={loadCourse}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const difficulty = difficultyStyle(course.difficulty);
  const locked = !course.hasAccess;
  const exhausted = course.attemptsRemaining !== null && course.attemptsRemaining <= 0;
  const resumeId = course.inProgressAttemptId;
  const canBegin = !locked && !exhausted && course.questionCount > 0;

  return (
    <div className="bg-background">
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
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
              <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
            ) : (
              <TriangleExclamation className="mt-0.5 h-4 w-4 flex-shrink-0" />
            )}
            {notice.message}
          </p>
        )}

        {/* Course banner */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          {course.coverImageUrl ? (
            <div className="relative h-40 w-full bg-muted sm:h-56">
              {/* Course artwork may be hosted on any origin, so it is rendered as a plain image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.coverImageUrl}
                alt={`${course.title} course banner`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-36 w-full items-end bg-gradient-to-br from-primary/85 via-primary/70 to-brand p-5 sm:h-48 sm:p-6">
              <div className="flex items-center gap-3 text-primary-foreground">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                  <GraduationCap className="h-6 w-6" />
                </span>
                <span className="text-sm font-bold uppercase tracking-[0.18em]">
                  {course.code ?? course.subject ?? "Course"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {course.code && (
            <span className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
              {course.code}
            </span>
          )}
          <span
            className={`rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${difficulty.className}`}
          >
            {difficulty.label}
          </span>
          {course.subject && (
            <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {course.subject}
            </span>
          )}
          {course.isPurchased && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <Check className="h-3 w-3" /> Purchased
            </span>
          )}
          {course.isFree && (
            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              Free course
            </span>
          )}
          {resumeId && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <Play className="h-3 w-3" /> In progress
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
          {course.title}
        </h1>

        {/* Primary action sits directly beneath the course heading. */}
        {locked ? (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-primary/25 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Unlock this assessment</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  One-time payment of {formatPrice(course.priceKobo, course.currency)}. Access is
                  granted after the server verifies your payment.
                </p>
              </div>
            </div>
            <Button
              onClick={buyCourse}
              disabled={buying || !isLoaded || course.questionCount === 0}
              className="h-11 w-full rounded-lg text-sm font-bold sm:w-auto sm:px-6"
            >
              {buying ? "Starting checkout…" : isSignedIn ? "Buy this course" : "Sign in to buy"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild={canBegin}
              disabled={!canBegin}
              className="h-12 rounded-lg px-7 text-sm font-bold"
            >
              {canBegin ? (
                <Link href={`/courses/${course.slug}/configure`}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <span>
                  {course.questionCount === 0
                    ? "No questions yet"
                    : exhausted
                      ? "No attempts left"
                      : "Assessment unavailable"}
                </span>
              )}
            </Button>

            {resumeId && (
              <Button asChild variant="outline" className="h-12 rounded-lg px-6 text-sm font-bold">
                <Link href={`/exam/${resumeId}`}>
                  <Play className="h-4 w-4" />
                  Resume assessment
                </Link>
              </Button>
            )}

            <p className="text-xs font-medium text-muted-foreground sm:ml-2">
              {exhausted
                ? `You have used all ${course.maxAttempts} attempts for this course.`
                : "Choose your duration, question count and result preference next."}
            </p>
          </div>
        )}

        {course.description && (
          <p className="mt-6 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
            {course.description}
          </p>
        )}

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            <TriangleExclamation className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}

        {!course.paymentConfigured && locked && course.questionCount > 0 && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Online checkout is not configured on this deployment yet. Add the Paystack server key to
            enable purchases.
          </p>
        )}

        {/* Course information */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: ListCheck, label: "Questions available", value: course.questionCount.toLocaleString() },
            {
              icon: Clock,
              label: "Duration choice",
              value:
                course.durationMinutes !== null
                  ? `${course.durationMinutes} min suggested`
                  : "10–60 min or unlimited",
            },
            { icon: TargetDart, label: "Pass mark", value: `${course.passScore}%` },
            {
              icon: BookOpen,
              label: "Attempts",
              value: course.maxAttempts
                ? `${course.attemptsUsed} of ${course.maxAttempts} used`
                : `${course.attemptsUsed} taken`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border/70 bg-card p-3.5 shadow-sm"
            >
              <item.icon className="h-4 w-4 text-primary" />
              <p className="mt-2.5 text-sm font-extrabold leading-tight text-card-foreground">
                {item.value}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {course.attemptsUsed > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-border/70 bg-card p-4 text-center">
            <div>
              <p className="text-lg font-extrabold text-foreground">{course.bestPercentage ?? 0}%</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Your best</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">{course.lastPercentage ?? 0}%</p>
              <p className="text-[11px] font-semibold text-muted-foreground">Last score</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">{course.averagePercentage ?? 0}%</p>
              <p className="text-[11px] font-semibold text-muted-foreground">All takers</p>
            </div>
          </div>
        )}

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border/70 bg-card p-5">
            <h2 className="text-base font-bold text-card-foreground">How the assessment runs</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-3">
                <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                Answers are validated and scored on the server. The browser never sees the answer
                key for an attempt that has not been submitted.
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                Choose 10–60 minutes or unlimited time, then choose how many of the{" "}
                {course.questionCount.toLocaleString()} questions to attempt.
              </li>
              <li className="flex gap-3">
                <Play className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                Instant Results gives feedback after each answer. Results at the End keeps answers
                hidden until you finish.
              </li>
              <li className="flex gap-3">
                <TriangleExclamation className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                Leaving the assessment is recorded. After three departures the attempt ends and
                cannot resume; your saved answers are scored.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-5">
            <h2 className="text-base font-bold text-card-foreground">
              {locked ? "What you unlock" : "What you get"}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {[
                "Access to the full question bank for this course",
                "Choose the number of questions for each attempt",
                "Timed or unlimited computer-based practice",
                "Saved progress if the page refreshes",
                "A dedicated exam screen with answer review and explanations",
                "Attempt history and performance analytics",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {locked && (
          <section className="mt-4 rounded-2xl border border-border/70 bg-card p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-card-foreground">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Course access
            </h2>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-black tracking-tight text-foreground">
                  {formatPrice(course.priceKobo, course.currency)}
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  One-time payment · access verified on the server
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
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
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Results and history stay in your
                  account
                </li>
              </ul>
            </div>
          </section>
        )}

        {!locked && (
          <p className="mt-4 text-xs text-muted-foreground">
            {course.isPurchased
              ? `Purchased${course.purchasedAt ? ` on ${formatDate(course.purchasedAt)}` : ""}.`
              : "Free course — no purchase required."}{" "}
            Secure checkout by Paystack when applicable. Access is granted only after server
            verification.
          </p>
        )}
      </main>
    </div>
  );
}
