import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buildQuizDetail, getQuizBySlug } from "@/lib/quiz";
import { apiError, apiOk } from "@/lib/http";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();

  try {
    const quiz = await getQuizBySlug(slug);
    if (!quiz || !quiz.isPublished) return apiError("Quiz not found", 404);

    // Anonymous visitors can read the launch screen; personal stats stay empty.
    return apiOk(await buildQuizDetail(quiz, user?.clerkId ?? null));
  } catch (error) {
    console.error("GET /api/quizzes/[slug] failed", error);
    return apiError("Could not load this quiz", 500);
  }
}
