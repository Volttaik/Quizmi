import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, flashcardReviewsTable } from "@/lib/db";
import { eq, and, lte } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setId = parseInt(req.nextUrl.searchParams.get("setId") ?? "0");
  if (!setId) return NextResponse.json({ error: "setId required" }, { status: 400 });

  try {
    const reviews = await db
      .select()
      .from(flashcardReviewsTable)
      .where(and(eq(flashcardReviewsTable.userId, userId), eq(flashcardReviewsTable.setId, setId)));
    return NextResponse.json(reviews);
  } catch (err) {
    console.error("GET /api/flashcard-reviews error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const reviewSchema = z.object({
  setId: z.number(),
  cardIndex: z.number(),
  rating: z.number().min(0).max(5),
});

function sm2(easeFactor: number, interval: number, repetitions: number, rating: number) {
  let newEf = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  if (newEf < 1.3) newEf = 1.3;

  let newInterval: number;
  let newReps: number;

  if (rating < 3) {
    newInterval = 1;
    newReps = 0;
  } else {
    newReps = repetitions + 1;
    if (newReps === 1) newInterval = 1;
    else if (newReps === 2) newInterval = 6;
    else newInterval = Math.round(interval * newEf);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    easeFactor: newEf,
    interval: newInterval,
    repetitions: newReps,
    nextReview: nextReview.toISOString(),
    lastReview: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = reviewSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { setId, cardIndex, rating } = parsed.data;

  try {
    const existing = await db.query.flashcardReviewsTable.findFirst({
      where: and(
        eq(flashcardReviewsTable.userId, userId),
        eq(flashcardReviewsTable.setId, setId),
        eq(flashcardReviewsTable.cardIndex, cardIndex)
      ),
    });

    const prev = existing ?? { easeFactor: 2.5, interval: 1, repetitions: 0 };
    const updated = sm2(prev.easeFactor, prev.interval, prev.repetitions, rating);

    if (existing) {
      const [result] = await db
        .update(flashcardReviewsTable)
        .set(updated)
        .where(eq(flashcardReviewsTable.id, existing.id))
        .returning();
      return NextResponse.json(result);
    } else {
      const [result] = await db
        .insert(flashcardReviewsTable)
        .values({ userId, setId, cardIndex, ...updated })
        .returning();
      return NextResponse.json(result);
    }
  } catch (err) {
    console.error("POST /api/flashcard-reviews error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
