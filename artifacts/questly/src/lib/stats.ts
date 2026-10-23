import { desc, eq, sql } from "drizzle-orm";
import { db, attemptsTable, coursesTable, purchasesTable, type User } from "@/lib/db";
import { listPublishedCourses, listPurchasedCourses } from "@/lib/courses";
import { closeExpiredAttempts } from "@/lib/attempts";
import { isGradedStatus } from "@/lib/attempt-status";
import {
  assignAttemptNumbers,
  summarizeAnalytics,
  summarizeAnswers,
  summarizeDashboardStats,
  type SummaryAnswer,
} from "@/lib/attempt-summary";
import type { Analytics, AttemptStatus, DashboardData, HistoryItem } from "@/lib/types";

const MAX_ATTEMPTS_LOADED = 500;

type AttemptRow = {
  attemptId: number;
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  subject: string | null;
  difficulty: string;
  status: string;
  answers: unknown;
  questionIds: unknown;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string | null;
  timeTakenSeconds: number | null;
  terminationReason: string | null;
  chapterNumber: number | null;
};

/**
 * Loads every attempt the learner has, newest first.
 *
 * Timed-out drafts are closed first: expiry is otherwise lazy, so without the
 * sweep a history request could report an attempt as still running hours after
 * its timer ran out. One query feeds history, analytics and the dashboard, so
 * the three can never disagree about the same attempt.
 */
async function loadAttemptRows(userId: number): Promise<AttemptRow[]> {
  await closeExpiredAttempts(userId);

  return db
    .select({
      attemptId: attemptsTable.id,
      courseId: attemptsTable.courseId,
      courseSlug: coursesTable.slug,
      courseTitle: coursesTable.title,
      subject: coursesTable.subject,
      difficulty: coursesTable.difficulty,
      status: attemptsTable.status,
      answers: attemptsTable.answers,
      questionIds: attemptsTable.questionIds,
      score: attemptsTable.score,
      totalMarks: attemptsTable.totalMarks,
      percentage: attemptsTable.percentage,
      passed: attemptsTable.passed,
      startedAt: attemptsTable.startedAt,
      submittedAt: attemptsTable.submittedAt,
      expiresAt: attemptsTable.expiresAt,
      timeTakenSeconds: attemptsTable.timeTakenSeconds,
      terminationReason: attemptsTable.terminationReason,
      chapterNumber: attemptsTable.chapterNumber,
    })
    .from(attemptsTable)
    .innerJoin(coursesTable, eq(attemptsTable.courseId, coursesTable.id))
    .where(eq(attemptsTable.userId, userId))
    .orderBy(desc(attemptsTable.id))
    .limit(MAX_ATTEMPTS_LOADED);
}

function toHistoryItem(row: AttemptRow): HistoryItem {
  const graded = isGradedStatus(row.status);
  const summary = summarizeAnswers({
    status: row.status,
    answers: Array.isArray(row.answers) ? (row.answers as SummaryAnswer[]) : [],
    questionIds: Array.isArray(row.questionIds) ? (row.questionIds as number[]) : [],
  });

  return {
    attemptId: row.attemptId,
    attemptNumber: 0,
    courseId: row.courseId,
    courseSlug: row.courseSlug,
    courseTitle: row.courseTitle,
    subject: row.subject,
    difficulty: row.difficulty as HistoryItem["difficulty"],
    status: row.status as AttemptStatus,
    hasResult: graded,
    // Marks and percentages are only reported for scored attempts. An attempt
    // that was never submitted keeps counts, never a 0/0 result.
    score: graded ? row.score : 0,
    totalMarks: graded ? row.totalMarks : 0,
    percentage: graded ? row.percentage : 0,
    passed: graded ? Boolean(row.passed) : false,
    answeredCount: summary.answeredCount,
    correctCount: summary.correctCount,
    incorrectCount: summary.incorrectCount,
    unansweredCount: summary.unansweredCount,
    totalQuestions: summary.totalQuestions,
    startedAt: row.startedAt,
    submittedAt: row.submittedAt,
    expiresAt: row.expiresAt,
    timeTakenSeconds: graded ? row.timeTakenSeconds : null,
    terminationReason: row.terminationReason,
    chapterNumber: row.chapterNumber,
  };
}

/** History for one learner, numbered per course and ordered newest first. */
export async function loadAttemptHistory(userId: number): Promise<HistoryItem[]> {
  const rows = await loadAttemptRows(userId);
  return assignAttemptNumbers(rows.map(toHistoryItem));
}

export async function computeAnalytics(userId: number): Promise<Analytics> {
  const items = await loadAttemptHistory(userId);
  return summarizeAnalytics(items);
}

export async function buildDashboard(user: User): Promise<DashboardData> {
  const [items, purchasedCourses, purchasedCountRows, discover] = await Promise.all([
    loadAttemptHistory(user.id),
    listPurchasedCourses(user.id),
    db
      .select({ count: sql<number>`count(*)` })
      .from(purchasesTable)
      .where(eq(purchasesTable.userId, user.id)),
    listPublishedCourses({ limit: 12 }, user.id),
  ]);

  const stats = summarizeDashboardStats(items);
  const analytics = summarizeAnalytics(items);

  const ownedIds = new Set(purchasedCourses.map((course) => course.id));
  const recommended = discover.filter((course) => !ownedIds.has(course.id)).slice(0, 3);

  return {
    user: { name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    stats: {
      coursesTaken: stats.coursesTaken,
      completedAttempts: stats.completedAttempts,
      averagePercentage: stats.averagePercentage,
      passRate: stats.passRate,
      bestPercentage: stats.bestPercentage,
      purchasedCourses: Number(purchasedCountRows[0]?.count ?? 0),
      inProgressAttempts: stats.inProgressAttempts,
      notSubmittedAttempts: stats.notSubmittedAttempts,
    },
    purchasedCourses,
    subjectPerformance: analytics.bySubject.slice(0, 5),
    recentResults: items.slice(0, 5),
    recommended,
  };
}
