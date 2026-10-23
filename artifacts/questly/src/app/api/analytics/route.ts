import { computeAnalytics } from "@/lib/stats";
import { apiError, apiOk, requireSessionUser } from "@/lib/http";

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  try {
    return apiOk(await computeAnalytics(session.user.id));
  } catch (error) {
    console.error("GET /api/analytics failed", error);
    return apiError("Could not load your analytics", 500);
  }
}
