import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, quizAttemptsTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const attempts = await db
      .select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.userId, userId))
      .orderBy(desc(quizAttemptsTable.completedAt))
      .limit(50);
    return NextResponse.json(attempts);
  } catch (err) {
    console.error("GET /api/quiz-attempts error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schema = z.object({ quizId: z.number(), score: z.number(), total: z.number() });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const [attempt] = await db.insert(quizAttemptsTable).values({ userId, ...parsed.data }).returning();
    return NextResponse.json(attempt);
  } catch (err) {
    console.error("POST /api/quiz-attempts error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
