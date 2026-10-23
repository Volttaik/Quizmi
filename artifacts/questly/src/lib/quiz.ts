import { and, eq, inArray, like, or, sql } from "drizzle-orm";
import { db, attemptsTable, questionsTable, quizzesTable, type Quiz } from "@/lib/db";
import { attemptsRemaining } from "@/lib/scoring";
import type { Difficulty, QuizDetail, QuizSummary } from "@/lib/types";

export type QuizFilters = {
  search?: string;
  subject?: string;
  difficulty?: string;
  sort?: string;
};

type QuestionStats = { count: number; marks: number };
type AttemptStats = {
  used: number;
  best: number | null;
  last: number | null;
  inProgressId: number | null;
};

async function loadQuestionStats(quizIds: number[]): Promise<Map<number, QuestionStats>> {
  const stats = new Map<number, QuestionStats>();
  if (quizIds.length === 0) return stats;

  const rows = await db
    .select({
      quizId: questionsTable.quizId,
      count: sql<number>`count(*)`,
      marks: sql<number>`coalesce(sum(${questionsTable.marks}), 0)`,
    })
    .from(questionsTable)
    .where(inArray(questionsTable.quizId, quizIds))
    .groupBy(questionsTable.quizId);

  for (const row of rows) {
    stats.set(row.quizId, { count: Number(row.count), marks: Number(row.marks) });
  }
  return stats;
}

async function loadAttemptStats(
  userId: string | null,
  quizIds: number[]
): Promise<Map<number, AttemptStats>> {
  const stats = new Map<number, AttemptStats>();
  if (!userId || quizIds.length === 0) return stats;

  const rows = await db
    .select({
      id: attemptsTable.id,
      quizId: attemptsTable.quizId,
      status: attemptsTable.status,
      percentage: attemptsTable.percentage,
      submittedAt: attemptsTable.submittedAt,
    })
    .from(attemptsTable)
    .where(and(eq(attemptsTable.userId, userId), inArray(attemptsTable.quizId, quizIds)));

  for (const row of rows) {
    const current = stats.get(row.quizId) ?? { used: 0, best: null, last: null, inProgressId: null };
    current.used += 1;

    if (row.status === "in_progress") {
      current.inProgressId = row.id;
    } else {
      current.best = current.best === null ? row.percentage : Math.max(current.best, row.percentage);
      current.last = row.percentage;
    }
    stats.set(row.quizId, current);
  }

  return stats;
}

function toSummary(
  quiz: Quiz,
  questions: QuestionStats | undefined,
  attempts: AttemptStats | undefined
): QuizSummary {
  const questionCount = questions?.count ?? 0;
  const used = attempts?.used ?? 0;
  return {
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    description: quiz.description ?? "",
    subject: quiz.subject,
    difficulty: quiz.difficulty as Difficulty,
    durationMinutes: quiz.durationMinutes ?? null,
    questionCount,
    passScore: quiz.passScore,
    maxAttempts: quiz.maxAttempts ?? null,
    isRestricted: Boolean(quiz.accessCode),
    attemptsUsed: used,
    attemptsRemaining: attemptsRemaining(quiz.maxAttempts ?? null, used),
    bestPercentage: attempts?.best ?? null,
    lastPercentage: attempts?.last ?? null,
  };
}

export async function listPublishedQuizzes(
  filters: QuizFilters,
  userId: string | null
): Promise<QuizSummary[]> {
  const conditions = [eq(quizzesTable.isPublished, true)];

  if (filters.search?.trim()) {
    const needle = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        like(quizzesTable.title, needle),
        like(quizzesTable.description, needle),
        like(quizzesTable.subject, needle)
      )!
    );
  }
  if (filters.subject?.trim() && filters.subject !== "all") {
    conditions.push(eq(quizzesTable.subject, filters.subject.trim()));
  }
  if (filters.difficulty?.trim() && filters.difficulty !== "all") {
    conditions.push(eq(quizzesTable.difficulty, filters.difficulty.trim()));
  }

  const quizzes = await db
    .select()
    .from(quizzesTable)
    .where(and(...conditions));

  const ids = quizzes.map((quiz) => quiz.id);
  const [questionStats, attemptStats] = await Promise.all([
    loadQuestionStats(ids),
    loadAttemptStats(userId, ids),
  ]);

  let summaries = quizzes
    .map((quiz) => toSummary(quiz, questionStats.get(quiz.id), attemptStats.get(quiz.id)))
    .filter((quiz) => quiz.questionCount > 0);

  if (filters.sort === "title") {
    summaries.sort((a, b) => a.title.localeCompare(b.title));
  } else if (filters.sort === "shortest") {
    summaries.sort((a, b) => a.questionCount - b.questionCount);
  } else if (filters.sort === "popular") {
    summaries.sort((a, b) => b.attemptsUsed - a.attemptsUsed);
  } else if (filters.sort === "newest") {
    summaries.sort((a, b) => b.id - a.id);
  } else {
    summaries.sort((a, b) => a.title.localeCompare(b.title));
  }

  return summaries;
}

export async function getQuizBySlug(slug: string): Promise<Quiz | undefined> {
  return db.query.quizzesTable.findFirst({ where: eq(quizzesTable.slug, slug) });
}

export async function getQuizById(id: number): Promise<Quiz | undefined> {
  return db.query.quizzesTable.findFirst({ where: eq(quizzesTable.id, id) });
}

export async function buildQuizDetail(
  quiz: Quiz,
  userId: string | null
): Promise<QuizDetail> {
  const [questionStats, attemptStats, averageRows] = await Promise.all([
    loadQuestionStats([quiz.id]),
    loadAttemptStats(userId, [quiz.id]),
    db
      .select({ average: sql<number>`coalesce(avg(${attemptsTable.percentage}), 0)` })
      .from(attemptsTable)
      .where(
        and(
          eq(attemptsTable.quizId, quiz.id),
          inArray(attemptsTable.status, ["submitted", "expired"])
        )
      ),
  ]);

  const questions = questionStats.get(quiz.id);
  const attempts = attemptStats.get(quiz.id);
  const average = Number(averageRows[0]?.average ?? 0);

  return {
    ...toSummary(quiz, questions, attempts),
    totalMarks: questions?.marks ?? 0,
    averagePercentage: Number.isFinite(average) && average > 0 ? Math.round(average) : null,
    inProgressAttemptId: attempts?.inProgressId ?? null,
    createdAt: quiz.createdAt,
  };
}

export async function listSubjects(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ subject: quizzesTable.subject })
    .from(quizzesTable)
    .where(eq(quizzesTable.isPublished, true));
  return rows
    .map((row) => row.subject)
    .filter((subject): subject is string => Boolean(subject && subject.trim()))
    .sort();
}
