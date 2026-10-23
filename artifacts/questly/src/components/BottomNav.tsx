"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, History, User } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/quizzes", label: "Quizzes", icon: Library },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <tab.icon
                className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className={`text-[11px] font-semibold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
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
