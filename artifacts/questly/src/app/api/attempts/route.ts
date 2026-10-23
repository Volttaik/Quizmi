import type { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, attemptsTable, coursesTable } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { startAttemptForUser } from "@/lib/attempts";
import { isSupportedDuration } from "@/lib/course-config";
import { apiError, apiOk, isNonEmptyString, readJson } from "@/lib/http";
import type { HistoryItem } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
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
      .where(eq(attemptsTable.userId, user.id))
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
  if (!user) return apiError("Sign in to start an assessment", 401);

  const body = await readJson<{
    slug?: string;
    questionCount?: unknown;
    durationMinutes?: unknown;
  }>(req);
  if (!body || !isNonEmptyString(body.slug)) return apiError("Course slug is required");

  let duration: number | null | undefined;
  if (body.durationMinutes === undefined) {
    duration = undefined;
  } else if (body.durationMinutes === null) {
    duration = null;
  } else {
    const parsed = Number(body.durationMinutes);
    if (!isSupportedDuration(parsed)) {
      return apiError("Choose a supported timer option (10 to 60 minutes, or unlimited)");
    }
    duration = parsed;
  }

  const questionCount =
    body.questionCount === undefined ? undefined : Number(body.questionCount);

  try {
    const result = await startAttemptForUser(user, body.slug.trim(), {
      questionCount,
      durationMinutes: duration,
    });
    if (!result.ok) return apiError(result.error, result.status);
    return apiOk(result.state, 201);
  } catch (error) {
    console.error("POST /api/attempts failed", error);
    return apiError("Could not start this assessment", 500);
  }
}
