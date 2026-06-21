import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, summariesTable, usersTable, creditTransactionsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateSummary } from "@/lib/ai";
import { z } from "zod";

const schema = z.object({ topic: z.string().min(1).max(200) });
const SUMMARY_COST = 1;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user || user.credits < SUMMARY_COST)
    return NextResponse.json({ error: "Not enough credits. Buy more credits to continue." }, { status: 402 });

  if (!process.env.GROQ_API_KEY)
    return NextResponse.json({ error: "AI API key not configured. Please add GROQ_API_KEY in Secrets." }, { status: 503 });

  try {
    const content = await generateSummary(parsed.data.topic);
    const [summary] = await db.insert(summariesTable)
      .values({ userId, topic: parsed.data.topic, content }).returning();

    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ credits: user.credits - SUMMARY_COST }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId, amount: -SUMMARY_COST, type: "usage",
        description: `AI summary: ${parsed.data.topic}`,
      });
    });

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error("POST /api/generate-summary error", err);
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota"))
      return NextResponse.json({ error: "AI API quota exceeded. Please try again later." }, { status: 429 });
    return NextResponse.json({ error: err?.message ?? "Failed to generate summary" }, { status: 500 });
  }
}
