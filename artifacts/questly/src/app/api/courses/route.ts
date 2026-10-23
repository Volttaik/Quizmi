import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listPublishedCourses, listSubjects } from "@/lib/courses";
import { apiError, apiOk, clampInt } from "@/lib/http";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  const params = req.nextUrl.searchParams;

  try {
    const limit = clampInt(params.get("limit"), 1, 100, 60);
    const offset = clampInt(params.get("offset"), 0, 100_000, 0);

    const [courses, subjects] = await Promise.all([
      listPublishedCourses(
        {
          search: params.get("q") ?? undefined,
          subject: params.get("subject") ?? undefined,
          sort: params.get("sort") ?? undefined,
          limit,
          offset,
        },
        user?.id ?? null
      ),
      listSubjects(),
    ]);

    return apiOk({ courses, subjects });
  } catch (error) {
    console.error("GET /api/courses failed", error);
    return apiError("Could not load courses", 500);
  }
}
