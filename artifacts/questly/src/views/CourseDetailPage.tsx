"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Alert, Button } from "@heroui/react";
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
  TargetDart,
  TriangleExclamation,
} from "@gravity-ui/icons";
import ButtonLink from "@/components/ui/ButtonLink";
import { formatDate, formatPrice } from "@/lib/format";
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
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="skeleton h-5 w-24 rounded-lg" />
        <div className="skeleton mt-5 h-[22rem] rounded-[2rem]" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-4">
            <div className="skeleton h-8 w-2/3 rounded-xl" />
            <div className="skeleton h-4 w-full rounded-lg" />
            <div className="skeleton h-4 w-5/6 rounded-lg" />
          </div>
          <div className="skeleton h-72 rounded-[1.75rem]" />
        </div>
      </main>
    );
  }

  if (notFound || (!course && !error)) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary text-muted-foreground">
          <CircleInfo className="h-6 w-6" />
        </span>
        <h1 className="text-display-md text-foreground">Course unavailable</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          This course may have been unpublished or the link is incorrect.
        </p>
        <ButtonLink href="/courses" className="mt-6 rounded-full">
          Back to courses
        </ButtonLink>
      </main>
    );
  }

  if (error && !course) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-5 py-24 text-center">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger-soft-foreground">
          <TriangleExclamation className="h-6 w-6" />
        </span>
        <h1 className="text-display-md text-foreground">Could not load this course</h1>
        <p className="mt-2.5 text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-6 rounded-full" onPress={loadCourse}>
          Try again
        </Button>
      </main>
    );
  }

  if (!course) return null;

  const locked = !course.hasAccess;
  const exhausted = course.attemptsRemaining !== null && course.attemptsRemaining <= 0;
  const resumeId = course.inProgressAttemptId;
  const canBegin = !locked && !exhausted && course.questionCount > 0;
  const actionLabel = course.questionCount === 0
    ? "No questions yet"
    : exhausted
      ? "No attempts left"
      : "Assessment unavailable";

  const facts = [
    {
      icon: ListCheck,
      label: "Question bank",
      value: `${course.questionCount.toLocaleString()} question${course.questionCount === 1 ? "" : "s"}`,
    },
    {
      icon: Clock,
      label: "Timing",
      value:
        course.durationMinutes !== null
          ? `${course.durationMinutes} min suggested`
          : "10–60 min or untimed",
    },
    { icon: TargetDart, label: "Pass mark", value: `${course.passScore}%` },
    {
      icon: BookOpen,
      label: "Attempts",
      value: course.maxAttempts
        ? `${course.attemptsUsed} of ${course.maxAttempts} used`
        : `${course.attemptsUsed} taken · unlimited`,
    },
  ];

  return (
    <div className="bg-background pb-4">
      <main className="mx-auto max-w-6xl px-5 pb-12 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All courses
        </Link>

        {notice && (
          <Alert
            status={notice.tone === "success" ? "success" : "danger"}
            className="mt-4"
          >
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {notice.tone === "success" ? "Payment confirmed" : "Payment not confirmed"}
              </Alert.Title>
              <Alert.Description>{notice.message}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {/* ── Editorial course hero ────────────────────────────────────────── */}
        <section className="relative mt-4 overflow-hidden rounded-[2rem] bg-[var(--background-inverse)]">
          {course.coverImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.coverImageUrl}
                alt={`${course.title} course banner`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[#160f2e]/95 via-[#160f2e]/65 to-[#160f2e]/20"
              />
            </>
          ) : (
            <div aria-hidden className="absolute inset-0 brand-gradient">
              <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full border border-white/15" />
              <div className="absolute -bottom-20 left-10 h-64 w-64 rounded-full border border-white/10" />
            </div>
          )}

          <div className="relative flex min-h-[20rem] flex-col justify-end px-6 pb-8 pt-24 sm:min-h-[24rem] sm:px-9 sm:pb-10">
            <div className="flex flex-wrap items-center gap-2">
              {course.code && (
                <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#241f33]">
                  {course.code}
                </span>
              )}
              {course.subject && (
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {course.subject}
                </span>
              )}
              {course.isFree && (
                <span className="rounded-full bg-[var(--brand-mint)] px-3 py-1 text-[11px] font-bold text-[#10231f]">
                  Free course
                </span>
              )}
              {course.isPurchased && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  <CircleCheck className="h-3.5 w-3.5" /> In your library
                </span>
              )}
              {resumeId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  <Play className="h-3 w-3" /> Attempt in progress
                </span>
              )}
            </div>

            <h1 className="mt-4 max-w-3xl text-display-lg text-white">{course.title}</h1>

            {course.description && (
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/75 sm:text-[15px]">
                {course.description.split("\n")[0]}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] font-medium text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <ListCheck className="h-3.5 w-3.5" />
                {course.questionCount.toLocaleString()} questions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {course.durationMinutes !== null ? `${course.durationMinutes} min default` : "Choose your timer"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <TargetDart className="h-3.5 w-3.5" />
                {course.passScore}% to pass
              </span>
            </div>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.45fr_0.55fr] lg:gap-12">
          {/* ── Main column ─────────────────────────────────────────────────── */}
          <div>
            {course.description && (
              <section>
                <h2 className="font-display text-[1.35rem] font-semibold text-foreground">
                  About this course
                </h2>
                <p className="mt-3 whitespace-pre-line text-[14.5px] leading-[1.8] text-muted-foreground">
                  {course.description}
                </p>
              </section>
            )}

            <section className="mt-10">
              <h2 className="font-display text-[1.35rem] font-semibold text-foreground">
                How the assessment runs
              </h2>
              <ul className="mt-4 divide-y divide-border/70 border-y border-border/70">
                {[
                  {
                    icon: CircleCheck,
                    tone: "text-success",
                    body: "Answers are validated and scored on the server. The browser never sees the answer key for an attempt that has not been submitted.",
                  },
                  {
                    icon: Clock,
                    tone: "text-accent",
                    body: `Choose 10–60 minutes or unlimited time, then choose how many of the ${course.questionCount.toLocaleString()} available questions to attempt.`,
                  },
                  {
                    icon: Play,
                    tone: "text-accent",
                    body: "Instant Results gives feedback after each answer. Results at the End keeps answers hidden until you finish.",
                  },
                  {
                    icon: TriangleExclamation,
                    tone: "text-warning",
                    body: "Leaving the assessment is recorded. After three departures the attempt ends and cannot resume; your saved answers are scored.",
                  },
                ].map((item) => (
                  <li key={item.body} className="flex gap-3.5 py-4">
                    <item.icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${item.tone}`} />
                    <p className="text-[13.5px] leading-relaxed text-muted-foreground">{item.body}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-[1.35rem] font-semibold text-foreground">
                {locked ? "What you unlock" : "What's included"}
              </h2>
              <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {[
                  "The full question bank for this course",
                  "Choose the number of questions each attempt",
                  "Timed or untimed computer-based practice",
                  "Progress saved if the page refreshes",
                  "A focused exam screen with answer review",
                  "Attempt history and performance insights",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {course.attemptsUsed > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-[1.35rem] font-semibold text-foreground">
                  Your performance
                </h2>
                <dl className="mt-4 grid grid-cols-3 gap-4 rounded-[1.5rem] bg-surface-secondary px-6 py-5">
                  {[
                    { label: "Your best", value: `${course.bestPercentage ?? 0}%` },
                    { label: "Last score", value: `${course.lastPercentage ?? 0}%` },
                    { label: "All takers", value: `${course.averagePercentage ?? 0}%` },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <dd className="font-display text-2xl font-semibold tracking-tight text-foreground">
                        {stat.value}
                      </dd>
                      <dt className="mt-1 text-[11px] font-semibold text-muted-foreground">
                        {stat.label}
                      </dt>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>

          {/* ── Action rail ─────────────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-[1.75rem] border border-border/80 bg-surface p-6 shadow-[0_20px_50px_-32px_rgba(35,25,80,0.45)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {locked ? "Course access" : course.isPurchased ? "You own this course" : "Free to start"}
              </p>
              <p className="mt-2 font-display text-[2rem] font-semibold leading-none tracking-[-0.03em] text-foreground">
                {locked ? formatPrice(course.priceKobo, course.currency) : "Ready"}
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                {locked
                  ? "One-time payment. Access is granted after the server verifies your payment."
                  : exhausted
                    ? `You have used all ${course.maxAttempts} attempts for this course.`
                    : "Choose your duration, question count and result mode next."}
              </p>

              <div className="mt-5 space-y-2.5">
                {locked ? (
                  <Button
                    fullWidth
                    size="lg"
                    className="rounded-xl"
                    isDisabled={buying || !isLoaded || course.questionCount === 0}
                    onPress={buyCourse}
                  >
                    {buying
                      ? "Starting checkout…"
                      : isSignedIn
                        ? "Unlock this course"
                        : "Sign in to buy"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : canBegin ? (
                  <ButtonLink
                    href={`/courses/${course.slug}/configure`}
                    fullWidth
                    size="lg"
                    className="rounded-xl"
                  >
                    Start an assessment
                    <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                ) : (
                  <Button fullWidth size="lg" className="rounded-xl" isDisabled>
                    {actionLabel}
                  </Button>
                )}

                {resumeId && (
                  <ButtonLink
                    href={`/exam/${resumeId}`}
                    variant="outline"
                    fullWidth
                    className="rounded-xl"
                  >
                    <Play className="h-4 w-4" />
                    Resume assessment
                  </ButtonLink>
                )}
              </div>

              <dl className="mt-6 space-y-3 border-t border-border/70 pt-5">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-start gap-3">
                    <fact.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {fact.label}
                      </dt>
                      <dd className="mt-0.5 text-[13px] font-semibold text-foreground">{fact.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              {exhausted && !locked && (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-warning-soft-foreground">
                  <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  This course allows {course.maxAttempts} attempt
                  {course.maxAttempts === 1 ? "" : "s"}.
                </p>
              )}

              {!course.paymentConfigured && locked && course.questionCount > 0 && (
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  Online checkout is not configured on this deployment yet. Add the Paystack server
                  key to enable purchases.
                </p>
              )}

              <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <GraduationCap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {course.isPurchased
                  ? `Purchased${course.purchasedAt ? ` on ${formatDate(course.purchasedAt)}` : ""}. Secure payment by Paystack; access verified on the server.`
                  : "Secure checkout by Paystack. Access is granted only after server verification."}
              </p>
            </div>

            {error && (
              <Alert status="danger" className="mt-4">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            {!locked && !resumeId && course.questionCount === 0 && (
              <p className="mt-4 rounded-xl bg-surface-secondary px-4 py-3 text-[11.5px] leading-relaxed text-muted-foreground">
                Question sets for this course are still being prepared. Check back soon.
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
