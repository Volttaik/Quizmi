import { and, eq } from "drizzle-orm";
import { db, whatsappCardMessagesTable, coursesTable, type Course } from "@/lib/db";

/**
 * Remembers which course each outgoing WhatsApp card describes. The bot calls
 * recordCardMessage after sending a card, and resolveCardMessage when a
 * student quotes that card. Storing it in the database keeps quoted replies
 * working across bot restarts.
 */

export async function recordCardMessage(messageId: string, jid: string, courseId: number): Promise<void> {
  await db
    .insert(whatsappCardMessagesTable)
    .values({ messageId, waJid: jid, courseId })
    .onConflictDoNothing();
}

/**
 * Returns the course a quoted card refers to, only when the card was sent to
 * this same WhatsApp number. A message ID from another chat resolves to null.
 */
export async function resolveCardMessage(messageId: string, jid: string): Promise<Course | null> {
  const row = await db.query.whatsappCardMessagesTable.findFirst({
    where: and(eq(whatsappCardMessagesTable.messageId, messageId), eq(whatsappCardMessagesTable.waJid, jid)),
  });
  if (!row) return null;
  const course = await db.query.coursesTable.findFirst({
    where: and(eq(coursesTable.id, row.courseId), eq(coursesTable.isPublished, true)),
  });
  return course ?? null;
}
