import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, quizzesTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { generateShareSlug } from "@/lib/quizTypes";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, topic, quizType, subjectName, questions, difficulty } = body;
    if (!title || !Array.isArray(questions) || questions.length === 0)
      return NextResponse.json({ error: "Title and at least one question are required" }, { status: 400 });

    const shareSlug = generateShareSlug(title);
    const [quiz] = await db.insert(quizzesTable).values({
      userId,
      title,
      topic: topic ?? title,
      difficulty: difficulty ?? "medium",
      questions,
      questionCount: questions.length,
      quizType: quizType ?? "study",
      subjectName: subjectName ?? null,
      description: null,
      shareSlug,
      isPublic: true,
    }).returning();
    return NextResponse.json(quiz);
  } catch (err: any) {
    console.error("POST /api/quizzes error", err);
    return NextResponse.json({ error: err?.message ?? "Failed to create quiz" }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const quizzes = await db
      .select()
      .from(quizzesTable)
      .where(eq(quizzesTable.userId, userId))
      .orderBy(desc(quizzesTable.createdAt))
      .limit(200);
    return NextResponse.json(quizzes);
  } catch (err) {
    console.error("GET /api/quizzes error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
