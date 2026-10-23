import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, attemptsTable, type StoredAnswer } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getAttemptForUser, loadAttemptState } from "@/lib/attempts";
import { getQuizById } from "@/lib/quiz";
import { attemptIsExpired, sanitizeAnswerInput, secondsRemaining } from "@/lib/scoring";
import { apiError, apiOk, parseId, readJson } from "@/lib/http";
import { finalizeAttempt } from "@/lib/attempts";

/** Drafts only need the selection; correctness is recomputed on submission. */
function toDraftAnswers(input: unknown): StoredAnswer[] {
  return sanitizeAnswerInput(input).map((answer) => ({
    ...answer,
    correct: false,
    marksAwarded: 0,
  }));
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const id = parseId((await params).id);
  if (!id) return apiError("Invalid attempt", 400);

  try {
    const result = await loadAttemptState(id, user.clerkId);
    if ("error" in result) return apiError(result.error, result.status);
    return apiOk(result.state);
  } catch (error) {
    console.error("GET /api/attempts/[id] failed", error);
    return apiError("Could not load this attempt", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const id = parseId((await params).id);
  if (!id) return apiError("Invalid attempt", 400);

  try {
    const attempt = await getAttemptForUser(id, user.clerkId);
    if (!attempt) return apiError("Attempt not found", 404);

    const quiz = await getQuizById(attempt.quizId);
    if (!quiz) return apiError("Quiz not found", 404);

    if (attempt.status !== "in_progress") {
      return apiOk({ saved: false, status: attempt.status });
    }

    if (attemptIsExpired(attempt.expiresAt)) {
      await finalizeAttempt(attempt, quiz);
      return apiOk({ saved: false, status: "expired" });
    }

    const body = await readJson<{ answers?: unknown }>(req);
    const answers = toDraftAnswers(body?.answers);

    await db.update(attemptsTable).set({ answers }).where(eq(attemptsTable.id, id));

    return apiOk({
      saved: true,
      status: "in_progress",
      secondsRemaining: secondsRemaining(attempt.expiresAt),
    });
  } catch (error) {
    console.error("PATCH /api/attempts/[id] failed", error);
    return apiError("Could not save your answers", 500);
  }
}
