import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Bot-to-API authentication for `/whatsapp/api/*`.
 *
 * The bot sends `Authorization: Bearer <key>`. Keys are read from
 * `WHATSAPP_BOT_API_KEYS`, a comma-separated list, so a key can be rotated
 * without downtime: add the new key, deploy the bot with it, then remove the
 * old one. Keys are compared as SHA-256 digests in constant time.
 *
 * This proves the caller is the authorised WhatsApp service. It does NOT prove
 * which student is asking; student operations need account linking on top.
 */

export type BotAuthResult = { ok: true } | { ok: false; response: NextResponse };

function configuredKeyDigests(): Buffer[] {
  const raw = process.env.WHATSAPP_BOT_API_KEYS ?? "";
  return raw
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key.length >= 32)
    .map((key) => createHash("sha256").update(key).digest());
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

export function verifyBotRequest(request: Request): BotAuthResult {
  const digests = configuredKeyDigests();
  const unauthorized = () =>
    NextResponse.json(
      { error: "Unauthorized", code: "bot_unauthorized" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } }
    );

  if (digests.length === 0) {
    // Fail closed: an unconfigured deployment must never serve bot routes.
    console.error("WHATSAPP_BOT_API_KEYS is not configured; bot API disabled");
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Bot API is not configured", code: "bot_api_unconfigured" },
        { status: 503 }
      ),
    };
  }

  const token = bearerToken(request);
  if (!token) return { ok: false, response: unauthorized() };

  const presented = createHash("sha256").update(token).digest();
  let matched = false;
  for (const digest of digests) {
    // Evaluate every key so timing does not reveal which one matched.
    if (timingSafeEqual(presented, digest)) matched = true;
  }
  return matched ? { ok: true } : { ok: false, response: unauthorized() };
}
