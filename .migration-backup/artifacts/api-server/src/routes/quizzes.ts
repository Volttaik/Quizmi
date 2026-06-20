import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, quizzesTable, quizAttemptsTable, creditTransactionsTable } from "../lib/db.js";
import { eq, and, desc } from "drizzle-orm";
import { generateQuiz, generateQuizFromContent } from "../lib/ai.js";
import { z } from "zod";

const router = Router();

const generateSchema = z.object({
  topic: z.string().min(1).max(500).optional(),
  fileContent: z.string().optional(),
  fileName: z.string().optional(),
  questionCount: z.number().min(1).max(200).default(10),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

const QUIZ_CREDIT_PER_QUIZ = 1;

router.post("/generate-quiz", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { topic, fileContent, fileName, questionCount, difficulty } = parsed.data;

  if (!topic && !fileContent) {
    return res.status(400).json({ error: "Please provide a topic or upload a file." });
  }

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    const creditsNeeded = QUIZ_CREDIT_PER_QUIZ;
    if (!user || user.credits < creditsNeeded) {
      return res.status(402).json({
        error: `Not enough credits. You need ${creditsNeeded} credit${creditsNeeded > 1 ? "s" : ""} to generate a quiz.`,
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: "AI API key not configured. Please add GROQ_API_KEY in Secrets." });
    }

    let questions: Array<{ question: string; options: string[]; correct: number }>;
    let title: string;

    if (fileContent && fileContent.trim().length > 50) {
      const displayName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Uploaded Material";
      title = topic ? `${topic} Quiz` : `${displayName} Quiz`;
      questions = await generateQuizFromContent(fileContent, questionCount, difficulty, topic);
    } else if (topic) {
      title = `${topic} Quiz`;
      questions = await generateQuiz(topic, questionCount, difficulty);
    } else {
      return res.status(400).json({ error: "No valid source material provided." });
    }

    const [quiz] = await db
      .insert(quizzesTable)
      .values({
        userId,
        title,
        topic: topic ?? (fileName ?? "Uploaded Material"),
        difficulty,
        questions,
        questionCount: questions.length,
      })
      .returning();

    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ credits: user.credits - creditsNeeded })
        .where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: -creditsNeeded,
        type: "usage",
        description: `Generated quiz: ${title}`,
      });
    });

    return res.json(quiz);
  } catch (err: any) {
    req.log.error({ err }, "POST /generate-quiz error");
    if (
      err?.status === 429 ||
      err?.message?.includes("429") ||
      err?.message?.includes("quota") ||
      err?.message?.includes("Too Many Requests")
    ) {
      return res.status(429).json({ error: "AI API quota exceeded. Please try again later." });
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
      .limit(200);
    return res.json(quizzes);
  } catch (err) {
    req.log.error({ err }, "GET /quizzes error");
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
    req.log.error({ err }, "GET /quizzes/:id error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/quizzes/:id", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const quizId = parseInt(req.params.id);
  if (isNaN(quizId)) return res.status(400).json({ error: "Invalid quiz ID" });

  try {
    await db
      .delete(quizzesTable)
      .where(and(eq(quizzesTable.id, quizId), eq(quizzesTable.userId, userId)));
    return res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /quizzes/:id error");
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
    req.log.error({ err }, "GET /quiz-attempts error");
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
    req.log.error({ err }, "POST /quiz-attempts error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
