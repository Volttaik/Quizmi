"use client";

import { useEffect, useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "@/components/ThemeProvider";

const SHARED = {
  variables: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.875rem",
    colorPrimary: "#7c3aed",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "w-full max-w-[440px] overflow-hidden rounded-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footerAction: "rounded-b-2xl",
    formButtonPrimary:
      "!bg-[#7c3aed] hover:!bg-[#6d28d9] rounded-xl font-semibold normal-case shadow-none",
    formFieldInput: "rounded-xl",
    socialButtonsBlockButton: "rounded-xl",
    headerTitle: "font-bold tracking-tight",
  },
};

const LIGHT = {
  ...SHARED,
  variables: {
    ...SHARED.variables,
    colorForeground: "#1c1235",
    colorMutedForeground: "#5f5573",
    colorDanger: "#c4233c",
    colorBackground: "#ffffff",
    colorInput: "#f6f4fc",
    colorInputForeground: "#1c1235",
    colorNeutral: "#e6e1f2",
  },
};

const DARK = {
  ...SHARED,
  baseTheme: dark,
  variables: {
    ...SHARED.variables,
    colorPrimary: "#a78bfa",
    colorForeground: "#f2effb",
    colorMutedForeground: "#b0a6c9",
    colorDanger: "#f27a90",
    colorBackground: "#141021",
    colorInput: "#1f1a30",
    colorInputForeground: "#f2effb",
    colorNeutral: "#2d2740",
  },
};

export default function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = () =>
      setIsDark(theme === "dark" || (theme === "system" && query.matches));

    resolve();
    query.addEventListener("change", resolve);
    return () => query.removeEventListener("change", resolve);
  }, [theme]);

  return (
    <ClerkProvider
      appearance={isDark ? DARK : LIGHT}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}
