"use client";

import { Bell, Sun, Moon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface Props {
  name?: string;
  isDemo?: boolean;
  demoAvatar?: string;
}

export default function DashboardHeader({ name, isDemo, demoAvatar }: Props) {
  const { user } = !isDemo ? useUser() : { user: null };
  const displayName = name ?? user?.firstName ?? user?.username ?? "Learner";
  const initials = displayName.charAt(0).toUpperCase();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full shadow-md shadow-black/10 dark:shadow-black/30 overflow-hidden border-2 border-white/80 dark:border-white/10 flex-shrink-0">
          {isDemo && demoAvatar ? (
            <div
              className="w-full h-full flex items-center justify-center text-white text-base font-extrabold"
              style={{ background: "linear-gradient(135deg, hsl(262,72%,55%), hsl(275,72%,38%))" }}
            >
              {demoAvatar}
            </div>
          ) : user?.imageUrl ? (
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
          <h1 className="text-lg font-extrabold text-white leading-tight">
            Hi, {displayName} 👋
          </h1>
          <p className="text-xs text-white/60 font-medium">Keep learning, keep growing!</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
        <button className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
