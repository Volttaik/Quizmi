"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Clock,
  Flame,
  LayoutDashboard,
  Search,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";

import Avatar from "@/components/Avatar";
import CourseCard from "@/components/CourseCard";
import { Reveal } from "@/components/Motion";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import { attemptStatusMeta } from "@/lib/attempt-status";
import { useSessionRequest } from "@/lib/use-session-request";
import type { DashboardData } from "@/lib/types";

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="dotted-edge dotted-edge-sm rounded-[5px] border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <p className="mt-2.5 font-serif text-xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const sessionFetch = useSessionRequest();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exploreQuery, setExploreQuery] = useState("");

  useEffect(() => {
    let active = true;

    sessionFetch("/api/dashboard", { cache: "no-store" })
      .then(async (outcome) => {
        if (!outcome.ok) {
          if (outcome.failure === "unauthenticated") {
            router.replace("/sign-in?redirect_url=/dashboard");
            return null;
          }
          // A connection or Clerk problem is retryable, never a sign-out.
          throw new Error("We couldn't load your dashboard just now. Try again in a moment.");
        }
        if (!outcome.response.ok) throw new Error("Could not load your dashboard");
        return (await outcome.response.json()) as DashboardData;
      })
      .then((payload) => {
        if (active && payload) setData(payload);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load your dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router, sessionFetch]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="skeleton h-14 w-64" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="skeleton h-80 lg:col-span-2" />
          <div className="skeleton h-80" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-destructive/10 text-destructive">
          <LayoutDashboard className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold sm:text-2xl">
          We couldn&apos;t load your dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-6 h-11 px-6" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </main>
    );
  }

  if (!data) return null;

  const firstName = data.user.name?.split(" ")[0] ?? "";
  const hasActivity = data.stats.completedAttempts > 0;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const featured = data.purchasedCourses[0] ?? data.recommended[0];
  const courseHref = featured ? `/courses/${featured.slug}` : "/courses";

  const explore = (event: React.FormEvent) => {
    event.preventDefault();
    const query = exploreQuery.trim();
    router.push(query ? `/courses?q=${encodeURIComponent(query)}` : "/courses");
  };

  return (
    // overflow-x-clip matches the homepage's guard: a miscalculated child can
    // never paint past this container toward the viewport edge and drag the
    // sticky header/bottom bar out of visual alignment.
    <main className="mx-auto max-w-6xl overflow-x-clip px-4 py-10 sm:px-6">
      <Reveal className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Avatar name={data.user.name || "You"} src={data.user.avatarUrl} size={52} className="ring-1 ring-border" />
          <div>
            <p className="text-sm text-muted-foreground">{greet},</p>
            <h1 className="text-xl font-semibold sm:text-2xl">{firstName || "there"}</h1>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="h-9 px-4">
          <Link href="/profile">
            <UserRound className="mr-1.5 h-4 w-4" />
            Profile
          </Link>
        </Button>
      </Reveal>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {featured && (
          <Reveal className="min-w-0 lg:col-span-2">
            <CourseCard course={featured} />
          </Reveal>
        )}
        <div className="grid min-w-0 grid-cols-2 gap-4 lg:grid-cols-1">
          <Stat icon={Target} label="Average accuracy" value={`${data.stats.averagePercentage}%`} />
          <Stat icon={Trophy} label="Graded attempts" value={String(data.stats.completedAttempts)} />
          <Stat
            icon={Flame}
            label={hasActivity ? "Personal best" : "Pass rate"}
            value={hasActivity ? `${data.stats.bestPercentage}%` : `${data.stats.passRate}%`}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Reveal className="dotted-edge min-w-0 rounded-[5px] border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent sessions</h2>
            {hasActivity && (
              <Button asChild size="sm">
                <Link href="/history">History</Link>
              </Button>
            )}
          </div>

          {data.recentResults.length === 0 ? (
            <div className="mt-5 rounded-[5px] border-2 border-dashed border-border p-6 text-center">
              <p className="text-sm font-semibold">No sessions yet</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                Your first quiz is one click away. Pick a few questions and see how you do.
              </p>
              <Button asChild className="mt-4">
                <Link href={courseHref}>Start your first quiz</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.recentResults.slice(0, 5).map((result) => (
                <li key={result.attemptId}>
                  <Link
                    href={
                      result.status === "in_progress"
                        ? `/exam/${result.attemptId}`
                        : `/results/${result.attemptId}`
                    }
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{result.courseTitle}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {result.hasResult
                          ? `${attemptStatusMeta(result.status).label} · ${formatRelative(
                              result.submittedAt
                            )}`
                          : `${attemptStatusMeta(result.status).label} · ${result.answeredCount}/${result.totalQuestions} answered`}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 font-serif text-lg font-semibold">
                      {result.hasResult ? (
                        <>
                          {result.score}/{result.totalMarks}
                        </>
                      ) : (
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {result.status === "in_progress" ? "Resume" : "No score"}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <Reveal delay={0.05} className="dotted-edge min-w-0 rounded-[5px] border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">By subject</h2>
          {data.subjectPerformance.length === 0 ? (
            <div className="mt-5 rounded-[5px] border-2 border-dashed border-border p-6 text-center">
              <Target className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold">Progress starts with a result</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                Complete an assessment and your average score by subject appears here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {data.subjectPerformance.map((subject) => (
                <div key={subject.subject}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">{subject.subject}</span>
                    <span className="text-xs text-muted-foreground">
                      {subject.averagePercentage}% · {subject.attempts} attempt
                      {subject.attempts === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.min(100, subject.averagePercentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Explore something new</h2>
            <p className="text-sm text-muted-foreground">
              Search the full catalogue by course name or code.
            </p>
          </div>
          <Link href="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>

        <form onSubmit={explore} role="search" className="mt-4 flex max-w-xl flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={exploreQuery}
              onChange={(event) => setExploreQuery(event.target.value)}
              aria-label="Search the catalogue"
              placeholder="Course name or code"
              className="h-11 w-full rounded-[5px] border border-input bg-card pl-10 pr-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
            />
          </div>
          <Button type="submit" className="h-11 px-5">
            Search
          </Button>
        </form>

        {data.recommended.length === 0 ? (
          <p className="mt-5 rounded-[5px] border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Every published course is already in your library, or the catalogue is empty.
          </p>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {data.recommended.slice(0, 2).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 flex items-center gap-3 rounded-[5px] bg-muted px-5 py-4 text-xs text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0" />
        Leaving an unfinished assessment ends it. Starting again begins at the first question with a
        fresh timer.
      </p>
    </main>
  );
}
