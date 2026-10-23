import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildResultFromStored, finalizeAttempt, getAttemptById } from "@/lib/attempts";
import { getQuizById } from "@/lib/quiz";
import { attemptIsExpired, sanitizeAnswerInput } from "@/lib/scoring";
import { apiError, apiOk, parseId, readJson } from "@/lib/http";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const id = parseId((await params).id);
  if (!id) return apiError("Invalid attempt", 400);

  try {
    const attempt = await getAttemptById(id);
    if (!attempt || attempt.userId !== user.clerkId) return apiError("Attempt not found", 404);

    const quiz = await getQuizById(attempt.quizId);
    if (!quiz) return apiError("Quiz not found", 404);

    // Submitting twice returns the stored result instead of scoring again.
    if (attempt.status !== "in_progress") {
      return apiOk(await buildResultFromStored(attempt, quiz));
    }

    const body = await readJson<{ answers?: unknown }>(req);

    // A late submission after the deadline is scored from the last saved draft.
    const answers = attemptIsExpired(attempt.expiresAt)
      ? undefined
      : sanitizeAnswerInput(body?.answers);

    return apiOk(await finalizeAttempt(attempt, quiz, answers));
  } catch (error) {
    console.error("POST /api/attempts/[id]/submit failed", error);
    return apiError("Could not submit this attempt", 500);
  }
}
