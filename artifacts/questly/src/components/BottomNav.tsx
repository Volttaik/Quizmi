"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Bookmark, Clock, BookOpen, House, Person } from "@gravity-ui/icons";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/my-courses", label: "Library", icon: Bookmark },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/history", label: "History", icon: Clock },
  { href: "/profile", label: "Profile", icon: Person },
];

export default function BottomNav() {
  const pathname = usePathname() ?? "";
  const { isLoaded, isSignedIn } = useUser();

  // Primary navigation is for signed-in learners; public pages keep the
  // compact header actions instead of offering links to private screens.
  if (!isLoaded || !isSignedIn) return null;

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-stretch gap-0.5 rounded-[1.6rem] border border-border/80 bg-surface/92 p-1.5 shadow-[0_16px_40px_-16px_rgba(20,16,40,0.35)] backdrop-blur-xl dark:shadow-[0_18px_44px_-14px_rgba(0,0,0,0.75)]">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href ||
            pathname.startsWith(`${tab.href}/`) ||
            (tab.href === "/history" && pathname.startsWith("/results")) ||
            (tab.href === "/profile" && pathname.startsWith("/settings"));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-[1.2rem] px-0.5 py-1.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40",
                active ? "bg-accent-soft text-accent-soft-foreground" : "text-muted-foreground",
              )}
            >
              <tab.icon
                className={cn(
                  "h-[19px] w-[19px] transition-transform duration-200",
                  active ? "scale-105" : "group-hover:scale-105",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none tracking-tight",
                  active ? "text-accent-soft-foreground" : "text-muted-foreground",
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
