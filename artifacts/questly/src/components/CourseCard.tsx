"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Chip } from "@heroui/react";
import {
  ArrowRight,
  BookOpen,
  CircleCheck,
  Clock,
  ListCheck,
  PlayFill,
  Sparkles,
} from "@gravity-ui/icons";
import { formatPrice } from "@/lib/format";
import type { CourseSummary } from "@/lib/types";

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg, oklch(0.45 0.18 285), oklch(0.6 0.19 320))",
  "linear-gradient(135deg, oklch(0.38 0.12 250), oklch(0.58 0.16 200))",
  "linear-gradient(135deg, oklch(0.47 0.15 30), oklch(0.66 0.16 60))",
  "linear-gradient(135deg, oklch(0.4 0.14 170), oklch(0.6 0.14 140))",
];

function fallbackFor(course: CourseSummary) {
  const seed = course.slug.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return FALLBACK_GRADIENTS[seed % FALLBACK_GRADIENTS.length];
}

export default function CourseCard({ course }: { course: CourseSummary }) {
  const [coverOk, setCoverOk] = useState(true);
  const locked = !course.hasAccess;
  const action = course.inProgressAttemptId
    ? "Resume"
    : locked
      ? "View course"
      : course.attemptsUsed > 0
        ? "Practise again"
        : "View course";

  return (
    <Card className="group relative flex h-full flex-col gap-0 overflow-hidden rounded-[1.75rem] border border-border/70 bg-surface p-0 shadow-[0_1px_2px_rgba(24,20,45,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-[0_22px_50px_-24px_rgba(35,25,80,0.45)]">
      <Link
        href={`/courses/${course.slug}`}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
        aria-label={`${course.title}${course.code ? ` (${course.code})` : ""}`}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          {course.coverImageUrl && coverOk ? (
            // Course artwork may be hosted on any origin; a failed load drops
            // the banner instead of showing a broken-image glyph.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.coverImageUrl}
              alt=""
              loading="lazy"
              onError={() => setCoverOk(false)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundImage: fallbackFor(course) }}
            >
              <BookOpen className="h-10 w-10 text-white/70" />
            </div>
          )}

          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/0"
          />

          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
            {course.code ? (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#241f33] shadow-sm backdrop-blur">
                {course.code}
              </span>
            ) : (
              <span />
            )}
            {course.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[10.5px] font-semibold text-white backdrop-blur">
                <Sparkles className="h-3 w-3" />
                Featured
              </span>
            )}
          </div>

          <div className="absolute inset-x-4 bottom-3.5 flex items-center gap-3 text-[11px] font-semibold text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <ListCheck className="h-3.5 w-3.5" />
              {course.questionCount.toLocaleString()} question
              {course.questionCount === 1 ? "" : "s"}
            </span>
            <span className="h-1 w-1 rounded-full bg-white/50" />
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {course.inProgressAttemptId
                ? "In progress"
                : course.durationMinutes
                  ? `${course.durationMinutes} min`
                  : "Your timer"}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {course.subject && (
              <Chip size="sm" variant="soft" color="accent">
                {course.subject}
              </Chip>
            )}
            {course.bestPercentage !== null && (
              <Chip size="sm" variant="soft" color="success">
                Best {course.bestPercentage}%
              </Chip>
            )}
            {course.isPurchased && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                <CircleCheck className="h-3.5 w-3.5" /> Owned
              </span>
            )}
          </div>

          <h3 className="mt-2.5 font-display text-[1.2rem] font-semibold leading-[1.25] tracking-[-0.02em] text-foreground transition-colors group-hover:text-accent">
            {course.title}
          </h3>

          {course.description && (
            <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          )}

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div>
              <p className="font-display text-[15px] font-semibold text-foreground">
                {course.isFree ? "Free" : formatPrice(course.priceKobo, course.currency)}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                {course.isPurchased
                  ? "Unlocked for life"
                  : course.isFree
                    ? "Open to every learner"
                    : "One-time purchase"}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-accent">
              {course.inProgressAttemptId ? (
                <PlayFill className="h-3.5 w-3.5" />
              ) : null}
              <span className="hidden sm:inline">{action}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground transition-all duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
