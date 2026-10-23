import { getSessionUser } from "@/lib/auth";
import { computeAnalytics } from "@/lib/stats";
import { apiError, apiOk } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    return apiOk(await computeAnalytics(user.id));
  } catch (error) {
    console.error("GET /api/analytics failed", error);
    return apiError("Could not load your analytics", 500);
  }
}
