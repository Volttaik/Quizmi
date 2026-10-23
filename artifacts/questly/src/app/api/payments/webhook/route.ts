import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isValidWebhookSignature, paystackConfigured } from "@/lib/paystack";
import { fulfilPayment } from "@/lib/purchases";

type PaystackEvent = {
  event?: string;
  data?: { reference?: string; status?: string };
};

export async function POST(req: NextRequest) {
  if (!paystackConfigured()) {
    return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!isValidWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: PaystackEvent | null = null;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ ok: true });
  }

  // Paystack sends several event types. Only successful charges are relevant;
  // the transaction is re-verified with Paystack before access is granted.
  if (event?.event === "charge.success" && typeof event.data?.reference === "string") {
    try {
      const result = await fulfilPayment(event.data.reference);
      if (!result.ok) {
        console.warn("Paystack webhook could not be fulfilled", result.status);
      }
    } catch (error) {
      console.error("Paystack webhook fulfilment failed", error);
    }
  }

  return NextResponse.json({ ok: true });
}
