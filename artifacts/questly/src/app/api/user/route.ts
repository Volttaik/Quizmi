import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, usersTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });

    if (!user) {
      let name = "Learner";
      let email = "";
      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        name = clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
          : clerkUser.username ?? "Learner";
        email = clerkUser.primaryEmailAddressId
          ? (clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? "")
          : (clerkUser.emailAddresses[0]?.emailAddress ?? "");
      } catch {}

      const [created] = await db
        .insert(usersTable)
        .values({ clerkId: userId, name, email, credits: 100, plan: "free" })
        .onConflictDoNothing()
        .returning();

      user = created ?? (await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) }));
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("GET /api/user error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email } = (await req.json()) as { name?: string; email?: string };

  try {
    const [updated] = await db
      .update(usersTable)
      .set({ ...(name ? { name } : {}), ...(email ? { email } : {}) })
      .where(eq(usersTable.clerkId, userId))
      .returning();
    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/user error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
