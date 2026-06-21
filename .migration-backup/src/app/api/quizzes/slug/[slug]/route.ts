import { NextRequest, NextResponse } from "next/server";
import { db, quizzesTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

  try {
    const quiz = await db.query.quizzesTable.findFirst({
      where: eq(quizzesTable.shareSlug, slug),
    });

    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    if (!quiz.isPublic) return NextResponse.json({ error: "This quiz is private" }, { status: 403 });

    return NextResponse.json(quiz);
  } catch (err) {
    console.error("GET /api/quizzes/slug error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
