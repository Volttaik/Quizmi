import type { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, attemptsTable, quizzesTable } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { startAttemptForUser } from "@/lib/attempts";
import { apiError, apiOk, isNonEmptyString, readJson } from "@/lib/http";
import type { HistoryItem } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const rows = await db
      .select({
        attemptId: attemptsTable.id,
        quizId: attemptsTable.quizId,
        quizSlug: quizzesTable.slug,
        quizTitle: quizzesTable.title,
        subject: quizzesTable.subject,
        difficulty: quizzesTable.difficulty,
        status: attemptsTable.status,
        score: attemptsTable.score,
        totalMarks: attemptsTable.totalMarks,
        percentage: attemptsTable.percentage,
        passed: attemptsTable.passed,
        submittedAt: attemptsTable.submittedAt,
        timeTakenSeconds: attemptsTable.timeTakenSeconds,
      })
      .from(attemptsTable)
      .innerJoin(quizzesTable, eq(attemptsTable.quizId, quizzesTable.id))
      .where(eq(attemptsTable.userId, user.clerkId))
      .orderBy(desc(attemptsTable.id))
      .limit(200);

    const items: HistoryItem[] = rows.map((row) => ({
      ...row,
      status: row.status as HistoryItem["status"],
      difficulty: row.difficulty as HistoryItem["difficulty"],
      passed: Boolean(row.passed),
    }));

    return apiOk({ items });
  } catch (error) {
    console.error("GET /api/attempts failed", error);
    return apiError("Could not load your attempt history", 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return apiError("Sign in to start an exam", 401);

  const body = await readJson<{ slug?: string; accessCode?: string }>(req);
  if (!body || !isNonEmptyString(body.slug)) return apiError("Quiz slug is required");

  try {
    const result = await startAttemptForUser(user.clerkId, body.slug.trim(), body.accessCode);
    if (!result.ok) return apiError(result.error, result.status);
    return apiOk(result.state, 201);
  } catch (error) {
    console.error("POST /api/attempts failed", error);
    return apiError("Could not start this exam", 500);
  }
}
