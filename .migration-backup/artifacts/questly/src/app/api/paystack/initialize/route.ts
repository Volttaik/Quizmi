import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, usersTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const CREDIT_PACKAGES = {
  starter: { credits: 50, amount: 500 },
  standard: { credits: 100, amount: 1000 },
  pro: { credits: 350, amount: 3500 },
} as const;

const schema = z.object({
  package: z.enum(["starter", "standard", "pro"]),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey)
    return NextResponse.json({ error: "Paystack not configured. Please add PAYSTACK_SECRET_KEY in Secrets." }, { status: 503 });

  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const pkg = CREDIT_PACKAGES[parsed.data.package];
    const email = parsed.data.email ?? user.email;
    const baseUrl =
      process.env.APP_URL ??
      `https://${(process.env.REPLIT_DOMAINS ?? "localhost:3000").split(",")[0]}`;

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: pkg.amount * 100,
        callback_url: `${baseUrl}/api/paystack/verify`,
        metadata: { userId, package: parsed.data.package, credits: pkg.credits },
      }),
    });

    const data = (await paystackRes.json()) as {
      status: boolean; message?: string; data?: { authorization_url: string; reference: string };
    };
    if (!data.status)
      return NextResponse.json({ error: data.message ?? "Failed to initialize payment" }, { status: 502 });

    return NextResponse.json({ url: data.data!.authorization_url, reference: data.data!.reference });
  } catch (err) {
    console.error("POST /api/paystack/initialize error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
