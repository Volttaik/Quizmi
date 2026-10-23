"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { LayoutDashboard, Library, History, LogOut } from "lucide-react";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/quizzes", label: "Quizzes", icon: Library },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, authOnly: true },
  { href: "/history", label: "History", icon: History, authOnly: true },
];

export default function SiteHeader() {
  const pathname = usePathname() ?? "";
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const links = LINKS.filter((link) => !link.authOnly || isSignedIn);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        <Link href={isSignedIn ? "/dashboard" : "/"} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
          <QuizmiWordmark size={30} />
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.8} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {!isLoaded ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
          ) : isSignedIn ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ redirectUrl: "/" })}
              className="hidden rounded-full text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="rounded-full font-semibold">
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="rounded-full font-semibold">
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
