import { cache } from "react";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@/lib/db";

export type SessionUser = User;

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

/**
 * Returns the signed-in account, creating the local row on first visit.
 * Clerk stays the single source of truth for authentication. React cache keeps
 * a page or route from looking the same user up more than once per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });

  if (!user) {
    const profile = await fetchClerkProfile(userId);
    await db
      .insert(usersTable)
      .values({ clerkId: userId, name: profile.name, email: profile.email })
      .onConflictDoNothing();
    user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  }

  return user ?? null;
});
