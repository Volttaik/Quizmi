import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const CREDIT_PACKAGES = {
  starter: { credits: 500, amount: 500 },   // ₦500 = 500 credits
  standard: { credits: 1500, amount: 1200 }, // ₦1200 = 1500 credits
  pro: { credits: 5000, amount: 3500 },      // ₦3500 = 5000 credits
} as const;

const schema = z.object({
  package: z.enum(["starter", "standard", "pro"]),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Paystack not configured. Please add PAYSTACK_SECRET_KEY in Secrets." },
      { status: 503 }
    );
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, userId),
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const pkg = CREDIT_PACKAGES[parsed.data.package];
  const email = parsed.data.email ?? user.email;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost:3000"}`;

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: pkg.amount * 100, // Paystack uses kobo
      callback_url: `${baseUrl}/api/paystack/verify`,
      metadata: {
        userId,
        package: parsed.data.package,
        credits: pkg.credits,
      },
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message ?? "Failed to initialize payment" }, { status: 502 });
  }

  return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });
}
