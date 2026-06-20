import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, quizAttemptsTable, usersTable } from "@/lib/db";
import { eq, sum, count, desc, sql } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const results = await db
      .select({
        userId: quizAttemptsTable.userId,
        totalScore: sum(quizAttemptsTable.score),
        totalQuizzes: count(quizAttemptsTable.id),
        avgScore: sql<number>`ROUND(AVG(CAST(${quizAttemptsTable.score} AS REAL) / CAST(${quizAttemptsTable.total} AS REAL) * 100), 1)`,
      })
      .from(quizAttemptsTable)
      .groupBy(quizAttemptsTable.userId)
      .orderBy(desc(sum(quizAttemptsTable.score)))
      .limit(20);

    const withNames = await Promise.all(
      results.map(async (r, i) => {
        const user = await db.query.usersTable.findFirst({
          where: eq(usersTable.clerkId, r.userId),
        });
        return {
          rank: i + 1,
          userId: r.userId,
          name: user?.name ?? "Learner",
          totalScore: r.totalScore ?? 0,
          totalQuizzes: r.totalQuizzes ?? 0,
          avgScore: r.avgScore ?? 0,
          isMe: r.userId === userId,
        };
      })
    );

    return NextResponse.json(withNames);
  } catch (err) {
    console.error("GET /api/leaderboard error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
