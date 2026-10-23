"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Clock,
  ListChecks,
  Search,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";

import AnswerSheetStage from "@/components/AnswerSheetStage";
import Logo from "@/components/Brand";
import CourseCard from "@/components/CourseCard";
import { Reveal, ease } from "@/components/Motion";
import { Button } from "@/components/ui/button";
import type { CourseSummary } from "@/lib/types";

const STEPS = [
  {
    title: "Choose a course",
    body: "Search by course title or code, then read exactly what the assessment covers.",
    icon: BookOpen,
  },
  {
    title: "Set the conditions",
    body: "Pick how many questions to answer, choose a timer, and decide when results appear.",
    icon: ListChecks,
  },
  {
    title: "Answer & learn",
    body: "Get feedback on every question and a short explanation where the course provides one.",
    icon: Target,
  },
  {
    title: "Track progress",
    body: "See your accuracy and previous attempts at a glance, and retake whenever you like.",
    icon: Clock,
  },
];

type HomePageProps = {
  initialCourses: CourseSummary[];
  initialSubjects: string[];
  initialError: string | null;
};

export default function HomePage({ initialCourses, initialSubjects, initialError }: HomePageProps) {
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
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 280);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // The server already provided the first page of courses. If it failed, the
    // client retries immediately so the page can recover without a reload.
    if (!skippedInitialFetch.current && reloadKey === 0 && debounced === "" && subject === "all") {
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
        if (!response.ok) throw new Error(payload?.error ?? "Course search failed");
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

  const totalQuestions = useMemo(
    () => courses.reduce((total, course) => total + (course.questionCount || 0), 0),
    [courses]
  );

  const scrollToCourses = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const courseCountLabel = useMemo(() => {
    if (loading) return "Searching…";
    const count = courses.length;
    return `${count} course${count === 1 ? "" : "s"}${debounced ? " found" : " published"}`;
  }, [courses.length, debounced, loading]);

  return (
    <div className="overflow-x-clip">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-stage relative overflow-hidden">
        <div aria-hidden className="hero-grid absolute inset-0" />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-28 top-6 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-14">
            <div className="min-w-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease }}
                className="flex items-center gap-3"
              >
                <span aria-hidden className="h-px w-8 bg-accent" />
                <span className="eyebrow">Course-based CBT practice</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.55, ease }}
                className="mt-4 text-display-xl text-foreground"
              >
                Sit the paper
                <span className="mt-1.5 block font-serif text-[0.58em] font-normal italic leading-tight text-muted-foreground">
                  before it counts.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.14, duration: 0.5, ease }}
                className="lede mt-5 max-w-[31rem]"
              >
                Real questions from your course, a clock you set, and a marked paper the moment you
                finish. QUIZMI is the practice hall between your notes and exam day.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease }}
                className="mt-7 flex flex-col gap-3 sm:flex-row"
              >
                <Button
                  className="h-12 px-6 text-[15px]"
                  onClick={() => {
                    searchRef.current?.focus();
                    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  Find your course
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button asChild variant="outline" className="h-12 px-6 text-[15px]">
                  <Link href="/courses">Browse the catalogue</Link>
                </Button>
              </motion.div>

              {/* The search sits on a hall-ticket slip rather than a floating bar. */}
              <motion.form
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.5, ease }}
                role="search"
                onSubmit={(event) => {
                  event.preventDefault();
                  setDebounced(search.trim());
                  scrollToCourses();
                }}
                className="exam-slip mt-8 max-w-[33rem]"
              >
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="course-search" className="eyebrow">
                    Course name or code
                  </label>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary-foreground">
                    Search
                  </span>
                </div>
                <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="course-search"
                      ref={searchRef}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      aria-label="Search courses by name or code"
                      placeholder="e.g. DECN 101 or Economics"
                      className="h-11 w-full rounded-[var(--radius)] border border-input bg-background/70 pl-10 pr-9 text-sm shadow-[inset_0_1px_2px_hsl(258_45%_12%/0.05)] outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:bg-background"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button type="submit" className="h-11 px-5">
                    Search
                  </Button>
                </div>
              </motion.form>

              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.32, duration: 0.5, ease }}
                className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
              >
                <li>
                  <span className="font-semibold text-foreground">{courses.length}</span>{" "}
                  {courses.length === 1 ? "course" : "courses"} published
                </li>
                <li>
                  <span className="font-semibold text-foreground">
                    {totalQuestions.toLocaleString()}
                  </span>{" "}
                  questions in the bank
                </li>
                <li className="hidden sm:list-item">Timed and marked on the server</li>
              </motion.ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6, ease }}
              className="relative lg:pl-4"
            >
              <AnswerSheetStage />
            </motion.div>
          </div>
        </div>
      </section>


      {/* ── Course catalogue ─────────────────────────────────────────────── */}
      <section
        ref={resultsRef}
        id="courses"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">
              {isFiltering && debounced
                ? `Courses matching “${debounced}”`
                : "Find the course you're preparing for"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Each course is built from real questions, with its own timer, question pool and pass
              mark.
            </p>
          </div>
          <p className="text-xs font-medium text-muted-foreground">{courseCountLabel}</p>
        </div>

        {subjects.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {["all", ...subjects].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSubject(option)}
                aria-pressed={subject === option}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  subject === option
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-secondary"
                }`}
              >
                {option === "all" ? "All subjects" : option}
              </button>
            ))}
          </div>
        )}

        <div className="mt-7">
          {error ? (
            <div className="rounded-[5px] border border-destructive/30 bg-destructive/10 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton h-80" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-[5px] border-2 border-dashed border-border p-8 text-center sm:p-10">
              <h3 className="text-xl font-semibold">
                {isFiltering ? "No courses match that search" : "No courses published yet"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {isFiltering
                  ? "Try a different course name or code, or clear the filters to see everything."
                  : "Courses will appear here as soon as they are added to the catalogue."}
              </p>
              {isFiltering && (
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => {
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
              <div className="grid gap-5 md:grid-cols-2">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button asChild variant="outline" className="h-11 px-6">
                  <Link href="/courses">
                    Browse the full catalogue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {!isSignedIn && (
                  <Button asChild className="h-11 px-6">
                    <Link href="/sign-up">Create a free account</Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6">
        <Reveal>
          <h2 className="text-xl font-semibold sm:text-2xl">How QUIZMI works</h2>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal
              key={step.title}
              delay={index * 0.08}
              className="rounded-[5px] border border-border bg-card p-5 shadow-sm"
            >
              <span className="text-xs font-bold text-muted-foreground">0{index + 1}</span>
              <step.icon className="mt-3 h-6 w-6 text-accent" />
              <h3 className="mt-3.5 text-base font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Exam-day details ─────────────────────────────────────────────── */}
      <section className="bg-card">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-xl font-semibold sm:text-2xl">Practice that feels rewarding</h2>
            <p className="mt-3.5 text-[15px] leading-relaxed text-muted-foreground">
              Every answer gets a clear verdict, a spoken cue and a short explanation where the
              course provides one. Build a streak and QUIZMI cheers you on.
            </p>
            <h3 className="mt-8 text-xl font-semibold">Know where you stand</h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
              After each session you get your score, accuracy, time taken and a question-by-question
              review. Your history tracks how you improve over time.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="space-y-4">
            {[
              {
                icon: Clock,
                title: "Timed like exam day",
                body: "Deadlines are enforced on the server, so the clock keeps running even if you refresh.",
              },
              {
                icon: ShieldCheck,
                title: "Honest scoring",
                body: "Correct answers stay hidden until submission. Your score is calculated by the server.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-[5px] border border-border bg-background p-5 shadow-sm"
              >
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Closing call to action ───────────────────────────────────────── */}
      <section className="px-4 py-12 sm:px-6">
        <Reveal className="mx-auto max-w-6xl overflow-hidden rounded-[5px] bg-primary px-6 py-11 text-center text-primary-foreground sm:px-12">
          <h2 className="text-xl font-semibold sm:text-3xl">Your first answer is waiting.</h2>
          <p className="mx-auto mt-3.5 max-w-lg text-[15px] leading-relaxed text-primary-foreground/70">
            Open a course, set your question count and timer, and take a computer-based assessment
            with a full result report at the end.
          </p>
          <Button asChild className="mt-7 h-11 bg-accent px-6 text-accent-foreground hover:bg-accent/90">
            <Link href={isSignedIn ? "/courses" : "/sign-up"}>
              {isSignedIn ? "Explore courses" : "Create your account"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </section>

      <footer className="border-t border-border/60 bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted-foreground">
              Course-based computer-based testing
            </p>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/courses" className="hover:text-foreground">
              Courses
            </Link>
            <Link href="/demo" className="hover:text-foreground">
              Free demo
            </Link>
            <Link href="/sign-in" className="hover:text-foreground">
              Sign in
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} QUIZMI.
          </p>
        </div>
      </footer>
    </div>
  );
}
