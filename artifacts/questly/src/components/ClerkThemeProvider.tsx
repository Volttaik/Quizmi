"use client";

import { useEffect, useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "@/components/ThemeProvider";

const SHARED = {
  variables: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.75rem",
    colorPrimary: "hsl(262, 72%, 55%)",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "w-full max-w-[440px] overflow-hidden rounded-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footerAction: "rounded-b-2xl",
    formButtonPrimary:
      "!bg-[hsl(262,72%,55%)] hover:!bg-[hsl(262,72%,48%)] rounded-xl font-semibold normal-case",
    formFieldInput: "rounded-xl",
    socialButtonsBlockButton: "rounded-xl",
    headerTitle: "font-extrabold",
  },
};

const LIGHT = {
  ...SHARED,
  variables: {
    ...SHARED.variables,
    colorForeground: "hsl(222, 47%, 11%)",
    colorMutedForeground: "hsl(220, 12%, 44%)",
    colorDanger: "hsl(0, 72%, 51%)",
    colorBackground: "hsl(0, 0%, 100%)",
    colorInput: "hsl(220, 18%, 96%)",
    colorInputForeground: "hsl(222, 47%, 11%)",
    colorNeutral: "hsl(220, 18% 90%)",
  },
};

const DARK = {
  ...SHARED,
  baseTheme: dark,
  variables: {
    ...SHARED.variables,
    colorPrimary: "hsl(262, 72%, 62%)",
    colorForeground: "hsl(220, 20%, 95%)",
    colorMutedForeground: "hsl(220, 12%, 62%)",
    colorDanger: "hsl(0, 68%, 60%)",
    colorBackground: "hsl(222, 34%, 10%)",
    colorInput: "hsl(222, 26%, 15%)",
    colorInputForeground: "hsl(220, 20%, 95%)",
    colorNeutral: "hsl(222, 26%, 20%)",
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
