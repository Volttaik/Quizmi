import { Router } from "express";
import { getAuth } from "@clerk/express";
import { put } from "@vercel/blob";

const router = Router();

router.post("/upload/avatar", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(503).json({ error: "Blob storage not configured. Add BLOB_READ_WRITE_TOKEN in Secrets." });
  }

  try {
    const contentType = req.headers["content-type"] ?? "application/octet-stream";
    const ext = contentType.includes("png") ? "png" : contentType.includes("jpg") || contentType.includes("jpeg") ? "jpg" : "webp";
    const filename = `avatars/${userId}-${Date.now()}.${ext}`;

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    const blob = await put(filename, buffer, {
      access: "public",
      token,
      contentType,
    });

    return res.json({ url: blob.url });
  } catch (err: any) {
    req.log.error({ err }, "POST /upload/avatar error");
    return res.status(500).json({ error: err?.message ?? "Upload failed" });
  }
});

export default router;
