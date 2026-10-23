"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  FileQuestion,
  Keyboard,
  ListChecks,
  Trophy,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Clock,
    title: "Exam-real timing",
    body: "Countdown timers, server-enforced deadlines and automatic submission when time runs out.",
  },
  {
    icon: ListChecks,
    title: "Question navigation",
    body: "Move freely between questions, flag your progress and revisit anything before you submit.",
  },
  {
    icon: BarChart3,
    title: "Performance reports",
    body: "Score breakdowns, pass/fail status, time taken and a full answer review after every attempt.",
  },
  {
    icon: Trophy,
    title: "Attempt history",
    body: "Every result is saved so you can track improvement across subjects over time.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Find your exam",
    body: "Browse the library by subject and difficulty, or open a quiz link shared with you.",
  },
  {
    step: "02",
    title: "Take it under exam conditions",
    body: "Timed or untimed, with a navigator, keyboard shortcuts and progress that survives a refresh.",
  },
  {
    step: "03",
    title: "Review every answer",
    body: "See exactly what you got right, what you missed and why — then retake when you are ready.",
  },
];

export default function HomePage() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_20%,hsl(var(--background))_75%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <FileQuestion className="h-3.5 w-3.5" />
              Practice tests &amp; computer-based exams
            </span>

            <h1 className="animate-fade-up mt-6 text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Practise like it&apos;s
              <br />
              <span className="bg-gradient-to-r from-[hsl(262,72%,58%)] via-[hsl(285,70%,60%)] to-[hsl(232,80%,60%)] bg-clip-text text-transparent">
                the real exam
              </span>
            </h1>

            <p className="animate-fade-up mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Timed CBT simulations with instant scoring, pass marks and a full review of every
              answer. No gimmicks — just focused practice.
            </p>

            <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/quizzes">
                <Button size="lg" className="h-12 rounded-full px-7 text-sm font-bold">
                  Browse quizzes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-border px-7 text-sm font-semibold"
                >
                  {isSignedIn ? "Go to dashboard" : "Create free account"}
                </Button>
              </Link>
            </div>

            <p className="animate-fade-up mt-4 text-xs font-medium text-muted-foreground">
              Free to use · Works on mobile · Your results are saved automatically
            </p>
          </div>

          {/* Mock exam preview — illustrative, labelled as such */}
          <div className="animate-fade-up mx-auto mt-16 max-w-3xl rounded-3xl border border-border/70 bg-card p-3 shadow-2xl shadow-primary/10 sm:p-5">
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-[10px] font-black text-primary">
                  07
                </span>
                Question 7 of 40 · Biology
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                <Clock className="h-3 w-3" /> 12:48
              </span>
            </div>

            <div className="px-1 pt-5 sm:px-3">
              <p className="text-sm font-bold text-foreground sm:text-base">
                Which organelle is responsible for ATP production during aerobic respiration?
              </p>
              <div className="mt-4 space-y-2">
                {[
                  { label: "A", text: "Ribosome" },
                  { label: "B", text: "Mitochondrion", selected: true },
                  { label: "C", text: "Golgi apparatus" },
                ].map((option) => (
                  <div
                    key={option.label}
                    className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm ${
                      option.selected
                        ? "border-primary bg-primary/5 font-semibold text-foreground"
                        : "border-border/70 text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
                        option.selected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {option.label}
                    </span>
                    {option.text}
                    {option.selected && <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between pb-1 text-[11px] font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5" /> Use 1–4 to answer, arrows to navigate
                </span>
                <span className="hidden sm:inline">Answers save automatically</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Built for exams</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything a CBT exam needs, nothing it doesn&apos;t
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" strokeWidth={1.9} />
              </div>
              <h3 className="text-sm font-bold text-card-foreground">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="border-y border-border/60 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Three steps to exam day
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.step}>
                <p className="text-4xl font-black text-primary/20">{step.step}</p>
                <h3 className="mt-2 text-base font-bold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(262,72%,52%)] via-[hsl(272,68%,48%)] to-[hsl(240,70%,46%)] px-6 py-12 text-center sm:px-12">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to test yourself?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/75">
            Jump into the library and take your first timed exam. Your score and full answer review
            are ready the moment you submit.
          </p>
          <Link href={isSignedIn ? "/quizzes" : "/sign-up"} className="relative mt-7 inline-block">
            <Button
              size="lg"
              className="h-12 rounded-full bg-white px-8 text-sm font-bold text-[hsl(262,72%,42%)] hover:bg-white/90"
            >
              {isSignedIn ? "Browse quizzes" : "Start for free"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <QuizmiWordmark size={26} />
          <p className="text-xs text-muted-foreground">
            Quizmi · Practice tests and computer-based examinations
          </p>
          <div className="flex items-center gap-5 text-xs font-semibold text-muted-foreground">
            <Link href="/quizzes" className="hover:text-foreground">
              Quizzes
            </Link>
            <Link href="/sign-in" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
