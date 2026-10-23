import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordHeartbeat } from "@/lib/attempts";
import { apiError, apiOk, parseId } from "@/lib/http";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const id = parseId((await params).id);
  if (!id) return apiError("Invalid attempt", 400);

  try {
    const active = await recordHeartbeat(id, user.id);
    return apiOk({ active });
  } catch (error) {
    console.error("POST /api/attempts/[id]/heartbeat failed", error);
    return apiError("Could not record activity", 500);
  }
}
