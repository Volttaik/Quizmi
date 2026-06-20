import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, quizzesTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

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
