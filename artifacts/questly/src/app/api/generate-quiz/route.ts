import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, usersTable, quizzesTable, creditTransactionsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateQuiz, generateQuizFromContent, generateSocialQuiz, generateSocialQuizFromPrompt } from "@/lib/ai";
import { generateShareSlug } from "@/lib/quizTypes";
import { z } from "zod";

const generateSchema = z.object({
  topic: z.string().min(1).max(500).optional(),
  fileContent: z.string().optional(),
  fileName: z.string().optional(),
  questionCount: z.number().min(1).max(200).default(10),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  quizType: z.enum(["study", "love", "friendship", "family", "classroom", "personality", "knowme"]).default("study"),
  subjectName: z.string().max(100).optional(),
  description: z.string().max(3000).optional(),
  aiPrompt: z.string().max(2000).optional(),
});

const CREDIT_PER_QUESTION = 1;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = generateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { topic, fileContent, fileName, questionCount, difficulty, quizType, subjectName, description, aiPrompt } = parsed.data;

  const isSocial = quizType !== "study";

  if (!isSocial && !topic && !fileContent)
    return NextResponse.json({ error: "Please provide a topic or upload a file." }, { status: 400 });

  if (isSocial && !subjectName && !aiPrompt)
    return NextResponse.json({ error: "Please provide a name or description for your quiz." }, { status: 400 });

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });

    // Pre-check: need at least 1 credit (we'll check exact cost after generation)
    if (!user || user.credits < 1)
      return NextResponse.json({ error: "Not enough credits. Buy more credits to continue." }, { status: 402 });

    if (!process.env.GROQ_API_KEY)
      return NextResponse.json({ error: "AI API key not configured. Please add GROQ_API_KEY in Secrets." }, { status: 503 });

    let questions: Array<{ question: string; options: string[]; correct: number; explanation?: string; reference?: string }>;
    let title: string;
    let finalTopic = topic ?? subjectName ?? "Quiz";

    const typeLabels: Record<string, string> = {
      love: "Love Quiz",
      friendship: "Friendship Quiz",
      family: "Family Quiz",
      classroom: "Quiz",
      personality: "Personality Quiz",
      knowme: "Know Me Quiz",
    };

    if (isSocial) {
      const name = subjectName ?? "them";
      title = `${name}'s ${typeLabels[quizType] ?? "Quiz"}`;

      if (aiPrompt) {
        questions = await generateSocialQuizFromPrompt(quizType, name, aiPrompt, questionCount);
      } else if (description) {
        questions = await generateSocialQuiz(quizType, name, description, questionCount);
      } else {
        questions = await generateSocialQuiz(quizType, name, `This is a ${quizType} quiz about ${name}.`, questionCount);
      }
    } else if (fileContent && fileContent.trim().length > 50) {
      const displayName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Uploaded Material";
      title = topic ? `${topic} Quiz` : `${displayName} Quiz`;
      finalTopic = topic ?? displayName;
      questions = await generateQuizFromContent(fileContent, questionCount, difficulty, topic);
    } else if (topic) {
      title = `${topic} Quiz`;
      questions = await generateQuiz(topic, questionCount, difficulty);
    } else {
      return NextResponse.json({ error: "No valid source material provided." }, { status: 400 });
    }

    // Cost = 1 credit per question actually generated
    const cost = questions.length * CREDIT_PER_QUESTION;

    if (user.credits < cost)
      return NextResponse.json({
        error: `Not enough credits. This quiz needs ${cost} credits (${questions.length} questions × 1 credit). You have ${user.credits}.`,
      }, { status: 402 });

    const shareSlug = generateShareSlug(title);

    const [quiz] = await db
      .insert(quizzesTable)
      .values({
        userId,
        title,
        topic: finalTopic,
        difficulty,
        questions,
        questionCount: questions.length,
        quizType,
        subjectName: subjectName ?? null,
        description: description ?? aiPrompt ?? null,
        shareSlug,
        isPublic: true,
      })
      .returning();

    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ credits: user.credits - cost }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: -cost,
        type: "usage",
        description: `Generated quiz: ${title} (${questions.length} questions)`,
      });
    });

    return NextResponse.json(quiz);
  } catch (err: any) {
    console.error("POST /api/generate-quiz error", err);
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota"))
      return NextResponse.json({ error: "AI API quota exceeded. Please try again later." }, { status: 429 });
    return NextResponse.json({ error: err?.message ?? "Failed to generate quiz" }, { status: 500 });
  }
}
