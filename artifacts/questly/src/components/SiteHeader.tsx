"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { BookMarked, LayoutDashboard, Library, History } from "lucide-react";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/courses", label: "Courses", icon: Library },
  { href: "/my-courses", label: "My courses", icon: BookMarked, authOnly: true },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, authOnly: true },
  { href: "/history", label: "History", icon: History, authOnly: true },
];

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function SiteHeader() {
  const pathname = usePathname() ?? "";
  const { isLoaded, isSignedIn, user } = useUser();

  const links = LINKS.filter((link) => !link.authOnly || isSignedIn);
  const displayName = user?.fullName ?? user?.firstName ?? user?.username ?? "Account";
  const initials = initialsFor(displayName) || "U";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
        <Link
          href={isSignedIn ? "/dashboard" : "/"}
          aria-label="QUIZIMI home"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <QuizmiWordmark size={26} />
        </Link>

        <nav aria-label="Primary" className="ml-3 hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(`${link.href}/`) ||
              (link.href === "/history" && pathname.startsWith("/results"));
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          <ThemeToggle />

          {!isLoaded ? (
            <div className="flex items-center gap-2" aria-hidden>
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="hidden h-3 w-20 rounded bg-muted sm:block" />
            </div>
          ) : isSignedIn ? (
            <Link
              href="/profile"
              aria-label={`${displayName} — open profile`}
              className="flex min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:pr-3"
            >
              <span className="hidden max-w-[9rem] truncate text-sm font-semibold text-foreground sm:block">
                {displayName}
              </span>
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent text-[11px] font-extrabold text-accent-foreground">
                {user?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="rounded-lg font-semibold">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="rounded-lg font-semibold">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
