import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token)
    return NextResponse.json({ error: "Blob storage not configured. Add BLOB_READ_WRITE_TOKEN in Secrets." }, { status: 503 });

  try {
    const contentType = req.headers.get("content-type") ?? "application/octet-stream";
    const ext = contentType.includes("png") ? "png" : contentType.includes("jpg") || contentType.includes("jpeg") ? "jpg" : "webp";
    const filename = `avatars/${userId}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await req.arrayBuffer());
    const blob = await put(filename, buffer, { access: "public", token, contentType });

    return NextResponse.json({ url: blob.url });
  } catch (err: any) {
    console.error("POST /api/upload/avatar error", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}
