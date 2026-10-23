"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import ShareCourseButton from "@/components/ShareCourseButton";
import type { CourseSummary } from "@/lib/types";

/** Coverless courses fall back to Quizmi's violet range, never another brand's. */
const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, #4c1d95, #7c3aed)",
  "linear-gradient(135deg, #312e81, #6366f1)",
  "linear-gradient(135deg, #581c87, #a855f7)",
  "linear-gradient(135deg, #2e1065, #6d28d9)",
];

function fallbackFor(course: CourseSummary) {
  const seed = course.slug.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return FALLBACK_GRADIENTS[seed % FALLBACK_GRADIENTS.length];
}

/**
 * A course is one surface: a full-bleed banner across the top of the card, with
 * the information directly underneath. Payment detail lives on the course page,
 * one step before checkout — not on the card.
 */
export default function CourseCard({ course }: { course: CourseSummary }) {
  const [coverOk, setCoverOk] = useState(true);
  const unlocked = course.hasAccess;
  const action = unlocked ? "Practise" : course.isFree ? "Start free" : "Preview & unlock";

  return (
    <div className="group dotted-edge flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-border/70 bg-card shadow-[var(--shadow-sm)] transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-[var(--shadow-md)]">
      <div className="relative shrink-0 overflow-hidden">
        <Link
          href={`/courses/${course.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${course.title}${course.code ? ` (${course.code})` : ""}`}
        >
          {course.coverImageUrl && coverOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.coverImageUrl}
              alt={`${course.title} banner`}
              loading="lazy"
              onError={() => setCoverOk(false)}
              className="block aspect-[16/9] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div
              aria-hidden
              className="flex aspect-[16/9] w-full items-center justify-center"
              style={{ backgroundImage: fallbackFor(course) }}
            >
              <BookOpen className="h-10 w-10 text-white/70" />
            </div>
          )}
        </Link>

        <ShareCourseButton
          slug={course.slug}
          title={course.title}
          className="absolute right-3 top-3 z-10"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {course.code && (
              <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-secondary-foreground">
                {course.code}
              </span>
            )}
            <h3 className="mt-2 text-lg font-semibold leading-snug">{course.title}</h3>
            {course.subject && !course.code && (
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{course.subject}</p>
            )}
          </div>
          {unlocked ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {course.isFree ? "Free" : "Unlocked"}
            </span>
          ) : null}
        </div>

        {course.description && (
          <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap gap-2">
          {course.subject && course.code && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {course.subject}
            </span>
          )}
          {course.bestPercentage !== null && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              Best {course.bestPercentage}%
            </span>
          )}
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-4">
            <span className="text-xs text-muted-foreground">
              {course.questionCount.toLocaleString()} question{course.questionCount === 1 ? "" : "s"}
              {course.durationMinutes ? ` · ${course.durationMinutes} min` : " · your timer"}
            </span>
            <Button asChild>
              <Link href={`/courses/${course.slug}`}>
                {action}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
