import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, quizzesTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

  const { userId } = await auth();
  const passKey = req.nextUrl.searchParams.get("key") ?? "";

  try {
    const quiz = await db.query.quizzesTable.findFirst({
      where: eq(quizzesTable.shareSlug, slug),
    });

    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    if (!quiz.isPublic) return NextResponse.json({ error: "This quiz is private" }, { status: 403 });

    const isOwner = !!userId && quiz.userId === userId;
    const isLocked = !!quiz.passKey;

    if (isLocked && !isOwner) {
      if (!passKey) {
        // Return metadata only — no questions
        return NextResponse.json({
          id: quiz.id,
          title: quiz.title,
          quizType: quiz.quizType,
          subjectName: quiz.subjectName,
          difficulty: quiz.difficulty,
          questionCount: quiz.questionCount,
          isLocked: true,
        });
      }

      // Validate passkey (case-insensitive)
      if (passKey.toUpperCase() !== quiz.passKey!.toUpperCase()) {
        return NextResponse.json({ error: "Incorrect passkey. Check with the quiz creator." }, { status: 401 });
      }
    }

    return NextResponse.json({ ...quiz, isLocked: false });
  } catch (err) {
    console.error("GET /api/quizzes/slug error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
