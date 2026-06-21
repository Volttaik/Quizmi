import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, streaksTable, achievementsTable, quizAttemptsTable, flashcardSetsTable } from "@/lib/db";
import { eq, count, desc } from "drizzle-orm";

async function checkAndUnlockAchievements(userId: string, streak: number) {
  const existing = await db
    .select({ type: achievementsTable.type })
    .from(achievementsTable)
    .where(eq(achievementsTable.userId, userId));
  const unlocked = new Set(existing.map((a) => a.type));

  const toUnlock: string[] = [];
  if (streak >= 3 && !unlocked.has("streak_3")) toUnlock.push("streak_3");
  if (streak >= 7 && !unlocked.has("streak_7")) toUnlock.push("streak_7");
  if (streak >= 30 && !unlocked.has("streak_30")) toUnlock.push("streak_30");

  const [attempts] = await db
    .select({ cnt: count() })
    .from(quizAttemptsTable)
    .where(eq(quizAttemptsTable.userId, userId));
  const attemptCount = attempts?.cnt ?? 0;
  if (attemptCount >= 1 && !unlocked.has("first_quiz")) toUnlock.push("first_quiz");
  if (attemptCount >= 10 && !unlocked.has("quiz_10")) toUnlock.push("quiz_10");
  if (attemptCount >= 50 && !unlocked.has("quiz_50")) toUnlock.push("quiz_50");

  const [flashSets] = await db
    .select({ cnt: count() })
    .from(flashcardSetsTable)
    .where(eq(flashcardSetsTable.userId, userId));
  const setCount = flashSets?.cnt ?? 0;
  if (setCount >= 1 && !unlocked.has("first_flashcard")) toUnlock.push("first_flashcard");
  if (setCount >= 5 && !unlocked.has("flashcard_5")) toUnlock.push("flashcard_5");

  if (toUnlock.length > 0) {
    await db.insert(achievementsTable).values(
      toUnlock.map((type) => ({ userId, type }))
    );
  }
  return toUnlock;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let streak = await db.query.streaksTable.findFirst({
      where: eq(streaksTable.userId, userId),
    });

    if (!streak) {
      const [created] = await db
        .insert(streaksTable)
        .values({ userId })
        .onConflictDoNothing()
        .returning();
      streak = created ?? (await db.query.streaksTable.findFirst({ where: eq(streaksTable.userId, userId) }));
    }

    return NextResponse.json(streak ?? { currentStreak: 0, longestStreak: 0, totalStudyDays: 0 });
  } catch (err) {
    console.error("GET /api/streak error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const today = new Date().toISOString().split("T")[0];
    let streak = await db.query.streaksTable.findFirst({
      where: eq(streaksTable.userId, userId),
    });

    if (!streak) {
      const [created] = await db
        .insert(streaksTable)
        .values({ userId, currentStreak: 1, longestStreak: 1, lastStudyDate: today, totalStudyDays: 1 })
        .returning();
      const newAchievements = await checkAndUnlockAchievements(userId, 1);
      return NextResponse.json({ ...created, newAchievements });
    }

    const lastDate = streak.lastStudyDate;
    if (lastDate === today) {
      return NextResponse.json({ ...streak, newAchievements: [] });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const newStreak = lastDate === yesterdayStr ? streak.currentStreak + 1 : 1;
    const newLongest = Math.max(newStreak, streak.longestStreak);

    const [updated] = await db
      .update(streaksTable)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastStudyDate: today,
        totalStudyDays: streak.totalStudyDays + 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(streaksTable.userId, userId))
      .returning();

    const newAchievements = await checkAndUnlockAchievements(userId, newStreak);
    return NextResponse.json({ ...updated, newAchievements });
  } catch (err) {
    console.error("POST /api/streak error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
