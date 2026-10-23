import { and, desc, eq, inArray } from "drizzle-orm";
import { db, attemptsTable, quizzesTable } from "@/lib/db";
import { attemptsRemaining, secondsRemaining } from "@/lib/scoring";
import type { Analytics, DashboardData, HistoryItem } from "@/lib/types";
import type { User } from "@/lib/db";

type CompletedRow = {
  attemptId: number;
  quizId: number;
  quizSlug: string;
  quizTitle: string;
  subject: string | null;
  difficulty: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string | null;
  timeTakenSeconds: number | null;
};

export async function loadCompletedAttempts(
  userId: string,
  limit = 500
): Promise<CompletedRow[]> {
  const rows = await db
    .select({
      attemptId: attemptsTable.id,
      quizId: attemptsTable.quizId,
      quizSlug: quizzesTable.slug,
      quizTitle: quizzesTable.title,
      subject: quizzesTable.subject,
      difficulty: quizzesTable.difficulty,
      score: attemptsTable.score,
      totalMarks: attemptsTable.totalMarks,
      percentage: attemptsTable.percentage,
      passed: attemptsTable.passed,
      submittedAt: attemptsTable.submittedAt,
      timeTakenSeconds: attemptsTable.timeTakenSeconds,
    })
    .from(attemptsTable)
    .innerJoin(quizzesTable, eq(attemptsTable.quizId, quizzesTable.id))
    .where(
      and(
        eq(attemptsTable.userId, userId),
        inArray(attemptsTable.status, ["submitted", "expired"])
      )
    )
    .orderBy(desc(attemptsTable.submittedAt))
    .limit(limit);

  return rows.map((row) => ({ ...row, passed: Boolean(row.passed) }));
}

function round(value: number): number {
  return Math.round(value);
}

export async function computeAnalytics(userId: string): Promise<Analytics> {
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
    quizId: row.quizId,
    quizSlug: row.quizSlug,
    quizTitle: row.quizTitle,
    subject: row.subject,
    difficulty: row.difficulty as HistoryItem["difficulty"],
    status: "submitted",
    score: row.score,
    totalMarks: row.totalMarks,
    percentage: row.percentage,
    passed: row.passed,
    submittedAt: row.submittedAt,
    timeTakenSeconds: row.timeTakenSeconds,
  };
}

export async function buildDashboard(user: User): Promise<DashboardData> {
  const [completed, openAttempts] = await Promise.all([
    loadCompletedAttempts(user.clerkId, 100),
    db
      .select({
        attemptId: attemptsTable.id,
        quizSlug: quizzesTable.slug,
        quizTitle: quizzesTable.title,
        expiresAt: attemptsTable.expiresAt,
        answers: attemptsTable.answers,
        questionCount: quizzesTable.questionCount,
      })
      .from(attemptsTable)
      .innerJoin(quizzesTable, eq(attemptsTable.quizId, quizzesTable.id))
      .where(
        and(
          eq(attemptsTable.userId, user.clerkId),
          eq(attemptsTable.status, "in_progress")
        )
      )
      .orderBy(desc(attemptsTable.id))
      .limit(5),
  ]);

  const total = completed.length;
  const passed = completed.filter((row) => row.passed).length;

  const inProgress = openAttempts
    .filter((attempt) => (secondsRemaining(attempt.expiresAt) ?? 1) > 0)
    .map((attempt) => ({
      attemptId: attempt.attemptId,
      quizSlug: attempt.quizSlug,
      quizTitle: attempt.quizTitle,
      secondsRemaining: secondsRemaining(attempt.expiresAt),
      answered: Array.isArray(attempt.answers)
        ? attempt.answers.filter((answer) => answer.selectedIndex !== null).length
        : 0,
      questionCount: attempt.questionCount,
    }));

  const attemptedQuizIds = new Set(completed.map((row) => row.quizId));

  const candidates = await db
    .select({
      id: quizzesTable.id,
      slug: quizzesTable.slug,
      title: quizzesTable.title,
      description: quizzesTable.description,
      subject: quizzesTable.subject,
      difficulty: quizzesTable.difficulty,
      durationMinutes: quizzesTable.durationMinutes,
      questionCount: quizzesTable.questionCount,
      passScore: quizzesTable.passScore,
      maxAttempts: quizzesTable.maxAttempts,
      accessCode: quizzesTable.accessCode,
    })
    .from(quizzesTable)
    .where(eq(quizzesTable.isPublished, true))
    .orderBy(desc(quizzesTable.createdAt))
    .limit(50);

  const recommended = candidates
    .filter((quiz) => !attemptedQuizIds.has(quiz.id) && quiz.questionCount > 0)
    .slice(0, 3)
    .map((quiz) => ({
      id: quiz.id,
      slug: quiz.slug,
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject,
      difficulty: quiz.difficulty as DashboardData["recommended"][number]["difficulty"],
      durationMinutes: quiz.durationMinutes,
      questionCount: quiz.questionCount,
      passScore: quiz.passScore,
      maxAttempts: quiz.maxAttempts,
      isRestricted: Boolean(quiz.accessCode),
      attemptsUsed: 0,
      attemptsRemaining: attemptsRemaining(quiz.maxAttempts, 0),
      bestPercentage: null,
      lastPercentage: null,
    }));

  return {
    user: { name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    stats: {
      quizzesTaken: new Set(completed.map((row) => row.quizId)).size,
      completedAttempts: total,
      averagePercentage:
        total === 0 ? 0 : round(completed.reduce((sum, row) => sum + row.percentage, 0) / total),
      passRate: total === 0 ? 0 : round((passed / total) * 100),
      bestPercentage: total === 0 ? 0 : Math.max(...completed.map((row) => row.percentage)),
    },
    inProgress,
    recentResults: completed.slice(0, 5).map(toHistoryItem),
    recommended,
  };
}
