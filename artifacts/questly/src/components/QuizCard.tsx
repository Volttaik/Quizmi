import Link from "next/link";
import { ArrowRight, Clock, HelpCircle, Lock, Trophy } from "lucide-react";
import { difficultyStyle, formatDuration } from "@/lib/format";
import type { QuizSummary } from "@/lib/types";

export default function QuizCard({ quiz }: { quiz: QuizSummary }) {
  const difficulty = difficultyStyle(quiz.difficulty);

  return (
    <Link
      href={`/quizzes/${quiz.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${difficulty.className}`}
        >
          {difficulty.label}
        </span>
        {quiz.subject && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {quiz.subject}
          </span>
        )}
        {quiz.isRestricted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <Lock className="h-3 w-3" /> Code
          </span>
        )}
      </div>

      <h3 className="text-base font-bold leading-snug text-card-foreground group-hover:text-primary">
        {quiz.title}
      </h3>
      {quiz.description && (
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {quiz.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5" />
          {quiz.questionCount.toLocaleString()} questions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {formatDuration(quiz.durationMinutes)}
        </span>
        {quiz.bestPercentage !== null && (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Trophy className="h-3.5 w-3.5" />
            Best {quiz.bestPercentage}%
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <span className="text-xs font-semibold text-muted-foreground">
          {quiz.maxAttempts
            ? `${quiz.attemptsRemaining ?? 0} of ${quiz.maxAttempts} attempts left`
            : "Unlimited attempts"}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
          {quiz.attemptsUsed > 0 ? "Try again" : "Start"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
