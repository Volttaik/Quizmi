import type { NextRequest } from "next/server";
import { apiError, apiOk, readJson, isNonEmptyString } from "@/lib/http";
import { verifyBotRequest } from "@/lib/whatsapp-api/bot-auth";
import { createLinkRequest } from "@/lib/whatsapp-api/links";
import { appOrigin } from "@/lib/share";

export const dynamic = "force-dynamic";

const JID_PATTERN = /^[0-9]{6,20}@s\.whatsapp\.net$/;

/**
 * Starts linking for a WhatsApp number. The bot must send the returned URL to
 * that number. The URL is never returned to anyone else, and it only works for
 * a student who then signs in with Clerk and confirms.
 */
export async function POST(req: NextRequest) {
  const auth = verifyBotRequest(req);
  if (!auth.ok) return auth.response;

  const body = await readJson<{ jid?: unknown }>(req);
  if (!body || !isNonEmptyString(body.jid) || !JID_PATTERN.test(body.jid)) {
    return apiError("A valid WhatsApp jid is required", 400);
  }

  try {
    const result = await createLinkRequest(body.jid);
    if (!result.ok) {
      if (result.reason === "already_linked") {
        return apiOk({ status: "already_linked" });
      }
      return apiError("Too many link requests. Try again later.", 429);
    }

    const url = new URL("/whatsapp/link", appOrigin(process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin));
    // Query string, not fragment: the sign-in redirect keeps the query, and
    // the token is single-use and short-lived.
    url.searchParams.set("token", result.token);
    return apiOk({ status: "pending", url: url.toString(), expiresAt: result.expiresAt });
  } catch (error) {
    console.error("POST /whatsapp/api/v1/link failed", error);
    return apiError("Could not start linking", 500);
  }
}
