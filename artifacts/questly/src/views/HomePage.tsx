"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button, SearchField } from "@heroui/react";
import {
  ArrowRight,
  BookOpen,
  ChartLine,
  CircleCheck,
  Clock,
  GraduationCap,
  Keyboard,
  ListCheck,
  ShieldCheck,
  Sparkles,
} from "@gravity-ui/icons";
import CourseCard from "@/components/CourseCard";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import ButtonLink from "@/components/ui/ButtonLink";
import type { CourseSummary } from "@/lib/types";

const STEPS = [
  {
    step: "01",
    title: "Choose a course",
    body: "Search the catalogue by course title or code, then read exactly what the assessment covers before you commit.",
    icon: BookOpen,
  },
  {
    step: "02",
    title: "Set the conditions",
    body: "Pick how many questions to answer, choose a timer from 10 to 60 minutes or go untimed, and decide when results are revealed.",
    icon: ListCheck,
  },
  {
    step: "03",
    title: "Review every answer",
    body: "Submit, get a server-scored result, and work through the full answer review. Every attempt is saved to your history.",
    icon: ChartLine,
  },
];

const FEATURES = [
  {
    icon: Clock,
    title: "Timed like exam day",
    body: "Deadlines are enforced on the server, so the clock keeps running even if you refresh or leave the page.",
  },
  {
    icon: Keyboard,
    title: "Built for flow",
    body: "Move between questions with the map or keyboard shortcuts while answers save quietly as you work.",
  },
  {
    icon: ShieldCheck,
    title: "Honest scoring",
    body: "Correct answers stay hidden until submission. Your score is calculated by the server, never the browser.",
  },
  {
    icon: GraduationCap,
    title: "Made for long sessions",
    body: "Question sets are drawn per attempt, so courses with hundreds of questions stay fast and focused.",
  },
];

const CUBE_PHRASES = [
  "Search your course",
  "Choose a timer",
  "Answer with focus",
  "Review every answer",
];

type HomePageProps = {
  initialCourses: CourseSummary[];
  initialSubjects: string[];
  initialError: string | null;
};

export default function HomePage({
  initialCourses,
  initialSubjects,
  initialError,
}: HomePageProps) {
  const { isSignedIn } = useUser();
  const [courses, setCourses] = useState<CourseSummary[]>(initialCourses);
  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [subject, setSubject] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [reloadKey, setReloadKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const skippedInitialFetch = useRef(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 280);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // The server already provided the first page of courses. If it failed, the
    // client retries immediately so the page can recover without a reload.
    if (
      !skippedInitialFetch.current &&
      reloadKey === 0 &&
      debounced === "" &&
      subject === "all"
    ) {
      skippedInitialFetch.current = true;
      if (!initialError) return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({ limit: "12" });
    if (debounced) params.set("q", debounced);
    if (subject !== "all") params.set("subject", subject);

    setLoading(true);
    setError(null);

    fetch(`/api/courses?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Course search failed");
        }
        return payload as { courses: CourseSummary[]; subjects: string[] };
      })
      .then((data) => {
        setCourses(Array.isArray(data.courses) ? data.courses : []);
        if (Array.isArray(data.subjects) && data.subjects.length > 0) {
          setSubjects(data.subjects);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Courses could not be loaded");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, subject, reloadKey]);

  const isFiltering = debounced.length > 0 || subject !== "all";

  const scrollToCourses = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const courseCountLabel = useMemo(() => {
    if (loading) return "Searching the catalogue…";
    const count = courses.length;
    return `${count} course${count === 1 ? "" : "s"}${debounced ? " found" : " published"}`;
  }, [courses.length, debounced, loading]);

  return (
    <div className="overflow-x-clip">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-mesh relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-0 h-[26rem] w-[26rem] rounded-full bg-accent/20 blur-[90px] animate-aurora" />
          <div className="absolute -right-20 top-24 h-[22rem] w-[22rem] rounded-full bg-[var(--brand-coral)]/15 blur-[100px] animate-aurora [animation-delay:-8s]" />
          <div className="absolute bottom-0 left-1/3 h-[18rem] w-[18rem] rounded-full bg-[var(--brand-mint)]/15 blur-[90px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-surface/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Course-based CBT practice
            </span>

            <h1 className="mt-6 text-display-xl text-foreground">
              Practise like it&apos;s
              <span className="block text-gradient">the real thing.</span>
            </h1>

            <p className="mt-6 max-w-xl lede">
              Real course questions, real timing, real feedback. Choose a course, set the
              conditions for this attempt, and walk into the exam having already done the work.
            </p>

            <form
              className="mt-9 flex max-w-xl flex-col gap-2.5 sm:flex-row sm:items-center"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                setDebounced(search.trim());
                scrollToCourses();
              }}
            >
              <div className="flex-1">
                <SearchField
                  aria-label="Search courses by name or code"
                  value={search}
                  onChange={setSearch}
                  className="w-full"
                >
                  <SearchField.Group className="h-[3.25rem] rounded-2xl border border-border bg-surface shadow-[0_10px_30px_-22px_rgba(35,25,80,0.5)] transition-colors focus-within:border-accent/60">
                    <SearchField.SearchIcon className="ml-1.5 text-muted-foreground" />
                    <SearchField.Input
                      placeholder="Course name or code, e.g. GST 112"
                      className="text-[15px]"
                    />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-[3.25rem] flex-shrink-0 rounded-2xl px-6 text-[14px] font-semibold shadow-[0_16px_34px_-18px_rgba(91,75,255,0.9)]"
              >
                Find a course
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12px] font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CircleCheck className="h-4 w-4 text-success" />
                Choose your question count
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CircleCheck className="h-4 w-4 text-success" />
                Results saved automatically
              </span>
              <a
                href="#how-it-works"
                className="font-semibold text-foreground underline decoration-accent/35 decoration-2 underline-offset-4 transition-colors hover:text-accent"
              >
                How it works
              </a>
            </div>
          </div>

          {/* Product showcase — the PNG's transparency is the composition. */}
          <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
            <div
              aria-hidden
              className="absolute inset-x-6 bottom-4 top-16 rounded-[3.25rem] brand-gradient opacity-[0.16] blur-3xl"
            />
            <div className="relative animate-float">
              <Image
                src="/hero-mockup.png"
                alt="QUIZIMI open on a phone, showing course discovery"
                width={1536}
                height={1024}
                priority
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 620px, 640px"
                className="h-auto w-full drop-shadow-[0_32px_60px_rgba(35,25,90,0.18)]"
              />
            </div>

            <div className="absolute left-0 top-10 hidden items-center gap-2.5 rounded-2xl border border-border/80 bg-surface/90 px-3.5 py-2.5 shadow-card backdrop-blur sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-foreground">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[12px] font-semibold leading-none text-foreground">Server-timed</p>
                <p className="mt-1 text-[10.5px] leading-none text-muted-foreground">
                  Refresh-proof sessions
                </p>
              </div>
            </div>

            <div className="absolute -right-1 bottom-14 hidden items-center gap-2.5 rounded-2xl border border-border/80 bg-surface/90 px-3.5 py-2.5 shadow-card backdrop-blur sm:flex lg:-right-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-success-soft text-success-soft-foreground">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[12px] font-semibold leading-none text-foreground">
                  Scored on submit
                </p>
                <p className="mt-1 text-[10.5px] leading-none text-muted-foreground">
                  Answers stay hidden
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Course catalogue ─────────────────────────────────────────────── */}
      <section
        ref={resultsRef}
        id="courses"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{isFiltering ? "Search results" : "The catalogue"}</p>
            <h2 className="mt-3 text-display-lg text-foreground">
              {isFiltering && debounced
                ? `Courses matching “${debounced}”`
                : "Find the course you're preparing for"}
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {isFiltering
                ? "Every result is pulled live from the course catalogue."
                : "Each course is built from real questions, with its own timer, question pool and pass mark."}
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {courseCountLabel}
          </p>
        </div>

        {subjects.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {["all", ...subjects].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSubject(option)}
                aria-pressed={subject === option}
                className={`rounded-full border px-4 py-2 text-[12.5px] font-semibold transition-all ${
                  subject === option
                    ? "border-foreground bg-foreground text-background shadow-sm"
                    : "border-border bg-surface text-muted-foreground hover:border-accent/30 hover:text-foreground"
                }`}
              >
                {option === "all" ? "All subjects" : option}
              </button>
            ))}
          </div>
        )}

        <div className="mt-10">
          {error ? (
            <div className="rounded-3xl border border-danger/25 bg-danger-soft px-6 py-12 text-center">
              <p className="text-sm font-semibold text-danger-soft-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5 rounded-full"
                onPress={() => setReloadKey((key) => key + 1)}
              >
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton h-[23rem] rounded-[1.75rem]" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-[2rem] border border-border/80 bg-surface px-6 py-16 text-center">
              <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-soft-foreground">
                <BookOpen className="h-6 w-6" />
              </span>
              <h3 className="font-display text-xl font-semibold text-foreground">
                {isFiltering ? "No courses match that search" : "No courses published yet"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {isFiltering
                  ? "Try a different course name or code, or clear the filters to see everything."
                  : "Courses will appear here as soon as they are added to the catalogue."}
              </p>
              {isFiltering && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6 rounded-full"
                  onPress={() => {
                    setSearch("");
                    setDebounced("");
                    setSubject("all");
                  }}
                >
                  Clear the search
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <ButtonLink href="/courses" variant="outline" size="lg" className="rounded-full">
                  Browse the full catalogue
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                {!isSignedIn && (
                  <ButtonLink href="/sign-up" size="lg" className="rounded-full">
                    Create a free account
                  </ButtonLink>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-border/70 bg-[var(--surface-secondary)]"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">How QUIZIMI works</p>
            <h2 className="mt-3 text-display-lg text-foreground">
              Three steps.
              <br />
              One focused loop.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              No setup marathon. Open a course, choose the conditions for this attempt, and let the
              assessment take over.
            </p>

            <div className="mt-8 hidden w-fit rounded-[2rem] border border-border/70 bg-surface p-7 lg:block">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Practice, in motion
              </p>
              <div className="flex justify-center py-8">
                <div className="cube-stage" aria-hidden="true">
                  <div className="cube">
                    <div className="cube-face cube-face-front">
                      <span>{CUBE_PHRASES[0]}</span>
                    </div>
                    <div className="cube-face cube-face-right">
                      <span>{CUBE_PHRASES[1]}</span>
                    </div>
                    <div className="cube-face cube-face-back">
                      <span>{CUBE_PHRASES[2]}</span>
                    </div>
                    <div className="cube-face cube-face-left">
                      <span>{CUBE_PHRASES[3]}</span>
                    </div>
                    <div className="cube-face cube-face-top">
                      <span className="text-[10px] uppercase tracking-[0.2em]">QUIZIMI</span>
                    </div>
                    <div className="cube-face cube-face-bottom">
                      <span className="text-[10px] uppercase tracking-[0.2em]">CBT</span>
                    </div>
                  </div>
                </div>
                <span className="sr-only">
                  QUIZIMI: search your course, choose a timer, answer with focus, and review every
                  answer.
                </span>
              </div>
            </div>
          </div>

          <ol className="space-y-0">
            {STEPS.map((step, index) => (
              <li
                key={step.step}
                className="grid grid-cols-[2.6rem_1fr] gap-5 border-t border-border/80 py-8 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[3.5rem_1fr] sm:gap-7"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="font-display text-2xl font-semibold leading-none text-accent/45 sm:text-3xl">
                    {step.step}
                  </span>
                  {index < STEPS.length - 1 && (
                    <span aria-hidden className="h-full w-px flex-1 bg-border/80" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <step.icon className="h-4 w-4 text-accent" />
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Exam-day details ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">The details that matter</p>
          <h2 className="mt-3 text-display-lg text-foreground">
            Closer to the exam than a quiz.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            The small mechanics are the ones that decide how prepared you feel on the day.
          </p>
        </div>

        <div className="mt-12 grid gap-x-14 gap-y-10 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="border-t border-border pt-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-foreground">
                  <feature.icon className="h-4 w-4" />
                </span>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing call to action ───────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-6 lg:px-8">
        <div className="brand-gradient relative overflow-hidden rounded-[2.25rem] px-6 py-14 text-center shadow-[0_30px_70px_-30px_rgba(67,45,160,0.65)] sm:px-12 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full border border-white/15" />
            <div className="absolute -bottom-24 -left-12 h-72 w-72 rounded-full border border-white/10" />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/4 select-none font-display text-[8rem] font-bold uppercase leading-none tracking-tighter text-white/10 sm:text-[12rem]">
              QUIZIMI
            </span>
          </div>
          <div className="relative mx-auto max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              Ready when you are
            </p>
            <h2 className="mt-4 text-display-lg text-white">
              Pick a course. Start the clock.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-relaxed text-white/80">
              Open a course, set your question count and timer, and take a computer-based
              assessment with a full result report at the end.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink
                href="/courses"
                size="lg"
                className="rounded-full bg-white px-7 text-[#2a2150] hover:bg-white/90"
              >
                Explore courses
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              {!isSignedIn && (
                <Link
                  href="/sign-up"
                  className="rounded-full border border-white/30 px-7 py-3 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Create an account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70 bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-10 sm:px-6 lg:flex-row lg:px-8">
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <QuizmiWordmark size={26} />
            <p className="text-[11.5px] text-muted-foreground">
              Course-based computer-based testing
            </p>
          </div>
          <div className="flex items-center gap-6 text-[12.5px] font-semibold text-muted-foreground">
            <Link href="/courses" className="transition-colors hover:text-foreground">
              Courses
            </Link>
            <Link href="/demo" className="transition-colors hover:text-foreground">
              Free demo
            </Link>
            <Link href="/sign-in" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
