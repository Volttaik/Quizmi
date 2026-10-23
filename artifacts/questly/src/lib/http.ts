import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolveSession, type SessionUser } from "@/lib/auth";

/** Small helper so route handlers can bail out with a consistent error shape. */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Machine-readable auth failures.
 *
 * `unauthenticated`  → there is no usable session; the learner must sign in.
 * `session_unavailable` → we could not verify the session right now. The client
 *   must retry instead of treating this as a sign-out.
 */
export type AuthFailure = { ok: false; response: NextResponse };
export type AuthSuccess = { ok: true; user: SessionUser };

export function unauthenticated(message = "Sign in to continue"): NextResponse {
  return NextResponse.json({ error: message, code: "unauthenticated" }, { status: 401 });
}

export function sessionUnavailable(): NextResponse {
  return NextResponse.json(
    {
      error: "We couldn't confirm your session just now. Your progress is safe — try again.",
      code: "session_unavailable",
    },
    { status: 503 }
  );
}

/**
 * Resolves the caller for a protected route. Returns the user, or the response
 * the route should send back. Temporary verification failures are 503 (retry),
 * never 401 (sign out).
 */
export async function requireSessionUser(
  message?: string
): Promise<AuthSuccess | AuthFailure> {
  const session = await resolveSession();
  if (session.status === "ok") return { ok: true, user: session.user };
  if (session.status === "unavailable") return { ok: false, response: sessionUnavailable() };
  return { ok: false, response: unauthenticated(message) };
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function parseId(value: string | undefined): number | null {
  if (!value) return null;
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Creates a new cookie instance for the current request context.
 *
 * Next.js route handlers that call `cookies()` at the top of a function are
 * bound to the request; helpers that need to read/write cookies should call
 * this once and pass the store in rather than calling `cookies()` again.
 */
export { cookies };
