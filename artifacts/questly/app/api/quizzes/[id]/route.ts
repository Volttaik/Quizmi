import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, quizzesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quizId = parseInt(id);
  if (isNaN(quizId)) {
    return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
  }

  const quiz = await db.query.quizzesTable.findFirst({
    where: and(eq(quizzesTable.id, quizId), eq(quizzesTable.userId, userId)),
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  return NextResponse.json(quiz);
}
