import { NextResponse } from "next/server";

/** Small helper so route handlers can bail out with a consistent error shape. */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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
