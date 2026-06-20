import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, chatSessionsTable, chatMessagesTable } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId: sid } = await params;
  const sessionId = parseInt(sid);
  if (isNaN(sessionId)) return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });

  try {
    const [session] = await db
      .select()
      .from(chatSessionsTable)
      .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, userId)))
      .limit(1);

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, sessionId))
      .orderBy(chatMessagesTable.createdAt);

    return NextResponse.json({ session, messages });
  } catch (err) {
    console.error("GET /api/chat/[sessionId] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId: sid } = await params;
  const sessionId = parseInt(sid);
  if (isNaN(sessionId)) return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });

  try {
    await db.delete(chatMessagesTable).where(and(eq(chatMessagesTable.sessionId, sessionId), eq(chatMessagesTable.userId, userId)));
    await db.delete(chatSessionsTable).where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/chat/[sessionId] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
