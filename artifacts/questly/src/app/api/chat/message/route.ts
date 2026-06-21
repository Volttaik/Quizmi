import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, chatSessionsTable, chatMessagesTable, usersTable, creditTransactionsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { chatWithAI } from "@/lib/ai";
import { z } from "zod";

const schema = z.object({
  message: z.string().min(0).max(4000).default(""),
  fileContent: z.string().max(100000).optional(),
  fileName: z.string().max(500).optional(),
  sessionId: z.number().optional(),
});

const CHAT_COST = 1;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });

  const { message, fileContent, fileName, sessionId: existingSessionId } = parsed.data;

  if (!message.trim() && !fileContent)
    return NextResponse.json({ error: "Please provide a message or attach a file." }, { status: 400 });

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user || user.credits < CHAT_COST)
    return NextResponse.json({ error: "Not enough credits. Buy more credits to continue." }, { status: 402 });

  if (!process.env.GROQ_API_KEY)
    return NextResponse.json({ error: "AI API key not configured. Please add GROQ_API_KEY in Secrets." }, { status: 503 });

  try {
    let sessionId = existingSessionId;

    if (!sessionId) {
      const [newSession] = await db.insert(chatSessionsTable).values({ userId, title: "New Chat" }).returning();
      sessionId = newSession.id;
    }

    const history = await db
      .select({ role: chatMessagesTable.role, content: chatMessagesTable.content })
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, sessionId))
      .orderBy(chatMessagesTable.createdAt)
      .limit(20);

    const userDisplayMessage = fileContent
      ? (message.trim() ? `📎 ${fileName ?? "document"}\n\n${message.trim()}` : `📎 ${fileName ?? "document"}`)
      : message.trim();

    const aiInputMessage = fileContent
      ? `The user has shared a document. Answer based on its content.\n\n--- DOCUMENT: ${fileName ?? "document"} ---\n${fileContent.slice(0, 80000)}\n--- END OF DOCUMENT ---\n\n${message.trim() || "Please summarize the key points from this document."}`
      : message.trim();

    await db.insert(chatMessagesTable).values({ sessionId: sessionId!, userId, role: "user", content: userDisplayMessage });

    const aiResponse = await chatWithAI(aiInputMessage, history);

    await db.insert(chatMessagesTable).values({ sessionId: sessionId!, userId, role: "assistant", content: aiResponse });

    // Deduct 1 credit per AI response
    await db.transaction(async (tx) => {
      await tx.update(usersTable).set({ credits: user.credits - CHAT_COST }).where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId, amount: -CHAT_COST, type: "usage",
        description: `AI chat response`,
      });
    });

    const titleSource = message.trim() || (fileName ?? "Document chat");
    if (history.length === 0) {
      const title = titleSource.length > 60 ? titleSource.slice(0, 57) + "..." : titleSource;
      await db.update(chatSessionsTable).set({ title, updatedAt: new Date().toISOString() }).where(eq(chatSessionsTable.id, sessionId!));
    } else {
      await db.update(chatSessionsTable).set({ updatedAt: new Date().toISOString() }).where(eq(chatSessionsTable.id, sessionId!));
    }

    return NextResponse.json({ sessionId, response: aiResponse });
  } catch (err: any) {
    console.error("POST /api/chat/message error", err);
    if (err?.status === 429 || err?.message?.includes("429"))
      return NextResponse.json({ error: "AI quota exceeded. Please try again later." }, { status: 429 });
    return NextResponse.json({ error: err?.message ?? "Failed to get AI response" }, { status: 500 });
  }
}
