"use client";

import { WifiOff } from "lucide-react";
import { QuizmiWordmark } from "@/components/QuizmiLogo";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mb-6 flex justify-center">
          <QuizmiWordmark size={28} />
        </div>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <WifiOff className="h-6 w-6" />
        </div>

        <h1 className="text-xl font-extrabold text-foreground">You&apos;re offline</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No internet connection detected. Some features need connectivity, but previously visited
          pages are still available.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
