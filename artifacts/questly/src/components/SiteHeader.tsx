"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { Bookmark, BookOpen, Clock, LayoutDashboard, LogOut, UserRound } from "lucide-react";

import Avatar from "@/components/Avatar";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/my-courses", label: "My courses", icon: Bookmark, authOnly: true },
  { href: "/history", label: "History", icon: Clock, authOnly: true },
];

/**
 * Lumio-style sticky header: brand on the left, the section links in the
 * middle, and the account in a single avatar menu on the right.
 *
 * There is no hamburger. Primary navigation lives in the bottom bar, and the
 * avatar menu still carries every account destination (dashboard, library,
 * profile, sign out), so removing the drawer leaves nothing unreachable.
 */
export default function SiteHeader() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);

  const links = NAV.filter((link) => !link.authOnly || isSignedIn);
  const displayName = user?.fullName ?? user?.firstName ?? user?.username ?? "Your account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/history" && pathname.startsWith("/results"));

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={isSignedIn ? "/dashboard" : "/"}
          aria-label="QUIZMI home"
          className="shrink-0 rounded-[5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!isLoaded ? (
            <span className="h-[38px] w-[38px] rounded-full bg-muted" aria-hidden />
          ) : isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full transition-opacity hover:opacity-90 focus-visible:opacity-90"
                  aria-label="Open profile menu"
                >
                  <Avatar
                    name={displayName}
                    src={user?.imageUrl}
                    size={38}
                    className="ring-1 ring-border"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex items-center gap-3 py-2">
                  <Avatar name={displayName} src={user?.imageUrl} size={36} />
                  <span className="min-w-0">
                    <p className="truncate font-semibold">{displayName}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/my-courses")}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  My courses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <UserRound className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
