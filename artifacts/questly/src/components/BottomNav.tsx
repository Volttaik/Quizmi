"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Bookmark, BookOpen, Clock, House, UserRound } from "lucide-react";

/**
 * Mobile navigation.
 *
 * Lumio keeps its only navigation in a single, full-width bar anchored to the
 * viewport edge. The mobile tab bar copies that construction at the bottom,
 * and is `sticky bottom-0` rather than `fixed`: it sits in flow as the last
 * child of the shell's flex column and pins itself to the viewport bottom
 * while scrolling. Sticky anchoring is re-applied by the browser on every
 * scroll frame, so unlike a fixed bar it never lags or drifts when the mobile
 * viewport resizes (URL bar hide/show) as the page bottom is reached — the
 * glitch reported on the dashboard's long scroll.
 *
 * Safe-area padding lives on an inner wrapper and the shell reserves exactly
 * the same height, so the bar can never cover a button or an answer option.
 */
const TABS = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/my-courses", label: "Library", icon: Bookmark },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/history", label: "History", icon: Clock },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname() ?? "";
  const { isLoaded, isSignedIn } = useUser();

  // Primary navigation is for signed-in learners; public pages keep the
  // header actions instead of offering links to private screens.
  if (!isLoaded || !isSignedIn) return null;

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="sticky bottom-0 z-50 border-t border-border/60 bg-background md:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-md items-center justify-around px-2">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href ||
            pathname.startsWith(`${tab.href}/`) ||
            (tab.href === "/history" && pathname.startsWith("/results"));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-full transition-colors ${
                active ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10.5px] font-semibold leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
