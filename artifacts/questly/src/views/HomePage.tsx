"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Keyboard,
  ListChecks,
  Search,
  ShieldCheck,
  Timer,
  X,
} from "lucide-react";
import CourseCard from "@/components/CourseCard";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import { Button } from "@/components/ui/button";
import type { CourseSummary } from "@/lib/types";

const STEPS = [
  {
    step: "01",
    title: "Choose a course",
    body: "Browse the catalogue, read what each course covers, and pick the one you are preparing for.",
    icon: BookOpen,
  },
  {
    step: "02",
    title: "Set up your attempt",
    body: "Choose how many questions to answer and select a timer from 10 to 60 minutes — or take it untimed.",
    icon: ListChecks,
  },
  {
    step: "03",
    title: "Review your results",
    body: "Submit, get an instant score, and study the answer review. Every attempt is saved to your history.",
    icon: BarChart3,
  },
];

const FEATURES = [
  {
    icon: Timer,
    title: "Timed like the real thing",
    body: "Deadlines are enforced on the server, so the clock keeps running even if you refresh.",
  },
  {
    icon: Keyboard,
    title: "Fast question navigation",
    body: "Jump to any question with the map or keyboard shortcuts. Answers save as you work.",
  },
  {
    icon: ShieldCheck,
    title: "Server-scored results",
    body: "Correct answers stay hidden until submission. Your score comes from the server, not the browser.",
  },
  {
    icon: ListChecks,
    title: "Built for long assessments",
    body: "Question sets are selected per attempt, so courses with hundreds of questions stay responsive.",
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
    if (loading) return "Searching courses…";
    const count = courses.length;
    return `${count} course${count === 1 ? "" : "s"}${debounced ? " found" : " shown"}`;
  }, [courses.length, debounced, loading]);

  return (
    <div className="bg-background">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-x-14 lg:gap-y-8 lg:py-20">
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-accent-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Welcome to QUIZIMI
            </p>

            <h1 className="mt-5 text-4xl font-black leading-[1.04] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Practice real questions.
              <span className="block text-primary">Walk in prepared.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Course-based practice for computer-based tests. Search the catalogue, choose your
              timer, and finish with a scored result and a full answer review.
            </p>

            <form
              className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                setDebounced(search.trim());
                scrollToCourses();
              }}
              role="search"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search courses, subjects or topics"
                  aria-label="Search courses"
                  className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-11 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button type="submit" size="lg" className="h-12 rounded-xl px-6 text-sm font-bold">
                Search courses
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href={isSignedIn ? "/dashboard" : "/sign-up"}
                className="text-sm font-bold text-primary underline-offset-4 hover:underline"
              >
                {isSignedIn ? "Go to your dashboard" : "Create a free account"}
              </Link>
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                How QUIZIMI works
              </a>
            </div>

            <p className="mt-6 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Choose your question count and timer · Results saved automatically
            </p>
          </div>

          {/* Transparent product showcase — no card, border or backdrop so the
              PNG's own transparency reads on both themes. */}
          <div className="flex justify-center lg:col-span-2 lg:row-start-2">
            <Image
              src="/hero-mockup.png"
              alt="QUIZIMI open on a mobile phone, showing the course search screen"
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 640px, 672px"
              className="h-auto w-full max-w-xl sm:max-w-2xl"
            />
          </div>

          {/* Rotating centrepiece */}
          <div className="flex justify-center lg:col-start-2 lg:row-start-1 lg:justify-end">
            <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-muted px-7 py-8 sm:px-9 sm:py-10">
              <p className="text-center text-[10.5px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                A calmer way to practise
              </p>

              <div className="flex justify-center py-10">
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

              <div className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-center text-sm font-bold leading-snug text-card-foreground">
                  One course. One timer. One clear score.
                </p>
                <p className="mt-1 text-center text-xs leading-relaxed text-muted-foreground">
                  Built around the subjects you actually study.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Course discovery ─────────────────────────────────────────────── */}
      <section
        ref={resultsRef}
        id="courses"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:py-16"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              {isFiltering ? "Search results" : "Course catalogue"}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {isFiltering && debounced
                ? `Courses matching “${debounced}”`
                : "Find the course you are preparing for"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isFiltering
                ? "Every result comes directly from the course catalogue."
                : "Pick a course to see its assessment details, price and available questions."}
            </p>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">{courseCountLabel}</p>
        </div>

        {subjects.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {["all", ...subjects].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSubject(option)}
                aria-pressed={subject === option}
                className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  subject === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {option === "all" ? "All subjects" : option}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-card p-8 text-center">
              <p className="text-sm font-semibold text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-lg"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="skeleton h-60 rounded-2xl" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isFiltering ? "No courses match that search" : "No courses published yet"}
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {isFiltering
                  ? "Try a different subject, or clear the search to see the full catalogue."
                  : "Courses will appear here as soon as they are added to the catalogue."}
              </p>
              {isFiltering && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5 rounded-lg"
                  onClick={() => {
                    setSearch("");
                    setDebounced("");
                    setSubject("all");
                  }}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Button asChild variant="outline" className="rounded-lg px-6">
                  <Link href="/courses">
                    Browse the full catalogue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-muted">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              How QUIZIMI works
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Three steps. One focused loop.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              No dashboards to configure first. Open a course, set the conditions for this attempt,
              and the rest is handled by the assessment itself.
            </p>
            <Button asChild className="mt-6 rounded-lg">
              <Link href="/courses">
                Open the catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <ol className="space-y-0">
            {STEPS.map((step) => (
              <li
                key={step.step}
                className="grid grid-cols-[3rem_1fr] gap-4 border-t border-border py-6 first:border-t-0 first:pt-0 last:pb-0 sm:grid-cols-[4rem_1fr] sm:gap-6"
              >
                <span className="text-2xl font-black leading-none text-primary/35 sm:text-3xl">
                  {step.step}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <step.icon className="h-4 w-4 text-primary" strokeWidth={2} />
                    <h3 className="text-base font-bold text-foreground">{step.title}</h3>
                  </div>
                  <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Exam-ready features ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Built for examinations
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            The details that matter on exam day
          </h2>
        </div>

        <div className="mt-9 grid gap-x-12 gap-y-8 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="border-t border-border pt-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <feature.icon className="h-4 w-4" strokeWidth={1.9} />
                </span>
                <h3 className="text-sm font-bold text-foreground">{feature.title}</h3>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Call to action ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-12 text-center sm:px-12">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 select-none text-[7rem] font-black uppercase leading-none tracking-tighter text-white/10 sm:text-[10rem]"
          >
            QUIZIMI
          </span>
          <div className="relative">
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-foreground sm:text-4xl">
              Pick a course and start practising
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-brand-foreground/80">
              Open a course, set your question count and timer, and take a computer-based
              assessment with a full result report at the end.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-7 h-12 rounded-xl border-0 bg-card px-8 text-sm font-bold text-foreground hover:bg-muted"
            >
              <Link href="/courses">
                Explore courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <QuizmiWordmark size={24} />
          <p className="text-xs text-muted-foreground">
            QUIZIMI · Course-based computer-based testing
          </p>
          <div className="flex items-center gap-5 text-xs font-semibold text-muted-foreground">
            <Link href="/courses" className="hover:text-foreground">
              Courses
            </Link>
            <Link href="/sign-in" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
