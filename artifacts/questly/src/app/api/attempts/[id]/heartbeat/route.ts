import type { NextRequest } from "next/server";
import { recordHeartbeat } from "@/lib/attempts";
import { apiError, apiOk, parseId, requireSessionUser } from "@/lib/http";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;
  const user = session.user;

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
