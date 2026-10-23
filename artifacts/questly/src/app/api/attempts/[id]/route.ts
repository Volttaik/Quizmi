import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { loadAttemptState, saveDraftAnswers } from "@/lib/attempts";
import { apiError, apiOk, parseId, readJson } from "@/lib/http";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const id = parseId((await params).id);
  if (!id) return apiError("Invalid attempt", 400);

  try {
    const result = await loadAttemptState(id, user.id);
    if ("error" in result) return apiError(result.error, result.status);
    return apiOk(result.state);
  } catch (error) {
    console.error("GET /api/attempts/[id] failed", error);
    return apiError("Could not load this attempt", 500);
  }
}

/**
 * Saves only the answers included in the request. The server merges them into
 * the draft, so a 1,000-question attempt does not resend its whole answer map
 * on every selection.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const id = parseId((await params).id);
  if (!id) return apiError("Invalid attempt", 400);

  try {
    const body = await readJson<{ answers?: unknown }>(req);
    const result = await saveDraftAnswers(id, user.id, body?.answers);
    if (!result.ok) return apiError(result.error, result.status);
    return apiOk(result);
  } catch (error) {
    console.error("PATCH /api/attempts/[id] failed", error);
    return apiError("Could not save your answers", 500);
  }
}
