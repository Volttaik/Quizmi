import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, quizzesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quizzes = await db
    .select()
    .from(quizzesTable)
    .where(eq(quizzesTable.userId, userId))
    .orderBy(desc(quizzesTable.createdAt))
    .limit(50);

  return NextResponse.json(quizzes);
}
