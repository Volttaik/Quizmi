import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { QuizmiWordmark } from "@/components/QuizmiLogo";

const POINTS = [
  "Timed exams with server-enforced deadlines",
  "Instant scoring and pass/fail results",
  "Full answer review with explanations",
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[hsl(262,72%,42%)] via-[hsl(272,68%,38%)] to-[hsl(240,65%,30%)] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-black/20 blur-3xl" />

        <Link href="/" className="relative">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl" />
            <span className="text-xl font-extrabold tracking-tight text-white">Quizmi</span>
          </div>
        </Link>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white">
            Practise under
            <br />
            real exam conditions.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            A focused CBT workspace: question navigation, timers, automatic saving and a detailed
            report on every attempt.
          </p>

          <ul className="mt-8 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-white/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/45">
          Practice tests and computer-based examinations
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10 lg:min-h-0">
        <Link href="/" className="lg:hidden">
          <QuizmiWordmark size={28} />
        </Link>

        <div className="w-full max-w-md">{children}</div>

        <Link
          href="/quizzes"
          className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Browse the quiz library first
        </Link>
      </main>
    </div>
  );
}
