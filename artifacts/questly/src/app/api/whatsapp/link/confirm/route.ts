import { apiError, apiOk, readJson, isNonEmptyString, requireSessionUser } from "@/lib/http";
import { confirmLinkRequest } from "@/lib/whatsapp-api/links";

export const dynamic = "force-dynamic";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;

/**
 * Binds the signed-in Clerk user to the WhatsApp number that received the
 * token. Clerk identifies the account; the token proves the number. Keeps the
 * user's existing purchases and attempts, since it reuses their user row.
 */
export async function POST(req: Request) {
  const session = await requireSessionUser();
  if (!session.ok) return session.response;

  const body = await readJson<{ token?: unknown }>(req);
  if (!body || !isNonEmptyString(body.token) || !TOKEN_PATTERN.test(body.token)) {
    return apiError("Invalid link token", 400);
  }

  try {
    const result = await confirmLinkRequest(body.token, session.user.id);
    if (result.ok) {
      return apiOk({ linked: true, name: result.user.name });
    }
    switch (result.reason) {
      case "already_linked":
        return apiError("Your account is already linked to a WhatsApp number. Unlink it first.", 409);
      case "jid_in_use":
        return apiError("This WhatsApp number is already linked to another account.", 409);
      case "rate_limited":
        return apiError("Too many attempts. Try again later.", 429);
      default:
        return apiError("This link has expired or was already used. Send /login again.", 410);
    }
  } catch (error) {
    console.error("POST /api/whatsapp/link/confirm failed", error);
    return apiError("Could not link your account", 500);
  }
}
