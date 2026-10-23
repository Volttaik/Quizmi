import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordDeparture } from "@/lib/attempts";
import { apiError, apiOk, parseId, readJson } from "@/lib/http";

/**
 * Called by the examination page when the learner confirms leaving, hides the
 * tab or the page is being unloaded. The server owns the counter: duplicates
 * within a short window are ignored and the third departure terminates the
 * attempt, so refreshing or reopening the page cannot reset it.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const id = parseId((await params).id);
  if (!id) return apiError("Invalid attempt", 400);

  try {
    const body = await readJson<{ reason?: unknown }>(req);
    const reason = typeof body?.reason === "string" ? body.reason : "navigated away";
    const result = await recordDeparture(id, user.id, reason);
    if (!result) return apiError("Attempt not found", 404);
    return apiOk(result);
  } catch (error) {
    console.error("POST /api/attempts/[id]/departure failed", error);
    return apiError("Could not record this event", 500);
  }
}
