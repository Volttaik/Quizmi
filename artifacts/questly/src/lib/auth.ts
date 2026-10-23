import { cache } from "react";
import { headers } from "next/headers";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@/lib/db";

export type SessionUser = User;

/**
 * The outcome of resolving the caller's session.
 *
 * `unauthenticated` means Clerk says there is no usable session (the learner
 * really is signed out or their token expired). `unavailable` means we could
 * not *verify* the session or load the local profile — a temporary condition
 * that must never be reported to the client as a sign-out, because the client
 * would otherwise throw away an in-progress quiz.
 */
export type SessionLookup =
  | { status: "ok"; user: SessionUser }
  | { status: "unauthenticated" }
  | { status: "unavailable"; error: unknown };

/**
 * Clerk auth reasons that mean "the browser still has a session, but the token
 * on this request was not usable". The frontend refreshes the session token on
 * a timer, so these resolve themselves; they must be retried, never treated as
 * a sign-out.
 *
 * Only a genuinely missing session (`session-token-and-uat-missing` /
 * `session-token-missing`) is a real signed-out state.
 */
const RECOVERABLE_AUTH_REASONS = new Set([
  "session-token-expired",
  "session-token-iat-before-client-uat",
  "session-token-nbf",
  "session-token-iat-in-the-future",
  "session-token-but-no-client-uat",
  "client-uat-but-no-session-token",
]);

async function clerkAuthReason(): Promise<string | null> {
  try {
    const requestHeaders = await headers();
    return requestHeaders.get("x-clerk-auth-reason");
  } catch {
    return null;
  }
}

async function fetchClerkProfile(clerkId: string): Promise<{ name: string; email: string }> {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(clerkId);
    const name =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.username || "Learner";
    const email =
      user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "";
    return { name, email };
  } catch {
    return { name: "Learner", email: "" };
  }
}

async function withRetry<T>(operation: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    }
  }
  throw lastError;
}

/**
 * Finds the local profile row for a Clerk user, creating it on first visit.
 *
 * The insert returns the new row directly and the lookup is retried once, so a
 * concurrent first visit (two tabs, or a page render plus an API call) can
 * never leave the caller looking signed-out while their row exists.
 */
async function ensureLocalUser(clerkId: string): Promise<SessionUser | null> {
  const existing = await withRetry(() =>
    db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) })
  );
  if (existing) return existing;

  const profile = await fetchClerkProfile(clerkId);
  const [inserted] = await db
    .insert(usersTable)
    .values({ clerkId, name: profile.name, email: profile.email })
    .onConflictDoNothing()
    .returning();

  if (inserted) return inserted;

  return (
    (await withRetry(() =>
      db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) })
    )) ?? null
  );
}

/**
 * Resolves the session without collapsing temporary failures into "signed out".
 * Clerk stays the single source of truth for authentication. React cache keeps
 * a page or route from looking the same user up more than once per request.
 */
export const resolveSession = cache(async (): Promise<SessionLookup> => {
  let userId: string | null = null;

  try {
    const session = await auth();
    userId = session.userId;
  } catch (error) {
    // Clerk could not verify the token (network/JWKS hiccup, handshake in
    // flight). That is not proof the learner signed out.
    console.error("Clerk session verification failed", error);
    return { status: "unavailable", error };
  }

  if (!userId) {
    const reason = await clerkAuthReason();
    if (reason && RECOVERABLE_AUTH_REASONS.has(reason)) {
      // The token on this request was stale or not yet usable. The client
      // refreshes and retries instead of showing a sign-in screen.
      return {
        status: "unavailable",
        error: new Error(`Clerk session token not usable yet (${reason})`),
      };
    }
    return { status: "unauthenticated" };
  }

  try {
    const user = await ensureLocalUser(userId);
    if (!user) {
      return {
        status: "unavailable",
        error: new Error(`Could not load the local profile for ${userId}`),
      };
    }
    return { status: "ok", user };
  } catch (error) {
    console.error("Could not load the local profile", error);
    return { status: "unavailable", error };
  }
});

/**
 * Convenience wrapper for routes that only need the user. A temporary failure
 * throws (the route reports a retryable error); a missing session returns null.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const result = await resolveSession();
  if (result.status === "unavailable") throw result.error;
  return result.status === "ok" ? result.user : null;
});

/**
 * For public reads (catalogue, course pages). If the session cannot be verified
 * right now, the page still renders the anonymous view instead of failing.
 */
export const getOptionalSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    return await getSessionUser();
  } catch {
    return null;
  }
});
