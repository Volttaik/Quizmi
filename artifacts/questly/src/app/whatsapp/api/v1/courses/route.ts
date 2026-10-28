import type { NextRequest } from "next/server";
import { apiError, apiOk, clampInt } from "@/lib/http";
import { verifyBotRequest } from "@/lib/whatsapp-api/bot-auth";
import { searchBotCourses } from "@/lib/whatsapp-api/courses";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = verifyBotRequest(req);
  if (!auth.ok) return auth.response;

  const params = req.nextUrl.searchParams;
  const q = (params.get("q") ?? "").slice(0, 120).trim() || undefined;
  const limit = clampInt(params.get("limit"), 1, 50, 20);
  const offset = clampInt(params.get("offset"), 0, 100_000, 0);

  try {
    const courses = await searchBotCourses(q, limit, offset);
    return apiOk({ courses, limit, offset });
  } catch (error) {
    console.error("GET /whatsapp/api/v1/courses failed", error);
    return apiError("Could not load courses", 500);
  }
}
