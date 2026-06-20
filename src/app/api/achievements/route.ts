import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, achievementsTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const achievements = await db
      .select()
      .from(achievementsTable)
      .where(eq(achievementsTable.userId, userId));
    return NextResponse.json(achievements);
  } catch (err) {
    console.error("GET /api/achievements error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
