"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import { useClerk, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const isDark = variant === "dark";
  const { signOut } = useClerk();
  const { user, isLoaded, isSignedIn } = useUser();

  const textMuted = isDark ? "text-white/50 hover:text-white" : "text-muted-foreground hover:text-foreground";
  const ghostBtn = isDark
    ? "text-white border border-white/20 hover:bg-white/10 hover:text-white hover:border-white/30"
    : "text-foreground hover:bg-muted";

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? "bg-[hsl(222,47%,6%)]/80" : "bg-background/80"} backdrop-blur-xl border-b border-white/[0.06]`}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <QuizmiWordmark variant={isDark ? "dark" : "light"} />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <a key={item.label} href={item.href} className={`text-sm font-medium transition-colors ${textMuted}`}>
              {item.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {!isLoaded ? (
            <div className="w-20 h-8 rounded-xl bg-white/10 animate-pulse" />
          ) : isSignedIn ? (
            <>
              <Link href="/dashboard">
                <Button size="sm" className="rounded-xl px-5 font-semibold shadow-lg shadow-primary/25 gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ redirectUrl: "/" })}
                className={`rounded-xl font-semibold gap-1.5 ${isDark ? "text-white/60 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className={`rounded-xl font-semibold ${ghostBtn}`}>
                  Log in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="rounded-xl px-5 font-semibold shadow-lg shadow-primary/25">
                  Get Started →
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className={`w-5 h-5 ${isDark ? "text-white" : ""}`} /> : <Menu className={`w-5 h-5 ${isDark ? "text-white" : ""}`} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={`md:hidden overflow-hidden ${isDark ? "bg-[hsl(222,47%,6%)]" : "bg-background"} border-t border-white/[0.06]`}
          >
            <div className="p-4 space-y-3">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block text-sm font-medium py-2 ${isDark ? "text-white/60" : "text-muted-foreground"}`}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex gap-2 pt-2">
                {isSignedIn ? (
                  <>
                    <Link href="/dashboard" className="flex-1" onClick={() => setOpen(false)}>
                      <Button className="w-full rounded-xl text-sm font-semibold gap-2" size="sm">
                        <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { signOut({ redirectUrl: "/" }); setOpen(false); }}
                      className={`flex-1 rounded-xl text-sm font-semibold ${isDark ? "border-white/20 text-white bg-transparent hover:bg-white/10" : ""}`}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/sign-in" className="flex-1" onClick={() => setOpen(false)}>
                      <Button variant="outline" className={`w-full rounded-xl text-sm font-semibold ${isDark ? "border-white/20 text-white bg-transparent hover:bg-white/10" : ""}`} size="sm">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/sign-up" className="flex-1" onClick={() => setOpen(false)}>
                      <Button className="w-full rounded-xl text-sm font-semibold" size="sm">
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
