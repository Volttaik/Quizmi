"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, Sparkles, BookMarked, User } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: GraduationCap, label: "Quizzes", path: "/quizzes" },
  { icon: Sparkles, label: "AI", path: "/summary", center: true },
  { icon: BookMarked, label: "Cards", path: "/flashcards" },
  { icon: User, label: "Profile", path: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-bottom-nav dark:shadow-[0_-4px_32px_rgba(0,0,0,0.55)]">
      <div className="max-w-lg mx-auto flex items-end justify-around px-2 pt-1.5 pb-safe pb-3">
        {tabs.map(({ icon: Icon, label, path, center }) => {
          const active = (pathname ?? "") === path || (pathname ?? "").startsWith(path + "/");

          if (center) {
            return (
              <Link key={label} href={path} className="flex flex-col items-center -mt-5">
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(262,72%,58%)] to-[hsl(275,72%,42%)] flex items-center justify-center shadow-glow-primary mb-0.5"
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-[10px] font-bold text-primary">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={label}
              href={path}
              className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors relative ${
                  active ? "bg-primary/12" : ""
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 transition-all ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={active ? 2.2 : 1.8}
                />
              </motion.div>
              <span className={`text-[10px] font-semibold transition-colors ${active ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute top-0.5 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
