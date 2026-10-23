"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Keyboard,
  ListChecks,
  Search,
  ShieldCheck,
  Timer,
  X,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import CourseCard from "@/components/CourseCard";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import { Button } from "@/components/ui/button";
import type { CourseSummary } from "@/lib/types";

const STEPS = [
  {
    step: "01",
    title: "Choose a course",
    body: "Browse the course catalogue, read what each course covers, and pick the one you want to prepare for.",
    icon: BookOpen,
  },
  {
    step: "02",
    title: "Set up your attempt",
    body: "Choose how many questions you want to answer and select a timer from 10 to 60 minutes — or take it untimed.",
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
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[460px] w-[860px] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_18%,hsl(var(--background))_76%)]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:pt-24">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <BookOpen className="h-3.5 w-3.5" />
            Course-based CBT practice
          </span>

          <h1 className="animate-fade-up mt-6 text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-[hsl(262,72%,56%)] via-[hsl(285,70%,58%)] to-[hsl(232,80%,58%)] bg-clip-text text-transparent">
              Quizme
            </span>
          </h1>

          <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Find your courses, practise with CBT questions, and track your progress.
          </p>

          <form
            className="animate-fade-up mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
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
                className="h-12 w-full rounded-full border border-border/80 bg-card pl-11 pr-11 text-sm font-medium text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-full px-7 text-sm font-bold">
              Search courses
            </Button>
          </form>

          <div className="animate-fade-up mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
              <Button variant="outline" className="h-11 rounded-full border-border px-6 text-sm font-semibold">
                {isSignedIn ? "Go to dashboard" : "Create an account"}
              </Button>
            </Link>
            <p className="text-xs font-medium text-muted-foreground">
              Choose your question count and timer · Results saved automatically
            </p>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section ref={resultsRef} id="courses" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {isFiltering ? "Search results" : "Course catalogue"}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {isFiltering && debounced ? `Courses matching “${debounced}”` : "Available courses"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
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
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  subject === option
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {option === "all" ? "All subjects" : option}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="text-sm font-semibold text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full"
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
            <div className="rounded-2xl border border-border/70 bg-card p-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
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
                  className="mt-5 rounded-full"
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
                <Link href="/courses">
                  <Button variant="outline" className="rounded-full px-6">
                    Browse the full catalogue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">How Quizme works</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Three steps from study to score
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.step} className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" strokeWidth={1.9} />
                  </div>
                  <span className="text-2xl font-black text-primary/20">{step.step}</span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-card-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Built for examinations</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            A focused workspace for CBT practice
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" strokeWidth={1.9} />
              </div>
              <h3 className="text-sm font-bold text-card-foreground">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(262,72%,52%)] via-[hsl(272,68%,48%)] to-[hsl(240,70%,46%)] px-6 py-12 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Pick a course and start practising
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/75">
            Open a course, set your question count and timer, and take a computer-based assessment
            with a full result report at the end.
          </p>
          <Link href="/courses" className="relative mt-7 inline-block">
            <Button
              size="lg"
              className="h-12 rounded-full bg-white px-8 text-sm font-bold text-[hsl(262,72%,42%)] hover:bg-white/90"
            >
              Explore courses
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <QuizmiWordmark size={26} />
          <p className="text-xs text-muted-foreground">
            Quizme · Course-based computer-based testing
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
