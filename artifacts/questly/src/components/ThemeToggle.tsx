"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    const root = document.documentElement;
    const isDark =
      root.classList.contains("dark") ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle colour theme"
      className={`flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className}`}
    >
      <Moon className="h-[17px] w-[17px] dark:hidden" />
      <Sun className="hidden h-[17px] w-[17px] dark:block" />
    </button>
  );
}
