"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { BookMarked, Home, Library, History, User } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/my-courses", label: "My Courses", icon: BookMarked },
  { href: "/courses", label: "Courses", icon: Library },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] md:hidden dark:shadow-[0_-4px_16px_rgba(0,0,0,0.35)]"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1.5">
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
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <tab.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.9} />
              </span>
              <span
                className={`whitespace-nowrap text-[10px] font-semibold leading-none transition-colors sm:text-[10.5px] ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
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
