import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildResultFromStored, finalizeAttempt, getAttemptById } from "@/lib/attempts";
import { getQuizById } from "@/lib/quiz";
import { attemptIsExpired } from "@/lib/scoring";
import { apiError, apiOk, parseId } from "@/lib/http";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const id = parseId((await params).id);
  if (!id) return apiError("Invalid attempt", 400);

  try {
    let attempt = await getAttemptById(id);
    if (!attempt || attempt.userId !== user.clerkId) return apiError("Attempt not found", 404);

    const quiz = await getQuizById(attempt.quizId);
    if (!quiz) return apiError("Quiz not found", 404);

    if (attempt.status === "in_progress") {
      if (!attemptIsExpired(attempt.expiresAt)) {
        return apiError("This attempt is still in progress", 409);
      }
      await finalizeAttempt(attempt, quiz);
      attempt = (await getAttemptById(id)) ?? attempt;
    }

    return apiOk(await buildResultFromStored(attempt, quiz));
  } catch (error) {
    console.error("GET /api/attempts/[id]/result failed", error);
    return apiError("Could not load this result", 500);
  }
}
