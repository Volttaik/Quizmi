import Link from "next/link";
import { publicCourseBySlug } from "@/lib/db";
import QuizmiLogo from "@/components/QuizmiLogo";

export const dynamic = "force-dynamic";

export default async function DemoLanding() {
  const course = await publicCourseBySlug("demo-english-usage");

  if (!course || !course.isPublished) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Demo not available
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The free demo course is not available right now.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <div className="mb-8 flex justify-center">
        <QuizmiLogo size={56} />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Try QUIZIMI for free
      </h1>

      <p className="mt-4 text-lg text-muted-foreground">
        No account required. Open the free demo course below and take a 20-question
        attempt to see how the exam engine feels.
      </p>

      {course && (
        <div className="mt-10 rounded-xl border bg-card p-6 text-left shadow-sm">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring/40 border-transparent bg-primary text-primary-foreground ring-offset-background">
            Free demo
          </span>

          <h2 className="mt-4 text-xl font-semibold text-foreground">
            {course.title}
          </h2>

          {course.description && (
            <p className="mt-2 text-muted-foreground">{course.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">{course.subject}</span>
            <span className="whitespace-nowrap">
              {((course.questionCount ?? 0) > 0) ? `${course.questionCount} questions` : "No questions yet"}
            </span>
            <span className="whitespace-nowrap">
              Pass mark: {course.passScore}%
            </span>
            {course.durationMinutes != null && (
              <span className="whitespace-nowrap">
                Suggested timer: {course.durationMinutes} minutes
              </span>
            )}
          </div>

          <Link
            href={`/courses/${course.slug}`}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring/40"
          >
            Open demo course
          </Link>
        </div>
      )}

      <p className="mt-10 text-sm text-muted-foreground">
        Results from this demo attempt are stored locally for your visit. If you want
        to keep your scores, sign in and take the course from your dashboard.
      </p>
    </main>
  );
}
