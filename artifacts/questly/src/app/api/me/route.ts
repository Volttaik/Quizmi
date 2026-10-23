import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { apiError, apiOk, readJson } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  return apiOk({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return apiError("Unauthorized", 401);

  const body = await readJson<{ name?: string; avatarUrl?: string | null }>(req);
  if (!body) return apiError("Invalid request body");

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  if (name !== undefined && (name.length < 2 || name.length > 80)) {
    return apiError("Name must be between 2 and 80 characters");
  }

  try {
    const [updated] = await db
      .update(usersTable)
      .set({
        ...(name ? { name } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl || null } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(usersTable.clerkId, user.clerkId))
      .returning();

    return apiOk({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
    });
  } catch (error) {
    console.error("PATCH /api/me failed", error);
    return apiError("Could not update your profile", 500);
  }
}
