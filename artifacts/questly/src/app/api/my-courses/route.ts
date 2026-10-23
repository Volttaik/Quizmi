import { getSessionUser } from "@/lib/auth";
import { listPurchasedCourses } from "@/lib/courses";
import { apiError, apiOk } from "@/lib/http";

/**
 * Courses the signed-in learner owns. The list is read from the purchases
 * table, which is only written after the server verifies a payment — the
 * client cannot fabricate an entry here.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const courses = await listPurchasedCourses(user.id);
    return apiOk({ courses });
  } catch (error) {
    console.error("GET /api/my-courses failed", error);
    return apiError("Could not load your courses", 500);
  }
}
