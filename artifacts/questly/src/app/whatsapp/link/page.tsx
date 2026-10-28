"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Status =
  | { kind: "working" }
  | { kind: "missing" }
  | { kind: "done"; name: string }
  | { kind: "error"; message: string };

function LinkConfirm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>({ kind: "working" });

  useEffect(() => {
    if (!token) {
      setStatus({ kind: "missing" });
      return;
    }
    let cancelled = false;
    fetch("/api/whatsapp/link/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          name?: string;
          error?: string;
        };
        if (cancelled) return;
        if (response.ok) {
          setStatus({ kind: "done", name: body.name ?? "Learner" });
        } else {
          setStatus({ kind: "error", message: body.error ?? "Could not link your account" });
        }
      })
      .catch(() => {
        if (!cancelled) setStatus({ kind: "error", message: "Network error. Try again." });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-semibold">Link WhatsApp</h1>
      {status.kind === "working" && <p className="mt-4">Linking your account…</p>}
      {status.kind === "missing" && (
        <p className="mt-4">This link is incomplete. Send /login to the QuizMe bot again.</p>
      )}
      {status.kind === "done" && (
        <p className="mt-4">
          Done, {status.name}. Your WhatsApp is now linked to your QuizMe account. Your courses
          and progress are the same ones you see on the website.
        </p>
      )}
      {status.kind === "error" && <p className="mt-4 text-red-600">{status.message}</p>}
    </main>
  );
}

export default function WhatsappLinkPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <LinkConfirm />
    </Suspense>
  );
}
