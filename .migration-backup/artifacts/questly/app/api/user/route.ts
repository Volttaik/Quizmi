import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, userId),
  });

  if (!user) {
    const clerkUser = await currentUser();
    const name =
      clerkUser?.fullName ??
      clerkUser?.firstName ??
      clerkUser?.username ??
      "Learner";
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "";

    [user] = await db
      .insert(usersTable)
      .values({ clerkId: userId, name, email, credits: 100, plan: "free" })
      .onConflictDoNothing()
      .returning();

    if (!user) {
      user = await db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, userId),
      });
    }
  }

  return NextResponse.json(user);
}
