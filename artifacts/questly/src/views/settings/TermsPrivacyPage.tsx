"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TermsPrivacyPage() {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
            aria-label="Back to profile"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground">Terms &amp; privacy</h1>
        </div>

        <div className="space-y-4">
          <Section title="Using Quizmi">
            <p>
              Quizmi provides practice tests and computer-based examination simulations for
              educational use. Quiz content is supplied by Quizmi and is intended for revision and
              self-assessment.
            </p>
            <p>
              Results are a practice indicator only. We make no guarantee that performance in a
              Quizmi exam predicts the outcome of any external examination.
            </p>
          </Section>

          <Section title="Accounts">
            <p>
              You need an account to take an exam so that your attempt, timer and result can be
              stored. You are responsible for keeping your login credentials secure and for activity
              on your account.
            </p>
            <p>
              Accounts used to disrupt the service, attempt to extract answer keys, or automate
              submissions may be suspended.
            </p>
          </Section>

          <Section title="What we store">
            <p>
              We store your name, email address and profile image (managed by our authentication
              provider), along with your attempts: the answers you selected, your score, timing and
              submission time.
            </p>
            <p>
              We do not sell your personal data. Attempt data is visible only to you and to
              authorised service operators for support and integrity checks.
            </p>
          </Section>

          <Section title="Cookies and local storage">
            <p>
              Session cookies keep you signed in. Local storage holds your theme preference and your
              notification preferences on this device. No advertising or tracking cookies are used.
            </p>
          </Section>

          <Section title="Exam integrity">
            <p>
              Correct answers are withheld while an attempt is in progress and are revealed in your
              answer review after submission. Sharing access codes or answer keys for restricted
              quizzes is not permitted.
            </p>
          </Section>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            Last updated: October 2026 · Version 2.0
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5">
      <h2 className="mb-3 text-sm font-extrabold text-foreground">{title}</h2>
      <div className="space-y-2">
        {Array.isArray(children) ? (
          children.map((child, index) => (
            <p key={index} className="text-sm leading-relaxed text-muted-foreground">
              {child}
            </p>
          ))
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
        )}
      </div>
    </div>
  );
}
