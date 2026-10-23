"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Bookmark, BookOpen, Clock, House, UserRound } from "lucide-react";

/**
 * Mobile navigation.
 *
 * Lumio keeps its only navigation in a single, full-width bar anchored to the
 * viewport edge (`sticky top-0` with a hairline border). The mobile tab bar
 * copies that construction at the bottom: `fixed inset-x-0 bottom-0`, full
 * width, solid background, one hairline border, and no transforms, margins or
 * height changes of its own — so scrolling content can never make it drift.
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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background md:hidden"
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
