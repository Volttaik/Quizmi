import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, attemptsTable, coursesTable, purchasesTable } from "@/lib/db";
import { listPublishedCourses, listPurchasedCourses } from "@/lib/courses";
import { secondsRemaining } from "@/lib/scoring";
import type { Analytics, DashboardData, HistoryItem } from "@/lib/types";
import type { User } from "@/lib/db";

const COMPLETED_STATUSES = ["submitted", "expired", "terminated"] as const;

type CompletedRow = {
  attemptId: number;
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  subject: string | null;
  difficulty: string;
  status: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
  terminationReason: string | null;
};

export async function loadCompletedAttempts(
  userId: number,
  limit = 500
): Promise<CompletedRow[]> {
  const rows = await db
    .select({
      attemptId: attemptsTable.id,
      courseId: attemptsTable.courseId,
      courseSlug: coursesTable.slug,
      courseTitle: coursesTable.title,
      subject: coursesTable.subject,
      difficulty: coursesTable.difficulty,
      status: attemptsTable.status,
      score: attemptsTable.score,
      totalMarks: attemptsTable.totalMarks,
      percentage: attemptsTable.percentage,
      passed: attemptsTable.passed,
      submittedAt: attemptsTable.submittedAt,
      timeTakenSeconds: attemptsTable.timeTakenSeconds,
      terminationReason: attemptsTable.terminationReason,
    })
    .from(attemptsTable)
    .innerJoin(coursesTable, eq(attemptsTable.courseId, coursesTable.id))
    .where(
      and(
        eq(attemptsTable.userId, userId),
        inArray(attemptsTable.status, [...COMPLETED_STATUSES])
      )
    )
    .orderBy(desc(attemptsTable.submittedAt), desc(attemptsTable.id))
    .limit(limit);

  return rows.map((row) => ({ ...row, passed: Boolean(row.passed) }));
}

function round(value: number): number {
  return Math.round(value);
}

export async function computeAnalytics(userId: number): Promise<Analytics> {
  const rows = await loadCompletedAttempts(userId);

  const totalAttempts = rows.length;
  const averagePercentage =
    totalAttempts === 0
      ? 0
      : round(rows.reduce((total, row) => total + row.percentage, 0) / totalAttempts);
  const passed = rows.filter((row) => row.passed).length;
  const bestPercentage = totalAttempts === 0 ? 0 : Math.max(...rows.map((row) => row.percentage));
  const totalMinutes = round(
    rows.reduce((total, row) => total + (row.timeTakenSeconds ?? 0), 0) / 60
  );

  const trend = rows
    .slice(0, 20)
    .reverse()
    .map((row) => ({
      date: row.submittedAt ?? "",
      percentage: row.percentage,
    }));

  const bySubjectMap = new Map<string, { attempts: number; total: number }>();
  for (const row of rows) {
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
    .sort((a, b) => b.attempts - a.attempts);

  return {
    totalAttempts,
    completedAttempts: totalAttempts,
    averagePercentage,
    passRate: totalAttempts === 0 ? 0 : round((passed / totalAttempts) * 100),
    bestPercentage,
    totalMinutes,
    trend,
    bySubject,
  };
}

function toHistoryItem(row: CompletedRow): HistoryItem {
  return {
    attemptId: row.attemptId,
    courseId: row.courseId,
    courseSlug: row.courseSlug,
    courseTitle: row.courseTitle,
    subject: row.subject,
    difficulty: row.difficulty as HistoryItem["difficulty"],
    status: row.status as HistoryItem["status"],
    score: row.score,
    totalMarks: row.totalMarks,
    percentage: row.percentage,
    passed: row.passed,
    submittedAt: row.submittedAt,
    timeTakenSeconds: row.timeTakenSeconds,
    terminationReason: row.terminationReason,
  };
}

export async function buildDashboard(user: User): Promise<DashboardData> {
  const [completed, purchasedCourses, aggregateRows, purchasedCountRows, discover] =
    await Promise.all([
      loadCompletedAttempts(user.id, 100),
      listPurchasedCourses(user.id),
      db
        .select({
          attempts: sql<number>`count(*)`,
          average: sql<number>`coalesce(avg(${attemptsTable.percentage}), 0)`,
          passed: sql<number>`coalesce(sum(${attemptsTable.passed}), 0)`,
          best: sql<number>`coalesce(max(${attemptsTable.percentage}), 0)`,
          courses: sql<number>`count(distinct ${attemptsTable.courseId})`,
        })
        .from(attemptsTable)
        .where(
          and(
            eq(attemptsTable.userId, user.id),
            inArray(attemptsTable.status, [...COMPLETED_STATUSES])
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(purchasesTable)
        .where(eq(purchasesTable.userId, user.id)),
      listPublishedCourses({ limit: 12 }, user.id),
    ]);

  const aggregate = aggregateRows[0];
  const total = Number(aggregate?.attempts ?? 0);

  const ownedIds = new Set(purchasedCourses.map((course) => course.id));
  const recommended = discover.filter((course) => !ownedIds.has(course.id)).slice(0, 3);

  const subjectMap = new Map<string, { attempts: number; total: number }>();
  for (const row of completed) {
    const key = row.subject?.trim() || "General";
    const current = subjectMap.get(key) ?? { attempts: 0, total: 0 };
    current.attempts += 1;
    current.total += row.percentage;
    subjectMap.set(key, current);
  }
  const subjectPerformance = Array.from(subjectMap.entries())
    .map(([subject, value]) => ({
      subject,
      attempts: value.attempts,
      averagePercentage: round(value.total / value.attempts),
    }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 5);

  return {
    user: { name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    stats: {
      coursesTaken: Number(aggregate?.courses ?? 0),
      completedAttempts: total,
      averagePercentage: total === 0 ? 0 : round(Number(aggregate?.average ?? 0)),
      passRate: total === 0 ? 0 : round((Number(aggregate?.passed ?? 0) / total) * 100),
      bestPercentage: total === 0 ? 0 : round(Number(aggregate?.best ?? 0)),
      purchasedCourses: Number(purchasedCountRows[0]?.count ?? 0),
    },
    purchasedCourses,
    subjectPerformance,
    recentResults: completed.slice(0, 5).map(toHistoryItem),
    recommended,
  };
}
