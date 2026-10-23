"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Search, SlidersHorizontal, X } from "lucide-react";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import type { CourseSummary } from "@/lib/types";

const DIFFICULTIES = [
  { value: "all", label: "All levels" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const SORTS = [
  { value: "featured", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "title", label: "A–Z" },
  { value: "price-low", label: "Lowest price" },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [subject, setSubject] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const readQueryParam = useRef(false);

  // Dashboard deep links land here with ?q= already set.
  useEffect(() => {
    if (readQueryParam.current) return;
    readQueryParam.current = true;
    const query = new URLSearchParams(window.location.search).get("q");
    if (query) setSearch(query);
  }, []);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("payment");
    if (!status) return;
    setPaymentNotice(
      status === "failed" || status === "missing"
        ? "A payment could not be confirmed. You have not been charged for course access. If you completed a payment, contact support with your reference."
        : null
    );
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({ limit: "100" });
    if (debounced) params.set("q", debounced);
    if (subject !== "all") params.set("subject", subject);
    if (difficulty !== "all") params.set("difficulty", difficulty);
    params.set("sort", sort);

    setLoading(true);
    setError(null);

    fetch(`/api/courses?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error ?? "Request failed");
        return payload as { courses: CourseSummary[]; subjects: string[] };
      })
      .then((data) => {
        setCourses(Array.isArray(data.courses) ? data.courses : []);
        setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load courses");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced, subject, difficulty, sort, reloadKey]);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (subject !== "all") count += 1;
    if (difficulty !== "all") count += 1;
    if (sort !== "featured") count += 1;
    return count;
  }, [subject, difficulty, sort]);

  const isFiltering = activeFilters > 0 || debounced.length > 0;

  const resetFilters = () => {
    setSubject("all");
    setDifficulty("all");
    setSort("featured");
  };

  return (
    <div className="bg-background">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {paymentNotice && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3.5 text-xs font-semibold text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {paymentNotice}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Courses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse the catalogue and choose a course to practise.
            </p>
          </div>
          {!loading && !error && (
            <p className="text-xs font-semibold text-muted-foreground">
              {courses.length} {courses.length === 1 ? "course" : "courses"}
              {isFiltering ? " match your filters" : " shown"}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses by title, subject or description"
              aria-label="Search courses"
              className="h-11 w-full rounded-xl border border-border/70 bg-card pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen((open) => !open)}
              className="h-11 gap-2 rounded-xl border-border px-4 font-semibold sm:hidden"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </Button>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort courses"
              className="hidden h-11 rounded-xl border border-border/70 bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 sm:block"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`${filtersOpen ? "block" : "hidden"} mt-3 space-y-3 sm:block`}>
          <div className="flex flex-wrap items-center gap-2">
            {DIFFICULTIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDifficulty(option.value)}
                aria-pressed={difficulty === option.value}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  difficulty === option.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}

            {subjects.length > 0 && <span className="mx-1 h-5 w-px bg-border" aria-hidden />}

            {["all", ...subjects].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSubject(option)}
                aria-pressed={subject === option}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  subject === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {option === "all" ? "All subjects" : option}
              </button>
            ))}

            {activeFilters > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="sm:hidden">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort courses"
              className="h-10 w-full rounded-xl border border-border/70 bg-card px-3 text-sm font-semibold text-foreground"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                {isFiltering ? "No courses match those filters" : "No courses published yet"}
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {isFiltering
                  ? "Try a different subject or clear your search to see the full catalogue."
                  : "Courses will appear here as soon as they are added to the catalogue."}
              </p>
              {isFiltering && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5 rounded-full"
                  onClick={() => {
                    setSearch("");
                    resetFilters();
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
