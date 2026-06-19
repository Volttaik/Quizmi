import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, userId),
    columns: { credits: true },
  });

  return NextResponse.json({ credits: user?.credits ?? 0 });
}
