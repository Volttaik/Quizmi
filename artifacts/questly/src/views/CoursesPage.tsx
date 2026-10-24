"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, ChevronDown, Search, X } from "lucide-react";

import CourseCard from "@/components/CourseCard";
import { Reveal } from "@/components/Motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CourseSummary } from "@/lib/types";

const SORTS = [
  { value: "featured", label: "Recommended" },
  { value: "newest", label: "Newest first" },
  { value: "title", label: "A–Z" },
  { value: "price-low", label: "Lowest price" },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
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
    params.set("sort", sort);

    setLoading(true);
    setError(null);

    fetch(`/api/courses?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error ?? "Request failed");
        return payload as { courses: CourseSummary[] };
      })
      .then((data) => {
        setCourses(Array.isArray(data.courses) ? data.courses : []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Could not load courses");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced, sort, reloadKey]);

  const isFiltering = useMemo(
    () => sort !== "featured" || debounced.length > 0,
    [sort, debounced]
  );
  const sortLabel = SORTS.find((option) => option.value === sort)?.label ?? "Recommended";

  const resetFilters = () => {
    setSearch("");
    setSort("featured");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">Courses</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Search by course name or code, and open the course you are preparing for.
      </p>

      {paymentNotice && (
        <div className="mt-6 flex items-start gap-3 rounded-[5px] bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Payment not confirmed.</span> {paymentNotice}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Course name or code, e.g. GST 112"
            aria-label="Search courses"
            className="h-12 w-full rounded-full border border-input bg-card pl-11 pr-10 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-12 justify-between gap-3 px-4 text-[13px]">
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">Sort</span>
                {sortLabel}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORTS.map((option) => (
              <DropdownMenuItem key={option.value} onClick={() => setSort(option.value)}>
                {option.label}
                {sort === option.value && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isFiltering && !loading && (
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {courses.length} {courses.length === 1 ? "course" : "courses"} matching
          </p>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Clear all
          </Button>
        </div>
      )}

      {error ? (
        <div className="mt-8 rounded-[5px] border border-destructive/30 bg-destructive/10 px-6 py-14 text-center">
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
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-80" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Reveal className="mt-8 rounded-[5px] border-2 border-dashed border-border p-8 text-center sm:p-10">
          <h2 className="text-xl font-semibold">
            {isFiltering ? "Nothing matches that search" : "No courses published yet"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {isFiltering
              ? "Try a different course name or code, or clear the filters to see the full catalogue."
              : "Courses will appear here as soon as they are published."}
          </p>
          {isFiltering && (
            <Button variant="outline" className="mt-6" onClick={resetFilters}>
              Clear filters
            </Button>
          )}
        </Reveal>
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
