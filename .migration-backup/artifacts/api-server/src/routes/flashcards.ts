import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, flashcardSetsTable } from "../lib/db.js";
import { eq, desc, and } from "drizzle-orm";
import { generateFlashcards, generateFlashcardsFromContent } from "../lib/ai.js";
import { z } from "zod";

const router = Router();

router.post("/generate-flashcards", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const schema = z.object({
    topic: z.string().min(1).max(500).optional(),
    fileContent: z.string().optional(),
    fileName: z.string().optional(),
    cardCount: z.number().min(1).max(200).default(20),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { topic, fileContent, fileName, cardCount } = parsed.data;

  if (!topic && !fileContent) {
    return res.status(400).json({ error: "Please provide a topic or upload a file." });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "AI API key not configured. Please add GROQ_API_KEY in Secrets." });
  }

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
      return res.status(400).json({ error: "No valid source material provided." });
    }

    const [set] = await db
      .insert(flashcardSetsTable)
      .values({ userId, title, topic: topic ?? (fileName ?? "Uploaded Material"), cards, count: cards.length })
      .returning();

    return res.json(set);
  } catch (err: any) {
    req.log.error({ err }, "POST /generate-flashcards error");
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
      return res.status(429).json({ error: "AI API quota exceeded. Please try again later." });
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
      .limit(200);
    return res.json(sets);
  } catch (err) {
    req.log.error({ err }, "GET /flashcard-sets error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/flashcard-sets/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const setId = parseInt(req.params.id);
  if (isNaN(setId)) return res.status(400).json({ error: "Invalid set ID" });

  try {
    const existing = await db.query.flashcardSetsTable.findFirst({
      where: and(eq(flashcardSetsTable.id, setId), eq(flashcardSetsTable.userId, userId)),
      columns: { id: true },
    });
    if (!existing) return res.status(404).json({ error: "Flashcard set not found" });
    await db.delete(flashcardSetsTable).where(and(eq(flashcardSetsTable.id, setId), eq(flashcardSetsTable.userId, userId)));
    return res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /flashcard-sets/:id error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
