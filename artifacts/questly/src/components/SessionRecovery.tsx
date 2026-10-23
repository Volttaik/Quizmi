"use client";

import Link from "next/link";
import { KeyRound, RefreshCw, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SessionFailure } from "@/lib/session-request";

/**
 * Shown when the quiz runner cannot prove the learner's session.
 *
 * It never navigates on its own: the attempt and its saved answers stay put,
 * and the learner chooses to retry or to sign in again (which returns them to
 * this exact attempt).
 */
export default function SessionRecovery({
  failure,
  onRetry,
  signInHref,
  courseHref,
  retrying = false,
}: {
  failure: SessionFailure;
  onRetry: () => void;
  signInHref: string;
  courseHref?: string;
  retrying?: boolean;
}) {
  const unavailable = failure === "unavailable";

  return (
    <div
      role="alertdialog"
      aria-labelledby="session-recovery-title"
      className="mx-auto w-full max-w-md rounded-[var(--radius)] border border-border bg-card p-6 text-center shadow-[var(--shadow-md)] sm:p-8"
    >
      <span
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] ${
          unavailable ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
        }`}
        aria-hidden
      >
        {unavailable ? <ShieldAlert className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
      </span>

      <h1 id="session-recovery-title" className="mt-5 text-xl font-semibold sm:text-2xl">
        {unavailable ? "We couldn't confirm your session" : "Your session needs a fresh sign-in"}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {unavailable
          ? "That looks like a connection problem, not a sign-out. Your answers are saved — retry and we'll carry on where you left off."
          : "Your sign-in expired before we could verify it. Nothing is lost: sign in again and you'll come straight back to this attempt."}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={onRetry} disabled={retrying} className="h-11 px-5">
          <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Checking…" : "Retry"}
        </Button>
        <Button asChild variant="outline" className="h-11 px-5">
          <Link href={signInHref}>{unavailable ? "Sign in instead" : "Sign in and continue"}</Link>
        </Button>
      </div>

      {courseHref && (
        <Link
          href={courseHref}
          className="mt-4 inline-block text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to course
        </Link>
      )}
    </div>
  );
}
