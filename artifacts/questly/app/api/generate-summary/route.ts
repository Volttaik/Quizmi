import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, usersTable, summariesTable, creditTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateSummary } from "@/lib/gemini";
import { z } from "zod";

const schema = z.object({
  topic: z.string().min(1).max(200),
});

const CREDITS_REQUIRED = 2;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { topic } = parsed.data;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, userId),
  });
  if (!user || user.credits < CREDITS_REQUIRED) {
    return NextResponse.json(
      { error: `Not enough credits. You need ${CREDITS_REQUIRED} credits to generate a summary.` },
      { status: 402 }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured. Please add GEMINI_API_KEY in Secrets." },
      { status: 503 }
    );
  }

  const content = await generateSummary(topic);

  const [summary] = await db
    .insert(summariesTable)
    .values({ userId, topic, content })
    .returning();

  await db.transaction(async (tx) => {
    await tx
      .update(usersTable)
      .set({ credits: user.credits - CREDITS_REQUIRED })
      .where(eq(usersTable.clerkId, userId));

    await tx.insert(creditTransactionsTable).values({
      userId,
      amount: -CREDITS_REQUIRED,
      type: "usage",
      description: `Generated summary: ${topic}`,
    });
  });

  return NextResponse.json(summary);
}
