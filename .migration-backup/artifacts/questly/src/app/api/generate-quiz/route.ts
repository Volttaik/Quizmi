import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, usersTable, quizzesTable, creditTransactionsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateQuiz, generateQuizFromContent } from "@/lib/ai";
import { z } from "zod";

const generateSchema = z.object({
  topic: z.string().min(1).max(500).optional(),
  fileContent: z.string().optional(),
  fileName: z.string().optional(),
  questionCount: z.number().min(1).max(200).default(10),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

const QUIZ_CREDIT_COST = 1;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = generateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { topic, fileContent, fileName, questionCount, difficulty } = parsed.data;

  if (!topic && !fileContent)
    return NextResponse.json({ error: "Please provide a topic or upload a file." }, { status: 400 });

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    if (!user || user.credits < QUIZ_CREDIT_COST)
      return NextResponse.json({ error: `Not enough credits. You need ${QUIZ_CREDIT_COST} credit to generate a quiz.` }, { status: 402 });

    if (!process.env.GROQ_API_KEY)
      return NextResponse.json({ error: "AI API key not configured. Please add GROQ_API_KEY in Secrets." }, { status: 503 });

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
      return NextResponse.json({ error: "No valid source material provided." }, { status: 400 });
    }

    const [quiz] = await db
      .insert(quizzesTable)
      .values({ userId, title, topic: topic ?? (fileName ?? "Uploaded Material"), difficulty, questions, questionCount: questions.length })
      .returning();

    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ credits: user.credits - QUIZ_CREDIT_COST }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({ userId, amount: -QUIZ_CREDIT_COST, type: "usage", description: `Generated quiz: ${title}` });
    });

    return NextResponse.json(quiz);
  } catch (err: any) {
    console.error("POST /api/generate-quiz error", err);
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota"))
      return NextResponse.json({ error: "AI API quota exceeded. Please try again later." }, { status: 429 });
    return NextResponse.json({ error: err?.message ?? "Failed to generate quiz" }, { status: 500 });
  }
}
