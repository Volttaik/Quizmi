import { buildDashboard } from "@/lib/stats";
import { apiError, apiOk, requireSessionUser } from "@/lib/http";

export async function GET() {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  try {
    return apiOk(await buildDashboard(session.user));
  } catch (error) {
    console.error("GET /api/dashboard failed", error);
    return apiError("Could not load your dashboard", 500);
  }
}
