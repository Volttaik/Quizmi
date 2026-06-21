import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, flashcardSetsTable, usersTable, creditTransactionsTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

const CREDIT_PER_CARD = 1;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, topic, cards } = body;
    if (!title || !Array.isArray(cards) || cards.length === 0)
      return NextResponse.json({ error: "Title and at least one card are required" }, { status: 400 });

    const cost = cards.length * CREDIT_PER_CARD;

    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    if (!user || user.credits < cost)
      return NextResponse.json({
        error: `Not enough credits. This set needs ${cost} credits (${cards.length} cards × 1 credit). You have ${user?.credits ?? 0}.`,
      }, { status: 402 });

    const [set] = await db.insert(flashcardSetsTable).values({
      userId, title, topic: topic ?? title, cards, count: cards.length,
    }).returning();

    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ credits: user.credits - cost }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId, amount: -cost, type: "usage",
        description: `Created flashcards: ${title} (${cards.length} cards)`,
      });
    });

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
    const sets = await db.select().from(flashcardSetsTable)
      .where(eq(flashcardSetsTable.userId, userId))
      .orderBy(desc(flashcardSetsTable.createdAt)).limit(200);
    return NextResponse.json(sets);
  } catch (err) {
    console.error("GET /api/flashcard-sets error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
