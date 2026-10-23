import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listPublishedQuizzes, listSubjects } from "@/lib/quiz";
import { apiError, apiOk } from "@/lib/http";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  const params = req.nextUrl.searchParams;

  try {
    const [quizzes, subjects] = await Promise.all([
      listPublishedQuizzes(
        {
          search: params.get("q") ?? undefined,
          subject: params.get("subject") ?? undefined,
          difficulty: params.get("difficulty") ?? undefined,
          sort: params.get("sort") ?? undefined,
        },
        user?.clerkId ?? null
      ),
      listSubjects(),
    ]);

    return apiOk({ quizzes, subjects });
  } catch (error) {
    console.error("GET /api/quizzes failed", error);
    return apiError("Could not load quizzes", 500);
  }
}
