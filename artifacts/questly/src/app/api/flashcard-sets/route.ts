import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, flashcardSetsTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, topic, cards } = body;
    if (!title || !Array.isArray(cards) || cards.length === 0)
      return NextResponse.json({ error: "Title and at least one card are required" }, { status: 400 });

    const [set] = await db.insert(flashcardSetsTable).values({
      userId,
      title,
      topic: topic ?? title,
      cards,
      count: cards.length,
    }).returning();
    return NextResponse.json(set);
  } catch (err: any) {
    console.error("POST /api/flashcard-sets error", err);
    return NextResponse.json({ error: err?.message ?? "Failed to create set" }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sets = await db
      .select()
      .from(flashcardSetsTable)
      .where(eq(flashcardSetsTable.userId, userId))
      .orderBy(desc(flashcardSetsTable.createdAt))
      .limit(200);
    return NextResponse.json(sets);
  } catch (err) {
    console.error("GET /api/flashcard-sets error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
