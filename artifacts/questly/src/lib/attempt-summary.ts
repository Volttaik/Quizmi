/**
 * Pure calculations for attempts, history and analytics.
 *
 * Nothing here touches the database or React. The same functions build the
 * history list, the results-page counts, the dashboard and `/api/analytics`,
 * which is what keeps those surfaces agreeing with each other.
 */

import { isGradedStatus } from "@/lib/attempt-status";
import type { Analytics, HistoryItem } from "@/lib/types";

/** The answer shape stored on an attempt (drafts and final sheets alike). */
export type SummaryAnswer = {
  questionId: number;
  selectedIndex: number | null;
  correct?: boolean;
  marksAwarded?: number;
};

export type AttemptAnswerSummary = {
  totalQuestions: number;
  /** Questions with a recorded selection. */
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  /** Only graded attempts have a score; open/abandoned attempts never do. */
  hasResult: boolean;
};

export function isAnswered(answer: SummaryAnswer | null | undefined): boolean {
  return Boolean(answer) && answer!.selectedIndex !== null && answer!.selectedIndex !== undefined;
}

/**
 * Counts an attempt's answer sheet.
 *
 * The stored answer array is padded to every question of the attempt, so it
 * cannot be trusted for "answered" counts — only a non-null selection counts.
 * Correct/incorrect are reported only for graded attempts: an open attempt has
 * no result yet, and an abandoned one was never graded.
 */
export function summarizeAnswers(input: {
  status: string;
  answers?: SummaryAnswer[] | null;
  questionIds?: number[] | null;
}): AttemptAnswerSummary {
  const answers = Array.isArray(input.answers) ? input.answers : [];
  const answered = answers.filter((answer) => isAnswered(answer));
  const answeredCount = answered.length;
  const graded = isGradedStatus(input.status);
  const correctCount = graded
    ? answered.filter((answer) => Boolean(answer.correct)).length
    : 0;
  const totalQuestions = Array.isArray(input.questionIds)
    ? input.questionIds.length
    : answers.length;

  return {
    totalQuestions,
    answeredCount,
    correctCount,
    incorrectCount: graded ? Math.max(0, answeredCount - correctCount) : 0,
    // "Unanswered" is a result concept: it means the paper was graded with
    // questions left blank. An attempt that was never submitted has no
    // unanswered questions, just missing answers.
    unansweredCount: graded ? Math.max(0, totalQuestions - answeredCount) : 0,
    hasResult: graded,
  };
}

/**
 * Numbers each course's attempts 1..n in chronological order. Ids are
 * monotonic, so the id order is the attempt order.
 */
export function assignAttemptNumbers<T extends { attemptId: number; courseId: number }>(
  items: T[]
): Array<T & { attemptNumber: number }> {
  const chronological = [...items].sort((a, b) => a.attemptId - b.attemptId);
  const counters = new Map<number, number>();
  const numbers = new Map<number, number>();

  for (const item of chronological) {
    const next = (counters.get(item.courseId) ?? 0) + 1;
    counters.set(item.courseId, next);
    numbers.set(item.attemptId, next);
  }

  return items.map((item) => ({ ...item, attemptNumber: numbers.get(item.attemptId) ?? 1 }));
}

export type HistoryCourseGroup = {
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  subject: string | null;
  difficulty: string | null;
  /** Chronological: attempt 1 first, newest attempt last. */
  attempts: HistoryItem[];
  gradedAttempts: number;
  unfinishedAttempts: number;
  bestPercentage: number | null;
  lastActivityAt: string;
};

/**
 * Groups attempts by course. Groups are ordered by most recent activity; the
 * attempts inside each group stay in chronological order with their attempt
 * numbers intact.
 */
export function groupAttemptsByCourse(items: HistoryItem[]): HistoryCourseGroup[] {
  const groups = new Map<number, HistoryCourseGroup>();

  for (const item of items) {
    const existing = groups.get(item.courseId);
    if (existing) {
      existing.attempts.push(item);
      continue;
    }
    groups.set(item.courseId, {
      courseId: item.courseId,
      courseSlug: item.courseSlug,
      courseTitle: item.courseTitle,
      subject: item.subject,
      difficulty: item.difficulty,
      attempts: [item],
      gradedAttempts: 0,
      unfinishedAttempts: 0,
      bestPercentage: null,
      lastActivityAt: item.submittedAt ?? item.startedAt,
    });
  }

  for (const group of groups.values()) {
    group.attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
    for (const attempt of group.attempts) {
      if (attempt.hasResult) {
        group.gradedAttempts += 1;
        group.bestPercentage =
          group.bestPercentage === null
            ? attempt.percentage
            : Math.max(group.bestPercentage, attempt.percentage);
      } else {
        group.unfinishedAttempts += 1;
      }
      const activity = attempt.submittedAt ?? attempt.startedAt;
      if (activity > group.lastActivityAt) group.lastActivityAt = activity;
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    b.lastActivityAt.localeCompare(a.lastActivityAt)
  );
}

export type AnalyticsSource = {
  courseId: number;
  status: string;
  subject: string | null;
  passed: boolean;
  percentage: number;
  timeTakenSeconds: number | null;
  startedAt: string;
  submittedAt: string | null;
};

function round(value: number): number {
  return Math.round(value);
}

/**
 * Builds the analytics view from stored attempts.
 *
 * Graded attempts are the only ones that contribute a score, a pass rate, a
 * best percentage or a trend point. Attempts started but not submitted are
 * reported separately so the UI can show real activity without pretending a
 * 0% score was earned.
 */
export function summarizeAnalytics(rows: AnalyticsSource[]): Analytics {
  const graded = rows.filter((row) => isGradedStatus(row.status));
  const completedAttempts = graded.length;
  const totalAttempts = rows.length;

  const averagePercentage =
    completedAttempts === 0
      ? 0
      : round(graded.reduce((total, row) => total + row.percentage, 0) / completedAttempts);
  const passed = graded.filter((row) => row.passed).length;
  const bestPercentage =
    completedAttempts === 0 ? 0 : Math.max(...graded.map((row) => row.percentage));
  const totalMinutes = round(
    graded.reduce((total, row) => total + (row.timeTakenSeconds ?? 0), 0) / 60
  );

  const trend = [...graded]
    .sort((a, b) =>
      (a.submittedAt ?? a.startedAt).localeCompare(b.submittedAt ?? b.startedAt)
    )
    .slice(-20)
    .map((row) => ({ date: row.submittedAt ?? row.startedAt, percentage: row.percentage }));

  const bySubjectMap = new Map<string, { attempts: number; total: number }>();
  for (const row of graded) {
    const key = row.subject?.trim() || "General";
    const current = bySubjectMap.get(key) ?? { attempts: 0, total: 0 };
    current.attempts += 1;
    current.total += row.percentage;
    bySubjectMap.set(key, current);
  }

  const bySubject = Array.from(bySubjectMap.entries())
    .map(([subject, value]) => ({
      subject,
      attempts: value.attempts,
      averagePercentage: round(value.total / value.attempts),
    }))
    .sort((a, b) => b.attempts - a.attempts || a.subject.localeCompare(b.subject));

  return {
    totalAttempts,
    completedAttempts,
    inProgressAttempts: rows.filter((row) => row.status === "in_progress").length,
    notSubmittedAttempts: rows.filter((row) => row.status === "not_submitted").length,
    averagePercentage,
    passRate: completedAttempts === 0 ? 0 : round((passed / completedAttempts) * 100),
    bestPercentage,
    totalMinutes,
    trend,
    bySubject,
  };
}

export type DashboardStatsSource = {
  courseId: number;
  status: string;
  passed: boolean;
  percentage: number;
};

/** Dashboard tiles, computed from the same rows as the analytics view. */
export function summarizeDashboardStats(rows: DashboardStatsSource[]): {
  coursesTaken: number;
  completedAttempts: number;
  averagePercentage: number;
  passRate: number;
  bestPercentage: number;
  inProgressAttempts: number;
  notSubmittedAttempts: number;
} {
  const graded = rows.filter((row) => isGradedStatus(row.status));
  const total = graded.length;
  const coursesTaken = new Set(graded.map((row) => row.courseId)).size;
  const passed = graded.filter((row) => row.passed).length;

  return {
    coursesTaken,
    completedAttempts: total,
    averagePercentage:
      total === 0 ? 0 : round(graded.reduce((sum, row) => sum + row.percentage, 0) / total),
    passRate: total === 0 ? 0 : round((passed / total) * 100),
    bestPercentage: total === 0 ? 0 : Math.max(...graded.map((row) => row.percentage)),
    inProgressAttempts: rows.filter((row) => row.status === "in_progress").length,
    notSubmittedAttempts: rows.filter((row) => row.status === "not_submitted").length,
  };
}

/** Status filter used by the history screen. */
export type HistoryFilter = "all" | "passed" | "failed" | "unfinished";

export function matchesHistoryFilter(item: HistoryItem, filter: HistoryFilter): boolean {
  if (filter === "all") return true;
  if (filter === "unfinished") return !item.hasResult;
  if (!item.hasResult) return false;
  return filter === "passed" ? item.passed : !item.passed;
}
