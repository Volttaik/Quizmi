import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, creditTransactionsTable } from "../lib/db.js";
import { eq, desc, sql } from "drizzle-orm";
import { chatWithAI } from "../lib/ai.js";
import { z } from "zod";
import { pool } from "@workspace/db";

const router = Router();

const CREDITS_PER_EXCHANGE = 1;

async function getOrCreateSession(userId: string, sessionId?: number): Promise<number> {
  if (sessionId) return sessionId;
  const result = await pool.query(
    `INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id`,
    [userId, "New Chat"]
  );
  return result.rows[0].id;
}

router.get("/chat/sessions", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const sessions = await pool.query(
      `SELECT cs.id, cs.title, cs.created_at, cs.updated_at,
              (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM chat_sessions cs
       WHERE cs.user_id = $1
       ORDER BY cs.updated_at DESC
       LIMIT 30`,
      [userId]
    );
    return res.json(sessions.rows);
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
    const session = await pool.query(
      `SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );
    if (!session.rows[0]) return res.status(404).json({ error: "Session not found" });

    const messages = await pool.query(
      `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId]
    );
    return res.json({ session: session.rows[0], messages: messages.rows });
  } catch (err) {
    req.log.error({ err }, "GET /chat/:sessionId error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/chat/message", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const schema = z.object({
    message: z.string().min(1).max(4000),
    sessionId: z.number().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

  const { message, sessionId: existingSessionId } = parsed.data;

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    if (!user || user.credits < CREDITS_PER_EXCHANGE) {
      return res.status(402).json({ error: "Not enough credits. You need 1 credit per message." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: "AI API key not configured. Please add GROQ_API_KEY in Secrets." });
    }

    const sessionId = await getOrCreateSession(userId, existingSessionId);

    const historyResult = await pool.query(
      `SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 20`,
      [sessionId]
    );
    const history = historyResult.rows as Array<{ role: string; content: string }>;

    await pool.query(
      `INSERT INTO chat_messages (session_id, user_id, role, content) VALUES ($1, $2, 'user', $3)`,
      [sessionId, userId, message]
    );

    const aiResponse = await chatWithAI(message, history);

    await pool.query(
      `INSERT INTO chat_messages (session_id, user_id, role, content) VALUES ($1, $2, 'assistant', $3)`,
      [sessionId, userId, aiResponse]
    );

    if (history.length === 0) {
      const title = message.length > 60 ? message.slice(0, 57) + "..." : message;
      await pool.query(
        `UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2`,
        [title, sessionId]
      );
    } else {
      await pool.query(
        `UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`,
        [sessionId]
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ credits: user.credits - CREDITS_PER_EXCHANGE })
        .where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: -CREDITS_PER_EXCHANGE,
        type: "usage",
        description: `AI Chat message`,
      });
    });

    return res.json({ sessionId, response: aiResponse, creditsLeft: user.credits - CREDITS_PER_EXCHANGE });
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
    await pool.query(`DELETE FROM chat_messages WHERE session_id = $1 AND user_id = $2`, [sessionId, userId]);
    await pool.query(`DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2`, [sessionId, userId]);
    return res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /chat/:sessionId error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
