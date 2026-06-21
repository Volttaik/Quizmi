import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, flashcardSetsTable, usersTable, creditTransactionsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateFlashcards, generateFlashcardsFromContent } from "@/lib/ai";
import { z } from "zod";

const schema = z.object({
  topic: z.string().min(1).max(500).optional(),
  fileContent: z.string().optional(),
  fileName: z.string().optional(),
  cardCount: z.number().min(1).max(200).default(20),
});

const CREDIT_PER_CARD = 1;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { topic, fileContent, fileName, cardCount } = parsed.data;

  if (!topic && !fileContent)
    return NextResponse.json({ error: "Please provide a topic or upload a file." }, { status: 400 });

  // Pre-check: at least 1 credit
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user || user.credits < 1)
    return NextResponse.json({ error: "Not enough credits. Buy more credits to continue." }, { status: 402 });

  if (!process.env.GROQ_API_KEY)
    return NextResponse.json({ error: "AI API key not configured. Please add GROQ_API_KEY in Secrets." }, { status: 503 });

  try {
    let cards: Array<{ front: string; back: string }>;
    let title: string;

    if (fileContent && fileContent.trim().length > 50) {
      const displayName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Uploaded Material";
      title = topic ? `${topic} Flashcards` : `${displayName} Flashcards`;
      cards = await generateFlashcardsFromContent(fileContent, cardCount);
    } else if (topic) {
      title = `${topic} Flashcards`;
      cards = await generateFlashcards(topic, cardCount);
    } else {
      return NextResponse.json({ error: "No valid source material provided." }, { status: 400 });
    }

    const cost = cards.length * CREDIT_PER_CARD;

    if (user.credits < cost)
      return NextResponse.json({
        error: `Not enough credits. This set needs ${cost} credits (${cards.length} cards × 1 credit). You have ${user.credits}.`,
      }, { status: 402 });

    const [set] = await db
      .insert(flashcardSetsTable)
      .values({ userId, title, topic: topic ?? (fileName ?? "Uploaded Material"), cards, count: cards.length })
      .returning();

    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ credits: user.credits - cost }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: -cost,
        type: "usage",
        description: `Generated flashcards: ${title} (${cards.length} cards)`,
      });
    });

    return NextResponse.json(set);
  } catch (err: any) {
    console.error("POST /api/generate-flashcards error", err);
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota"))
      return NextResponse.json({ error: "AI API quota exceeded. Please try again later." }, { status: 429 });
    return NextResponse.json({ error: err?.message ?? "Failed to generate flashcards" }, { status: 500 });
  }
}
