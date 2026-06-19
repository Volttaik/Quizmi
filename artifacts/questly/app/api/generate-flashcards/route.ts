import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, usersTable, flashcardSetsTable, creditTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateFlashcards } from "@/lib/gemini";
import { z } from "zod";

const schema = z.object({
  topic: z.string().min(1).max(200),
  cardCount: z.number().min(1).max(100).default(20),
});

const CREDITS_REQUIRED = 3;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { topic, cardCount } = parsed.data;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, userId),
  });
  if (!user || user.credits < CREDITS_REQUIRED) {
    return NextResponse.json(
      { error: `Not enough credits. You need ${CREDITS_REQUIRED} credits to generate flashcards.` },
      { status: 402 }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Please add GEMINI_API_KEY in Secrets." },
      { status: 503 }
    );
  }

  const cards = await generateFlashcards(topic, cardCount);
  const title = `${topic} Flashcards`;

  const [set] = await db
    .insert(flashcardSetsTable)
    .values({ userId, title, topic, cards, count: cards.length })
    .returning();

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ credits: user.credits - CREDITS_REQUIRED })
      .where(eq(usersTable.clerkId, userId));

    await tx.insert(creditTransactionsTable).values({
      userId,
      amount: -CREDITS_REQUIRED,
      type: "usage",
      description: `Generated flashcards: ${title}`,
    });
  });

  return NextResponse.json(set);
}
