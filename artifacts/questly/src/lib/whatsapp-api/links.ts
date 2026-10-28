import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  whatsappLinkCodesTable,
  whatsappLinkConfirmFailuresTable,
  whatsappLinksTable,
  type User,
} from "@/lib/db";

/**
 * WhatsApp account linking.
 *
 * Flow:
 *  1. The bot calls createLinkRequest(jid). The server stores only a SHA-256
 *     hash of a random single-use token and returns the token. The bot sends
 *     the resulting URL to that WhatsApp number, which is the first proof.
 *  2. The student opens the URL, signs in with the existing Clerk login, and
 *     confirms. Clerk identifies the QuizMe account, which is the second proof.
 *  3. confirmLinkRequest binds that user to the jid atomically, consuming the
 *     token so it cannot be replayed.
 *
 * Neither the phone number nor the bot key alone can create a link.
 */

export const LINK_TTL_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_JID_PER_HOUR = 5;
const MAX_FAILED_CONFIRMS_PER_USER_PER_15_MIN = 10;

export type LinkRequestResult =
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; reason: "rate_limited" | "already_linked" };

export type ConfirmResult =
  | { ok: true; user: User; jid: string }
  | { ok: false; reason: "invalid_or_expired" | "rate_limited" | "already_linked" | "jid_in_use" };

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

export async function activeLinkForJid(jid: string) {
  return db.query.whatsappLinksTable.findFirst({
    where: and(eq(whatsappLinksTable.waJid, jid), isNull(whatsappLinksTable.unlinkedAt)),
  });
}

export async function activeLinkForUser(userId: number) {
  return db.query.whatsappLinksTable.findFirst({
    where: and(eq(whatsappLinksTable.userId, userId), isNull(whatsappLinksTable.unlinkedAt)),
  });
}

export async function createLinkRequest(jid: string): Promise<LinkRequestResult> {
  if (await activeLinkForJid(jid)) return { ok: false, reason: "already_linked" };

  const recent = await db
    .select({ n: sql<number>`count(*)` })
    .from(whatsappLinkCodesTable)
    .where(
      and(
        eq(whatsappLinkCodesTable.waJid, jid),
        gt(whatsappLinkCodesTable.createdAt, isoAgo(60 * 60 * 1000))
      )
    );
  if (Number(recent[0]?.n ?? 0) >= MAX_REQUESTS_PER_JID_PER_HOUR) {
    return { ok: false, reason: "rate_limited" };
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + LINK_TTL_MS).toISOString();
  // Earlier unused requests for this number stop working once a new one exists.
  await db
    .update(whatsappLinkCodesTable)
    .set({ expiresAt: new Date().toISOString() })
    .where(
      and(
        eq(whatsappLinkCodesTable.waJid, jid),
        isNull(whatsappLinkCodesTable.consumedAt),
        gt(whatsappLinkCodesTable.expiresAt, new Date().toISOString())
      )
    );
  await db.insert(whatsappLinkCodesTable).values({
    waJid: jid,
    codeHash: hashToken(token),
    expiresAt,
  });
  return { ok: true, token, expiresAt };
}

async function failedConfirmsFor(userId: number): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(whatsappLinkConfirmFailuresTable)
    .where(
      and(
        eq(whatsappLinkConfirmFailuresTable.userId, userId),
        gt(whatsappLinkConfirmFailuresTable.failedAt, isoAgo(15 * 60 * 1000))
      )
    );
  return Number(rows[0]?.n ?? 0);
}

async function findOpenRequest(token: string) {
  return db.query.whatsappLinkCodesTable.findFirst({
    where: and(
      eq(whatsappLinkCodesTable.codeHash, hashToken(token)),
      isNull(whatsappLinkCodesTable.consumedAt),
      gt(whatsappLinkCodesTable.expiresAt, new Date().toISOString())
    ),
  });
}

/** Describes the pending request for the confirmation page, without consuming it. */
export async function describeLinkRequest(token: string, userId: number) {
  if ((await failedConfirmsFor(userId)) >= MAX_FAILED_CONFIRMS_PER_USER_PER_15_MIN) {
    return { ok: false as const, reason: "rate_limited" as const };
  }
  const request = await findOpenRequest(token);
  if (!request) {
    await db.insert(whatsappLinkConfirmFailuresTable).values({ userId });
    return { ok: false as const, reason: "invalid_or_expired" as const };
  }
  return { ok: true as const, expiresAt: request.expiresAt };
}

/**
 * Binds the signed-in user to the WhatsApp number that received the token.
 * The token is consumed inside the same transaction as the link insert, so a
 * replay or a double-click cannot create two links.
 */
export async function confirmLinkRequest(token: string, userId: number): Promise<ConfirmResult> {
  if ((await failedConfirmsFor(userId)) >= MAX_FAILED_CONFIRMS_PER_USER_PER_15_MIN) {
    return { ok: false, reason: "rate_limited" };
  }

  const request = await findOpenRequest(token);
  if (!request) {
    await db.insert(whatsappLinkConfirmFailuresTable).values({ userId });
    return { ok: false, reason: "invalid_or_expired" };
  }

  return db.transaction(async (tx) => {
    const userLink = await tx.query.whatsappLinksTable.findFirst({
      where: and(eq(whatsappLinksTable.userId, userId), isNull(whatsappLinksTable.unlinkedAt)),
    });
    if (userLink) return { ok: false as const, reason: "already_linked" as const };

    const jidLink = await tx.query.whatsappLinksTable.findFirst({
      where: and(eq(whatsappLinksTable.waJid, request.waJid), isNull(whatsappLinksTable.unlinkedAt)),
    });
    if (jidLink) return { ok: false as const, reason: "jid_in_use" as const };

    const consumed = await tx
      .update(whatsappLinkCodesTable)
      .set({ consumedAt: new Date().toISOString(), consumedByUserId: userId })
      .where(and(eq(whatsappLinkCodesTable.id, request.id), isNull(whatsappLinkCodesTable.consumedAt)))
      .returning({ id: whatsappLinkCodesTable.id });
    if (consumed.length === 0) return { ok: false as const, reason: "invalid_or_expired" as const };

    await tx.insert(whatsappLinksTable).values({ userId, waJid: request.waJid });
    const user = await tx.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!user) throw new Error(`User ${userId} disappeared during linking`);
    return { ok: true as const, user, jid: request.waJid };
  });
}

/** Ends the active link for a WhatsApp number. Returns false if none existed. */
export async function unlinkJid(jid: string): Promise<boolean> {
  const updated = await db
    .update(whatsappLinksTable)
    .set({ unlinkedAt: new Date().toISOString() })
    .where(and(eq(whatsappLinksTable.waJid, jid), isNull(whatsappLinksTable.unlinkedAt)))
    .returning({ id: whatsappLinksTable.id });
  return updated.length > 0;
}
