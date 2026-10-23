"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CourseSummary } from "@/lib/types";

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, hsl(250 60% 42%), hsl(268 58% 54%))",
  "linear-gradient(135deg, hsl(224 45% 26%), hsl(232 40% 45%))",
  "linear-gradient(135deg, hsl(28 70% 46%), hsl(36 80% 58%))",
  "linear-gradient(135deg, hsl(168 45% 28%), hsl(160 40% 44%))",
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
  const action = course.inProgressAttemptId
    ? "Resume"
    : unlocked
      ? "Practise"
      : course.isFree
        ? "Start free"
        : "Preview & unlock";

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[5px] bg-card shadow-sm ring-1 ring-border/60 transition-shadow duration-200 hover:shadow-md">
      <Link
        href={`/courses/${course.slug}`}
        className="block shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          ) : course.inProgressAttemptId ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold">
              <Clock className="h-3.5 w-3.5" />
              In progress
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

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
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
  );
}
