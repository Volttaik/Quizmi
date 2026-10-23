"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Dropdown, Label, SearchField } from "@heroui/react";
import { ArrowChevronDown, BookOpen, Check, Magnifier } from "@gravity-ui/icons";
import CourseCard from "@/components/CourseCard";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "@/lib/types";

const SORTS = [
  { value: "featured", label: "Recommended" },
  { value: "newest", label: "Newest first" },
  { value: "title", label: "A–Z" },
  { value: "price-low", label: "Lowest price" },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [subject, setSubject] = useState("all");
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        : null,
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
  }, [debounced, subject, sort, reloadKey]);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (subject !== "all") count += 1;
    if (sort !== "featured") count += 1;
    return count;
  }, [subject, sort]);

  const isFiltering = activeFilters > 0 || debounced.length > 0;
  const sortLabel = SORTS.find((option) => option.value === sort)?.label ?? "Recommended";

  const resetFilters = () => {
    setSubject("all");
    setSort("featured");
  };

  return (
    <div className="bg-background">
      <section className="hero-mesh relative overflow-hidden border-b border-border/60">
        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Explore</p>
              <h1 className="mt-3 text-display-lg text-foreground">
                Find your next course.
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Search by course name or code, filter by subject, and open the course that matches
                what you&apos;re preparing for.
              </p>
            </div>
            {!loading && !error && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {courses.length} {courses.length === 1 ? "course" : "courses"}
                {isFiltering ? " matching" : " published"}
              </p>
            )}
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <SearchField
                aria-label="Search courses"
                value={search}
                onChange={setSearch}
                className="w-full"
              >
                <SearchField.Group className="h-13 rounded-2xl border border-border bg-surface shadow-[0_10px_30px_-24px_rgba(35,25,80,0.45)] focus-within:border-accent/60">
                  <SearchField.SearchIcon className="ml-1.5 text-muted-foreground" />
                  <SearchField.Input
                    placeholder="Course name or code, e.g. GST 112"
                    className="text-[14.5px]"
                  />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
            </div>

            <Dropdown>
              <Button
                variant="outline"
                className="h-13 justify-between gap-3 rounded-2xl border-border bg-surface px-4 text-[13px] font-semibold"
              >
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">Sort</span>
                  {sortLabel}
                </span>
                <ArrowChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu
                  selectionMode="single"
                  selectedKeys={[sort]}
                  onAction={(key) => setSort(String(key))}
                >
                  {SORTS.map((option) => (
                    <Dropdown.Item key={option.value} id={option.value} textValue={option.label}>
                      <Label>{option.label}</Label>
                      {sort === option.value && <Check className="ml-auto h-4 w-4 text-accent" />}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>

          {subjects.length > 0 && (
            <div className="mt-5 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {["all", ...subjects].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSubject(option)}
                  aria-pressed={subject === option}
                  className={cn(
                    "flex-shrink-0 rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-all",
                    subject === option
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-surface/80 text-muted-foreground hover:border-accent/30 hover:text-foreground",
                  )}
                >
                  {option === "all" ? "All subjects" : option}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12 lg:px-8">
        {paymentNotice && (
          <Alert status="danger" className="mb-8">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Payment not confirmed</Alert.Title>
              <Alert.Description>{paymentNotice}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {isFiltering && (
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-xs font-medium text-muted-foreground">
              Showing results for
              {debounced ? ` “${debounced}”` : " the catalogue"}
              {subject !== "all" ? ` in ${subject}` : ""}.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-[12px] font-semibold"
              onPress={() => {
                setSearch("");
                resetFilters();
              }}
            >
              Clear all
            </Button>
          </div>
        )}

        {error ? (
          <div className="rounded-[2rem] border border-danger/25 bg-danger-soft px-6 py-14 text-center">
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
          <div className="rounded-[2rem] border border-border/80 bg-surface px-6 py-20 text-center">
            <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-soft-foreground">
              <Magnifier className="h-6 w-6" />
            </span>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {isFiltering ? "Nothing matches that search" : "No courses published yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {isFiltering
                ? "Try a different course name or code, or clear the filters to see the full catalogue."
                : "Courses will appear here as soon as they are added."}
            </p>
            {isFiltering && (
              <Button
                variant="outline"
                size="sm"
                className="mt-6 rounded-full"
                onPress={() => {
                  setSearch("");
                  resetFilters();
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {!loading && !error && courses.length > 0 && !isFiltering && (
          <div className="mt-14 flex flex-col items-center gap-3 border-t border-border/70 pt-10 text-center">
            <BookOpen className="h-5 w-5 text-accent" />
            <p className="max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
              Can&apos;t see the course you need? New courses are added to the catalogue regularly.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
