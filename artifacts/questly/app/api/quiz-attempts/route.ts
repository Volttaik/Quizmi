import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, quizAttemptsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  quizId: z.number(),
  score: z.number(),
  total: z.number(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [attempt] = await db
    .insert(quizAttemptsTable)
    .values({ userId, ...parsed.data })
    .returning();

  return NextResponse.json(attempt);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempts = await db
    .select()
    .from(quizAttemptsTable)
    .where(eq(quizAttemptsTable.userId, userId))
    .orderBy(desc(quizAttemptsTable.completedAt))
    .limit(50);

  return NextResponse.json(attempts);
}
