"use client";

/**
 * Session-aware fetch for the quiz runner.
 *
 * A 401 from a protected API is *not* proof that the learner signed out. Clerk
 * session tokens are short-lived JWTs that clerk-js refreshes in the
 * background, and a verification request can fail transiently (a token that
 * expired while the tab was idle, a Clerk/JWKS hiccup, a tab that was
 * suspended). Turning any of those into a sign-in redirect is what destroyed
 * in-progress attempts.
 *
 * This helper:
 *   1. force-refreshes the Clerk token and retries once on 401,
 *   2. retries once on the server's retryable "session_unavailable" 503 and on
 *      ordinary transient failures,
 *   3. only reports `unauthenticated` when a freshly refreshed token is still
 *      rejected, so the runner can show an explicit recovery state instead of
 *      silently navigating away.
 */

export type SessionFailure = "unauthenticated" | "unavailable";

export type SessionRequestOutcome =
  | { ok: true; response: Response }
  | { ok: false; failure: SessionFailure; response?: Response };

export type RetryDecision = "accept" | "refresh" | "retry";

/**
 * Pure retry policy, exported so it can be unit tested without a browser.
 * `retried` is true once this request has already been retried once.
 */
export function decideAfterResponse(
  status: number,
  code: string | null,
  retried: boolean
): RetryDecision {
  if (status === 401) return retried ? "accept" : "refresh";
  if (status === 503 && code === "session_unavailable") return retried ? "accept" : "retry";
  if (status === 408 || status === 429 || status >= 500) return retried ? "accept" : "retry";
  return "accept";
}

export function isSessionFailure(status: number, code: string | null): boolean {
  return status === 401 || (status === 503 && code === "session_unavailable");
}

const RETRY_DELAY_MS = 350;

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function readCode(response: Response): Promise<string | null> {
  try {
    const payload = (await response.clone().json()) as { code?: unknown } | null;
    return typeof payload?.code === "string" ? payload.code : null;
  } catch {
    return null;
  }
}

export async function requestWithSession(
  input: RequestInfo | URL,
  init: RequestInit,
  options: { refresh?: () => Promise<unknown>; sleep?: (ms: number) => Promise<void> } = {}
): Promise<SessionRequestOutcome> {
  const sleep = options.sleep ?? defaultSleep;
  let retried = false;

  for (;;) {
    let response: Response;
    try {
      response = await fetch(input, init);
    } catch {
      // Network failure: retry once, then report a retryable problem. Never a
      // sign-out.
      if (!retried) {
        retried = true;
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return { ok: false, failure: "unavailable" };
    }

    const code = response.ok ? null : await readCode(response);
    const decision = decideAfterResponse(response.status, code, retried);

    if (decision === "accept") {
      if (response.status === 401) return { ok: false, failure: "unauthenticated", response };
      if (response.status === 503 && code === "session_unavailable") {
        return { ok: false, failure: "unavailable", response };
      }
      return { ok: true, response };
    }

    retried = true;
    if (decision === "refresh" && options.refresh) {
      // Force a fresh token so the retry carries a valid session.
      try {
        await options.refresh();
      } catch {
        // Falling through to the retry still gives a transient Clerk problem a
        // second chance; a real sign-out will 401 again and be reported.
      }
    } else {
      await sleep(RETRY_DELAY_MS);
    }
  }
}
