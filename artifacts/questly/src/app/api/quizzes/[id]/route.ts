import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, quizzesTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quizId = parseInt(id);
  if (isNaN(quizId)) return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });

  try {
    const quiz = await db.query.quizzesTable.findFirst({
      where: and(eq(quizzesTable.id, quizId), eq(quizzesTable.userId, userId)),
    });
    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    return NextResponse.json(quiz);
  } catch (err) {
    console.error("GET /api/quizzes/[id] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quizId = parseInt(id);
  if (isNaN(quizId)) return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });

  try {
    await db.delete(quizzesTable).where(and(eq(quizzesTable.id, quizId), eq(quizzesTable.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/quizzes/[id] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
