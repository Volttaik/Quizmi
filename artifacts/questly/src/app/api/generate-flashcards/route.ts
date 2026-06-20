import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, flashcardSetsTable } from "@/lib/db";
import { generateFlashcards, generateFlashcardsFromContent } from "@/lib/ai";
import { z } from "zod";

const schema = z.object({
  topic: z.string().min(1).max(500).optional(),
  fileContent: z.string().optional(),
  fileName: z.string().optional(),
  cardCount: z.number().min(1).max(200).default(20),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { topic, fileContent, fileName, cardCount } = parsed.data;

  if (!topic && !fileContent)
    return NextResponse.json({ error: "Please provide a topic or upload a file." }, { status: 400 });

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

    const [set] = await db
      .insert(flashcardSetsTable)
      .values({ userId, title, topic: topic ?? (fileName ?? "Uploaded Material"), cards, count: cards.length })
      .returning();

    return NextResponse.json(set);
  } catch (err: any) {
    console.error("POST /api/generate-flashcards error", err);
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota"))
      return NextResponse.json({ error: "AI API quota exceeded. Please try again later." }, { status: 429 });
    return NextResponse.json({ error: err?.message ?? "Failed to generate flashcards" }, { status: 500 });
  }
}
