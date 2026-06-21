import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, chatSessionsTable, chatMessagesTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sessions = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.userId, userId))
      .orderBy(desc(chatSessionsTable.updatedAt))
      .limit(30);

    const sessionsWithLastMsg = await Promise.all(
      sessions.map(async (s) => {
        const lastMsg = await db
          .select({ content: chatMessagesTable.content })
          .from(chatMessagesTable)
          .where(eq(chatMessagesTable.sessionId, s.id))
          .orderBy(desc(chatMessagesTable.createdAt))
          .limit(1);
        return { ...s, last_message: lastMsg[0]?.content ?? null };
      })
    );

    return NextResponse.json(sessionsWithLastMsg);
  } catch (err) {
    console.error("GET /api/chat/sessions error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
