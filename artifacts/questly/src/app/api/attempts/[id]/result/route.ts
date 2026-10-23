import type { NextRequest } from "next/server";
import { buildResultFromStored, finalizeAttempt, getAttemptById } from "@/lib/attempts";
import { getCourseById } from "@/lib/courses";
import { attemptIsExpired } from "@/lib/scoring";
import { apiError, apiOk, parseId, requireSessionUser } from "@/lib/http";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const user = session.user;

  const id = parseId((await params).id);
  if (!id) return apiError("Invalid attempt", 400);

  try {
    let attempt = await getAttemptById(id);
    if (!attempt || attempt.userId !== user.id) return apiError("Attempt not found", 404);

    const course = await getCourseById(attempt.courseId);
    if (!course) return apiError("Course not found", 404);

    if (attempt.status === "in_progress") {
      if (!attemptIsExpired(attempt.expiresAt)) {
        return apiError("This attempt is still in progress", 409);
      }
      await finalizeAttempt(attempt, course);
      attempt = (await getAttemptById(id)) ?? attempt;
    }

    return apiOk(await buildResultFromStored(attempt, course));
  } catch (error) {
    console.error("GET /api/attempts/[id]/result failed", error);
    return apiError("Could not load this result", 500);
  }
}
