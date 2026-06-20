"use client";
import { Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

interface Props {
  name?: string;
}

export default function DashboardHeader({ name }: Props) {
  const { user } = useUser();
  const displayName = name ?? user?.firstName ?? "Learner";
  const initials = displayName.charAt(0).toUpperCase();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg shadow-black/20 dark:shadow-black/40 flex-shrink-0">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-base font-extrabold"
              style={{ background: "linear-gradient(135deg, hsl(262,72%,55%), hsl(275,72%,38%))" }}
            >
              {initials}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-white/55 font-medium leading-none mb-0.5">Good {getGreeting()} 🌟</p>
          <h1 className="text-lg font-extrabold text-white leading-tight">
            Hi, {displayName}!
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
        <button
          onClick={() => toast.info("No new notifications", { description: "You're all caught up!" })}
          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[hsl(30,90%,55%)] border border-white/30" />
        </button>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
