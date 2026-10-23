"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { Avatar, Button, Dropdown, Label } from "@heroui/react";
import {
  ArrowRightFromSquare,
  BookOpen,
  Bookmark,
  Clock,
  Gear,
  House,
  Person,
} from "@gravity-ui/icons";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import ThemeToggle from "@/components/ThemeToggle";
import ButtonLink from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/my-courses", label: "My courses", icon: Bookmark, authOnly: true },
  { href: "/history", label: "History", icon: Clock, authOnly: true },
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
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();

  const links = LINKS.filter((link) => !link.authOnly || isSignedIn);
  const displayName = user?.fullName ?? user?.firstName ?? user?.username ?? "Your account";
  const initials = initialsFor(displayName) || "Q";

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/history" && pathname.startsWith("/results")) ||
    (href === "/profile" && pathname.startsWith("/settings"));

  return (
    <header className="sticky top-0 z-40 surface-glass hairline">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href={isSignedIn ? "/dashboard" : "/"}
          aria-label="QUIZIMI home"
          className="flex-shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
        >
          <QuizmiWordmark size={30} />
        </Link>

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-0.5 md:flex">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-3.5 -bottom-[3px] h-[2px] rounded-full transition-all duration-200",
                    active ? "bg-accent opacity-100" : "opacity-0",
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />

          {!isLoaded ? (
            <div className="flex items-center gap-2" aria-hidden>
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="hidden h-3 w-20 rounded bg-muted sm:block" />
            </div>
          ) : isSignedIn ? (
            <Dropdown>
              <Button
                variant="ghost"
                isIconOnly
                aria-label={`${displayName} — open account menu`}
                className="h-10 w-10 rounded-full p-0"
              >
                <Avatar className="h-9 w-9">
                  {user?.imageUrl ? (
                    <Avatar.Image alt="" src={user.imageUrl} />
                  ) : null}
                  <Avatar.Fallback className="text-[11px] font-bold">{initials}</Avatar.Fallback>
                </Avatar>
              </Button>
              <Dropdown.Popover placement="bottom end" className="min-w-56">
                <div className="border-b border-border/70 px-3 pb-2.5 pt-1">
                  <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress ?? "Signed in"}
                  </p>
                </div>
                <Dropdown.Menu
                  onAction={(key) => {
                    if (key === "sign-out") {
                      void signOut({ redirectUrl: "/" });
                      return;
                    }
                    const target = String(key);
                    if (target.startsWith("/")) {
                      router.push(target);
                    }
                  }}
                >
                  <Dropdown.Item id="/dashboard" textValue="Dashboard">
                    <House className="h-4 w-4 text-muted-foreground" />
                    <Label>Dashboard</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="/my-courses" textValue="My courses">
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                    <Label>My courses</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="/profile" textValue="Profile">
                    <Person className="h-4 w-4 text-muted-foreground" />
                    <Label>Profile</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="/settings/account" textValue="Settings">
                    <Gear className="h-4 w-4 text-muted-foreground" />
                    <Label>Settings</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="sign-out" textValue="Sign out" variant="danger">
                    <ArrowRightFromSquare className="h-4 w-4" />
                    <Label>Sign out</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden rounded-full px-3 py-2 text-[13.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Sign in
              </Link>
              <ButtonLink href="/sign-up" size="sm" className="rounded-full px-4">
                Get started
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
