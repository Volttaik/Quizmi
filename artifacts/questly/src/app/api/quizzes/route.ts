import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, quizzesTable, usersTable, creditTransactionsTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { generateShareSlug } from "@/lib/quizTypes";

const CREDIT_PER_QUESTION = 1;

function generatePassKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, topic, quizType, subjectName, questions, difficulty, isPrivate } = body;
    if (!title || !Array.isArray(questions) || questions.length === 0)
      return NextResponse.json({ error: "Title and at least one question are required" }, { status: 400 });

    const cost = questions.length * CREDIT_PER_QUESTION;

    // Credit check
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    if (!user || user.credits < cost)
      return NextResponse.json({
        error: `Not enough credits. This quiz needs ${cost} credits (${questions.length} questions × 1 credit). You have ${user?.credits ?? 0}.`,
      }, { status: 402 });

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
      passKey: isPrivate ? generatePassKey() : null,
    }).returning();

    // Deduct credits and log activity
    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ credits: user.credits - cost }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: -cost,
        type: "usage",
        description: `Created quiz: ${title} (${questions.length} questions)`,
      });
    });

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
