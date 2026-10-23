import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { QuizmiWordmark } from "@/components/QuizmiLogo";

const POINTS = [
  "Course-based CBT assessments with real questions",
  "Choose your question count and timer before you start",
  "Instant scoring, answer review and saved progress",
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="brand-gradient relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/15"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-white/10"
        />

        <Link href="/" className="relative w-fit rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
          <QuizmiWordmark variant="dark" size={30} />
        </Link>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white">
            Your courses.
            <br />
            Real exam practice.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            A focused CBT workspace: choose a course, set your question count and timer, and get a
            detailed report on every attempt.
          </p>

          <ul className="mt-8 space-y-3">
            {POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm text-white/90"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-white" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/70">
          QUIZMI · Course-based computer-based testing
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10 lg:min-h-0">
        <Link href="/" className="lg:hidden">
          <QuizmiWordmark size={28} />
        </Link>

        <div className="w-full max-w-md">{children}</div>

        <Link
          href="/courses"
          className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Browse the course catalogue first
        </Link>
      </main>
    </div>
  );
}
