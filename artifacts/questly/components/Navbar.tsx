"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { QuestlyWordmark } from "@/components/QuestlyLogo";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function Navbar({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const isDark = variant === "dark";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 ${
        isDark ? "bg-[hsl(222,47%,6%)]/80" : "bg-background/80"
      } backdrop-blur-xl border-b border-white/[0.06]`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <QuestlyWordmark variant={isDark ? "dark" : "light"} />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "How it Works", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className={`text-sm font-medium ${
                isDark
                  ? "text-white/50 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
              } transition-colors`}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <SignedOut>
            <Link href="/sign-in">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-xl ${isDark ? "text-white/70 hover:text-white hover:bg-white/5" : ""}`}
              >
                Log in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="rounded-xl px-5">
                Get Started
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button size="sm" className="rounded-xl px-5">
                Dashboard
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? (
            <X className={`w-5 h-5 ${isDark ? "text-white" : ""}`} />
          ) : (
            <Menu className={`w-5 h-5 ${isDark ? "text-white" : ""}`} />
          )}
        </button>
      </div>

      {open && (
        <div
          className={`md:hidden ${
            isDark ? "bg-[hsl(222,47%,6%)]" : "bg-background"
          } border-t border-white/[0.06] p-4 space-y-3`}
        >
          {["Features", "How it Works", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className={`block text-sm font-medium py-2 ${
                isDark ? "text-white/60" : "text-muted-foreground"
              }`}
            >
              {item}
            </a>
          ))}
          <SignedOut>
            <div className="flex gap-2 pt-2">
              <Link href="/sign-in" className="flex-1">
                <Button variant="outline" className="w-full rounded-xl" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/sign-up" className="flex-1">
                <Button className="w-full rounded-xl" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="block">
              <Button className="w-full rounded-xl" size="sm">
                Dashboard
              </Button>
            </Link>
          </SignedIn>
        </div>
      )}
    </nav>
  );
}
