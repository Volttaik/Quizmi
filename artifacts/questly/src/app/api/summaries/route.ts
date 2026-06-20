import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db, summariesTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const summaries = await db
      .select()
      .from(summariesTable)
      .where(eq(summariesTable.userId, userId))
      .orderBy(desc(summariesTable.createdAt))
      .limit(50);
    return NextResponse.json(summaries);
  } catch (err) {
    console.error("GET /api/summaries error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
