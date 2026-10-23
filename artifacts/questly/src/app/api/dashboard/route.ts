import { getSessionUser } from "@/lib/auth";
import { buildDashboard } from "@/lib/stats";
import { apiError, apiOk } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    return apiOk(await buildDashboard(user));
  } catch (error) {
    console.error("GET /api/dashboard failed", error);
    return apiError("Could not load your dashboard", 500);
  }
}
