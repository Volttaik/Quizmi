"use client";

import { Button, Tooltip } from "@heroui/react";
import { Moon, Sun } from "@gravity-ui/icons";
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
    <Tooltip delay={600}>
      <Button
        variant="ghost"
        isIconOnly
        onPress={toggle}
        aria-label="Toggle colour theme"
        className={`h-9 w-9 rounded-full text-muted-foreground ${className}`}
      >
        <Moon className="h-[17px] w-[17px] dark:hidden" />
        <Sun className="hidden h-[17px] w-[17px] dark:block" />
      </Button>
      <Tooltip.Content>Switch theme</Tooltip.Content>
    </Tooltip>
  );
}
