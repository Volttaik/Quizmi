"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronLeft, ChevronUp, Mail } from "lucide-react";

const faqs = [
  {
    q: "Do I need an account to take an assessment?",
    a: "You can browse the course catalogue without signing in. You need an account to purchase a course and start an assessment so that your answers, timer and results can be saved.",
  },
  {
    q: "How is my score calculated?",
    a: "Every question is scored on the server the moment you submit. You earn the question's marks for a correct answer and nothing for an incorrect or unanswered one. Your percentage is your marks divided by the total marks available.",
  },
  {
    q: "What happens if I run out of time?",
    a: "The timer is enforced on the server. When time runs out, your saved answers are submitted automatically and your result is marked as time-expired.",
  },
  {
    q: "Can I leave an assessment and come back?",
    a: "Your answers save as you go, and a refresh restores them. Leaving an active assessment is recorded as a departure: the first two produce a warning, and the third terminates the attempt. For a timed assessment, the clock keeps running while you are away.",
  },
  {
    q: "How does QUIZIMI detect leaving an assessment?",
    a: "The exam page reports when you hide the tab, navigate away or unload the page, and the server records the confirmed departure against your attempt. Browsers cannot detect every possible departure (for example, switching to another device), so this is a reasonable integrity measure rather than perfect proctoring.",
  },
  {
    q: "Why can't I start an assessment?",
    a: "You need course access before starting. The course may not be purchased yet, the attempt limit may be used up, or the course may not have any questions available. The course page explains which applies.",
  },
  {
    q: "Where can I see my past results?",
    a: "Every completed attempt is listed in History with your score, time taken and a full answer review. Analytics for average score, pass rate and subject performance are on the same page.",
  },
];

export default function HelpSupportPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
            aria-label="Back to profile"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground">Help &amp; support</h1>
        </div>

        <a
          href="mailto:support@quizmi.space"
          className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/30"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Email support</p>
            <p className="text-xs text-muted-foreground">support@quizmi.space</p>
          </div>
        </a>

        <h2 className="mb-3 mt-6 px-0.5 text-sm font-extrabold text-foreground">
          Frequently asked questions
        </h2>

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          {faqs.map((faq, index) => (
            <div key={faq.q} className="border-b border-border/60 last:border-0">
              <button
                type="button"
                onClick={() => setOpen(open === index ? null : index)}
                aria-expanded={open === index}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <BookOpen className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="flex-1 text-sm font-semibold text-foreground">{faq.q}</span>
                {open === index ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {open === index && (
                <p className="px-4 pb-4 pl-11 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
