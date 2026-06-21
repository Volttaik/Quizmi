import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db, usersTable, creditTransactionsTable } from "@/lib/db";
import { eq } from "drizzle-orm";

const IMAGE_CREDIT_COST = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json(
      { error: "Image uploads are not configured yet. Add BLOB_READ_WRITE_TOKEN in Secrets." },
      { status: 503 }
    );

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user || user.credits < IMAGE_CREDIT_COST)
    return NextResponse.json(
      { error: `Image upload costs ${IMAGE_CREDIT_COST} credits. You have ${user?.credits ?? 0}.` },
      { status: 402 }
    );

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: "Only JPEG, PNG, WebP and GIF images are allowed" }, { status: 400 });

    const ext = file.type.split("/")[1];
    const filename = `quiz-images/${userId}/${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    // Deduct credits
    await db.transaction(async (tx) => {
      await tx
        .update(usersTable)
        .set({ credits: user.credits - IMAGE_CREDIT_COST })
        .where(eq(usersTable.clerkId, userId));
      await tx.insert(creditTransactionsTable).values({
        userId,
        amount: -IMAGE_CREDIT_COST,
        type: "usage",
        description: `Quiz image upload`,
      });
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: any) {
    console.error("POST /api/upload-image error", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}
