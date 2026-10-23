"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronLeft, ChevronUp, Mail } from "lucide-react";

const faqs = [
  {
    q: "Do I need an account to take a quiz?",
    a: "You can browse the quiz library without signing in. You need a free account to start an attempt so that your answers, timer and results can be saved.",
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
    q: "Can I leave an exam and come back?",
    a: "Yes. Your answers save as you go. If you close the page, reopening the attempt restores your answers — and the clock keeps running.",
  },
  {
    q: "Why can't I start a quiz?",
    a: "A quiz may require an access code, may have a limit on the number of attempts, or may not have any questions published yet. The start screen explains which applies.",
  },
  {
    q: "Where can I see my past results?",
    a: "Every completed attempt is listed in History with your score, time taken and a full answer review. Analytics for average score, pass rate and subject performance are on the same page.",
  },
];

export default function HelpSupportPage() {
  const [open, setOpen] = useState<number | null>(0);

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
