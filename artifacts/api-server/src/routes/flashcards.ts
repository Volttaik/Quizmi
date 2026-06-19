import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, flashcardSetsTable, creditTransactionsTable } from "../lib/db.js";
import { eq, desc } from "drizzle-orm";
import { generateFlashcards } from "../lib/ai.js";
import { z } from "zod";

const router = Router();

const FLASHCARD_CREDITS = 3;

router.post("/generate-flashcards", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const schema = z.object({
    topic: z.string().min(1).max(200),
    cardCount: z.number().min(1).max(100).default(20),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { topic, cardCount } = parsed.data;

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    if (!user || user.credits < FLASHCARD_CREDITS) {
      return res.status(402).json({ error: `Not enough credits. You need ${FLASHCARD_CREDITS} credits to generate flashcards.` });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Gemini API key not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    const cards = await generateFlashcards(topic, cardCount);
    const title = `${topic} Flashcards`;

    const [set] = await db
      .insert(flashcardSetsTable)
      .values({ userId, title, topic, cards, count: cards.length })
      .returning();

    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ credits: user.credits - FLASHCARD_CREDITS }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: -FLASHCARD_CREDITS,
        type: "usage",
        description: `Generated flashcards: ${title}`,
      });
    });

    return res.json(set);
  } catch (err: any) {
    console.error(err);
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("Too Many Requests")) {
      return res.status(429).json({ error: "Gemini API quota exceeded. Please enable billing at aistudio.google.com or wait until your quota resets." });
    }
    return res.status(500).json({ error: err?.message ?? "Failed to generate flashcards" });
  }
});

router.get("/flashcard-sets", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const sets = await db
      .select()
      .from(flashcardSetsTable)
      .where(eq(flashcardSetsTable.userId, userId))
      .orderBy(desc(flashcardSetsTable.createdAt))
      .limit(50);
    return res.json(sets);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
