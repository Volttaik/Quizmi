import { createHmac, timingSafeEqual } from "node:crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

export class PaystackError extends Error {
  constructor(
    message: string,
    readonly httpStatus = 502
  ) {
    super(message);
    this.name = "PaystackError";
  }
}

export function paystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new PaystackError(
      "Payments are not configured yet. Add PAYSTACK_SECRET_KEY to the server environment.",
      503
    );
  }
  return key;
}

type InitializeResponse = {
  status: boolean;
  message?: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
};

export type InitializeInput = {
  email: string;
  amountKobo: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string | number>;
};

export type InitializedTransaction = {
  authorizationUrl: string;
  accessCode: string | null;
  reference: string;
};

export async function initializeTransaction(
  input: InitializeInput
): Promise<InitializedTransaction> {
  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as InitializeResponse | null;
  if (!response.ok || !payload?.status || !payload.data?.authorization_url) {
    throw new PaystackError(
      payload?.message || "Paystack could not start this payment. Try again."
    );
  }

  return {
    authorizationUrl: payload.data.authorization_url,
    accessCode: payload.data.access_code ?? null,
    reference: payload.data.reference ?? input.reference,
  };
}

export type VerifiedTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  providerReference: string | null;
  paidAt: string | null;
};

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const response = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey()}` },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    }
  );

  const payload = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: {
      status?: string;
      reference?: string;
      amount?: number;
      currency?: string;
      id?: number;
      paid_at?: string;
    };
  } | null;

  if (!response.ok || !payload?.status || !payload.data) {
    throw new PaystackError(payload?.message || "Could not verify this payment.");
  }

  return {
    status: payload.data.status ?? "failed",
    reference: payload.data.reference ?? reference,
    amount: Number(payload.data.amount ?? 0),
    currency: (payload.data.currency ?? "NGN").toUpperCase(),
    providerReference: payload.data.id ? String(payload.data.id) : null,
    paidAt: payload.data.paid_at ?? null,
  };
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw request body. */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return false;

  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const received = signature.trim();
  if (expected.length !== received.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}
