import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import { useClerk, useUser, Show } from "@clerk/react";

export default function Navbar({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const isDark = variant === "dark";
  const { signOut } = useClerk();
  const { user } = useUser();

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 ${
        isDark ? "bg-[hsl(222,47%,6%)]/80" : "bg-background/80"
      } backdrop-blur-xl border-b border-white/[0.06]`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/">
          <QuizmiWordmark variant={isDark ? "dark" : "light"} />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features", href: "#features" },
            { label: "How it Works", href: "#how-it-works" },
            { label: "Pricing", href: "#pricing" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                isDark
                  ? "text-white/50 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Show when="signed-out">
            <Link to="/sign-in">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-xl font-semibold ${
                  isDark
                    ? "text-white border border-white/20 hover:bg-white/10 hover:text-white hover:border-white/30"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                Log in
              </Button>
            </Link>
            <Link to="/sign-up">
              <Button size="sm" className="rounded-xl px-5 font-semibold shadow-lg shadow-primary/25">
                Get Started
              </Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link to="/demo">
              <Button size="sm" className="rounded-xl px-5 font-semibold shadow-lg shadow-primary/25">
                Dashboard
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
              className={`rounded-xl font-semibold gap-1.5 ${
                isDark
                  ? "text-white/60 hover:text-white hover:bg-white/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </Button>
          </Show>
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
          {[
            { label: "Features", href: "#features" },
            { label: "How it Works", href: "#how-it-works" },
            { label: "Pricing", href: "#pricing" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block text-sm font-medium py-2 ${
                isDark ? "text-white/60" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="flex gap-2 pt-2">
            <Show when="signed-out">
              <Link to="/sign-in" className="flex-1" onClick={() => setOpen(false)}>
                <Button
                  variant="outline"
                  className={`w-full rounded-xl text-sm font-semibold ${isDark ? "border-white/20 text-white bg-transparent hover:bg-white/10" : ""}`}
                  size="sm"
                >
                  Log in
                </Button>
              </Link>
              <Link to="/sign-up" className="flex-1" onClick={() => setOpen(false)}>
                <Button className="w-full rounded-xl text-sm font-semibold" size="sm">
                  Get Started
                </Button>
              </Link>
            </Show>
            <Show when="signed-in">
              <Link to="/demo" className="flex-1" onClick={() => setOpen(false)}>
                <Button className="w-full rounded-xl text-sm font-semibold" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                className={`flex-1 rounded-xl text-sm font-semibold ${isDark ? "border-white/20 text-white bg-transparent hover:bg-white/10" : ""}`}
              >
                Sign out
              </Button>
            </Show>
          </div>
        </div>
      )}
    </nav>
  );
}
