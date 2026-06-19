import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, quizzesTable, quizAttemptsTable, creditTransactionsTable } from "../lib/db.js";
import { eq, and, desc } from "drizzle-orm";
import { generateQuiz } from "../lib/ai.js";
import { z } from "zod";

const router = Router();

const generateSchema = z.object({
  topic: z.string().min(1).max(200),
  questionCount: z.number().min(1).max(50).default(10),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

const QUIZ_CREDITS = 5;

router.post("/generate-quiz", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { topic, questionCount, difficulty } = parsed.data;

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    if (!user || user.credits < QUIZ_CREDITS) {
      return res.status(402).json({ error: `Not enough credits. You need ${QUIZ_CREDITS} credits to generate a quiz.` });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "Gemini API key not configured. Please add GEMINI_API_KEY in Secrets." });
    }

    const questions = await generateQuiz(topic, questionCount, difficulty);
    const title = `${topic} Quiz`;

    const [quiz] = await db
      .insert(quizzesTable)
      .values({ userId, title, topic, difficulty, questions, questionCount: questions.length })
      .returning();

    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ credits: user.credits - QUIZ_CREDITS }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: -QUIZ_CREDITS,
        type: "usage",
        description: `Generated quiz: ${title}`,
      });
    });

    return res.json(quiz);
  } catch (err: any) {
    console.error(err);
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("Too Many Requests")) {
      return res.status(429).json({ error: "Gemini API quota exceeded. Please enable billing at aistudio.google.com or wait until your quota resets." });
    }
    return res.status(500).json({ error: err?.message ?? "Failed to generate quiz" });
  }
});

router.get("/quizzes", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const quizzes = await db
      .select()
      .from(quizzesTable)
      .where(eq(quizzesTable.userId, userId))
      .orderBy(desc(quizzesTable.createdAt))
      .limit(50);
    return res.json(quizzes);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/quizzes/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const quizId = parseInt(req.params.id);
  if (isNaN(quizId)) return res.status(400).json({ error: "Invalid quiz ID" });

  try {
    const quiz = await db.query.quizzesTable.findFirst({
      where: and(eq(quizzesTable.id, quizId), eq(quizzesTable.userId, userId)),
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    return res.json(quiz);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/quiz-attempts", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const attempts = await db
      .select()
      .from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.userId, userId))
      .orderBy(desc(quizAttemptsTable.completedAt))
      .limit(50);
    return res.json(attempts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quiz-attempts", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const schema = z.object({ quizId: z.number(), score: z.number(), total: z.number() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  try {
    const [attempt] = await db
      .insert(quizAttemptsTable)
      .values({ userId, ...parsed.data })
      .returning();
    return res.json(attempt);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
