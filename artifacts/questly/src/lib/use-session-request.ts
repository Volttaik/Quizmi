"use client";

import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { requestWithSession, type SessionRequestOutcome } from "@/lib/session-request";

export type SessionFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<SessionRequestOutcome>;

/**
 * Session-aware fetch for ordinary pages.
 *
 * Every protected screen used to treat a 401 as "signed out" and navigate to
 * the sign-in page. A stale-but-refreshable Clerk token or a transient Clerk
 * failure therefore ejected learners from pages they were entitled to see.
 * This hook refreshes the token once and retries before the page decides
 * anything — and it never redirects by itself.
 */
export function useSessionRequest(): SessionFetch {
  const { getToken } = useAuth();

  return useCallback<SessionFetch>(
    (input, init = {}) =>
      requestWithSession(input, init, {
        refresh: async () => {
          try {
            await getToken({ skipCache: true });
          } catch {
            /* the retry decides */
          }
        },
      }),
    [getToken]
  );
}
