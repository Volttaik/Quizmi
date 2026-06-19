import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, summariesTable, creditTransactionsTable } from "../lib/db.js";
import { eq } from "drizzle-orm";
import { generateSummary } from "../lib/gemini.js";
import { z } from "zod";

const router = Router();

const SUMMARY_CREDITS = 2;

router.post("/generate-summary", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const schema = z.object({ topic: z.string().min(1).max(200) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { topic } = parsed.data;

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    if (!user || user.credits < SUMMARY_CREDITS) {
      return res.status(402).json({ error: `Not enough credits. You need ${SUMMARY_CREDITS} credits to generate a summary.` });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Gemini API key not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    const content = await generateSummary(topic);

    const [summary] = await db
      .insert(summariesTable)
      .values({ userId, topic, content })
      .returning();

    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ credits: user.credits - SUMMARY_CREDITS }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: -SUMMARY_CREDITS,
        type: "usage",
        description: `Generated summary: ${topic}`,
      });
    });

    return res.json(summary);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to generate summary" });
  }
});

export default router;
