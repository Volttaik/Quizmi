import Link from "next/link";
import { ArrowRight, Check, Clock, HelpCircle, PlayCircle, Sparkles } from "lucide-react";
import { difficultyStyle, formatPrice } from "@/lib/format";
import type { CourseSummary } from "@/lib/types";

export default function CourseCard({ course }: { course: CourseSummary }) {
  const difficulty = difficultyStyle(course.difficulty);
  const locked = !course.hasAccess;
  const action = course.inProgressAttemptId
    ? "Resume"
    : locked
      ? "View course"
      : course.attemptsUsed > 0
        ? "Practise again"
        : "View course";

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${difficulty.className}`}
        >
          {difficulty.label}
        </span>
        {course.subject && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {course.subject}
          </span>
        )}
        {course.isFeatured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}
      </div>

      <h3 className="text-base font-bold leading-snug text-card-foreground group-hover:text-primary">
        {course.title}
      </h3>
      {course.description && (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {course.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" />
          {course.questionCount.toLocaleString()} question{course.questionCount === 1 ? "" : "s"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {course.durationMinutes ? `${course.durationMinutes} min default` : "Choose your timer"}
        </span>
        {course.bestPercentage !== null && (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            Best {course.bestPercentage}%
          </span>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div>
          <p className="text-sm font-extrabold text-card-foreground">
            {course.isFree ? "Free" : formatPrice(course.priceKobo, course.currency)}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            {course.isPurchased ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" /> Purchased
              </span>
            ) : course.isFree ? (
              "Open to all learners"
            ) : (
              "One-time purchase"
            )}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
          {course.inProgressAttemptId ? <PlayCircle className="h-4 w-4" /> : null}
          {action}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
