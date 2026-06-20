import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, client, usersTable, chatSessionsTable, chatMessagesTable } from "../lib/db.js";
import { eq, desc, and } from "drizzle-orm";
import { chatWithAI } from "../lib/ai.js";
import { z } from "zod";

const router = Router();

router.get("/chat/sessions", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

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

    return res.json(sessionsWithLastMsg);
  } catch (err) {
    req.log.error({ err }, "GET /chat/sessions error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/chat/:sessionId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) return res.status(400).json({ error: "Invalid session ID" });

  try {
    const [session] = await db
      .select()
      .from(chatSessionsTable)
      .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, userId)))
      .limit(1);

    if (!session) return res.status(404).json({ error: "Session not found" });

    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, sessionId))
      .orderBy(chatMessagesTable.createdAt);

    return res.json({ session, messages });
  } catch (err) {
    req.log.error({ err }, "GET /chat/:sessionId error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/chat/message", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const schema = z.object({
    message: z.string().min(0).max(4000).default(""),
    fileContent: z.string().max(100000).optional(),
    fileName: z.string().max(500).optional(),
    sessionId: z.number().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });

  const { message, fileContent, fileName, sessionId: existingSessionId } = parsed.data;

  if (!message.trim() && !fileContent) {
    return res.status(400).json({ error: "Please provide a message or attach a file." });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: "AI API key not configured. Please add GROQ_API_KEY in Secrets." });
  }

  try {
    let sessionId = existingSessionId;

    if (!sessionId) {
      const [newSession] = await db
        .insert(chatSessionsTable)
        .values({ userId, title: "New Chat" })
        .returning();
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

    await db.insert(chatMessagesTable).values({
      sessionId: sessionId!,
      userId,
      role: "user",
      content: userDisplayMessage,
    });

    const aiResponse = await chatWithAI(aiInputMessage, history);

    await db.insert(chatMessagesTable).values({
      sessionId: sessionId!,
      userId,
      role: "assistant",
      content: aiResponse,
    });

    const titleSource = message.trim() || (fileName ?? "Document chat");
    if (history.length === 0) {
      const title = titleSource.length > 60 ? titleSource.slice(0, 57) + "..." : titleSource;
      await db
        .update(chatSessionsTable)
        .set({ title, updatedAt: new Date().toISOString() })
        .where(eq(chatSessionsTable.id, sessionId!));
    } else {
      await db
        .update(chatSessionsTable)
        .set({ updatedAt: new Date().toISOString() })
        .where(eq(chatSessionsTable.id, sessionId!));
    }

    return res.json({ sessionId, response: aiResponse });
  } catch (err: any) {
    req.log.error({ err }, "POST /chat/message error");
    if (err?.status === 429 || err?.message?.includes("429")) {
      return res.status(429).json({ error: "AI quota exceeded. Please try again later." });
    }
    return res.status(500).json({ error: err?.message ?? "Failed to get AI response" });
  }
});

router.delete("/chat/:sessionId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) return res.status(400).json({ error: "Invalid session ID" });

  try {
    await db
      .delete(chatMessagesTable)
      .where(and(eq(chatMessagesTable.sessionId, sessionId), eq(chatMessagesTable.userId, userId)));
    await db
      .delete(chatSessionsTable)
      .where(and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, userId)));
    return res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /chat/:sessionId error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
