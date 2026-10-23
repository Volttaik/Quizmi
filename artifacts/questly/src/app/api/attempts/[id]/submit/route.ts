import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildResultFromStored, finalizeAttempt, getAttemptById } from "@/lib/attempts";
import { getCourseById } from "@/lib/courses";
import { attemptIsExpired, sanitizeAnswerInput } from "@/lib/scoring";
import { apiError, apiOk, parseId, readJson } from "@/lib/http";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const id = parseId((await params).id);
  if (!id) return apiError("Invalid attempt", 400);

  try {
    const attempt = await getAttemptById(id);
    if (!attempt || attempt.userId !== user.id) return apiError("Attempt not found", 404);

    const course = await getCourseById(attempt.courseId);
    if (!course) return apiError("Course not found", 404);

    // Submitting a closed or terminated attempt returns its stored result
    // instead of re-scoring it.
    if (attempt.status !== "in_progress") {
      return apiOk(await buildResultFromStored(attempt, course));
    }

    const body = await readJson<{ answers?: unknown }>(req);

    // A late submission after the deadline is scored from the last saved draft.
    const answers = attemptIsExpired(attempt.expiresAt)
      ? undefined
      : sanitizeAnswerInput(body?.answers);

    return apiOk(await finalizeAttempt(attempt, course, answers));
  } catch (error) {
    console.error("POST /api/attempts/[id]/submit failed", error);
    return apiError("Could not submit this attempt", 500);
  }
}
