"use client";
import { Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface Props {
  name?: string;
  scrolled?: boolean;
  unreadCount?: number;
}

export default function DashboardHeader({ name, scrolled = false, unreadCount = 0 }: Props) {
  const { user } = useUser();
  const displayName = name ?? user?.firstName ?? "Learner";
  const initials = displayName.charAt(0).toUpperCase();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const textColor = scrolled ? "text-foreground" : "text-white";
  const subTextColor = scrolled ? "text-muted-foreground" : "text-white/55";
  const iconColor = scrolled ? "text-foreground" : "text-white";

  return (
    <div className="flex items-center justify-between">
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
          <p className={`text-xs font-medium leading-none mb-0.5 transition-colors duration-300 ${subTextColor}`}>
            Good {getGreeting()}
          </p>
          <h1 className={`text-lg font-extrabold leading-tight transition-colors duration-300 ${textColor}`}>
            Hi, {displayName}!
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${iconColor}`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
        <button
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 relative ${iconColor}`}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[hsl(30,90%,55%)]" />
          )}
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
