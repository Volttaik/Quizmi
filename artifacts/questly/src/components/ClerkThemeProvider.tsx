"use client";

import { useEffect, useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "@/components/ThemeProvider";

const SHARED = {
  variables: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.875rem",
    colorPrimary: "#5b4bff",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "w-full max-w-[440px] overflow-hidden rounded-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footerAction: "rounded-b-2xl",
    formButtonPrimary:
      "!bg-[#5b4bff] hover:!bg-[#4a3ae0] rounded-xl font-semibold normal-case shadow-none",
    formFieldInput: "rounded-xl",
    socialButtonsBlockButton: "rounded-xl",
    headerTitle: "font-bold tracking-tight",
  },
};

const LIGHT = {
  ...SHARED,
  variables: {
    ...SHARED.variables,
    colorForeground: "#241f33",
    colorMutedForeground: "#6b6478",
    colorDanger: "#d92d4b",
    colorBackground: "#ffffff",
    colorInput: "#f6f4f0",
    colorInputForeground: "#241f33",
    colorNeutral: "#e6e1d9",
  },
};

const DARK = {
  ...SHARED,
  baseTheme: dark,
  variables: {
    ...SHARED.variables,
    colorPrimary: "#8b7dff",
    colorForeground: "#f4f2f8",
    colorMutedForeground: "#a79fb8",
    colorDanger: "#f2778c",
    colorBackground: "#1c1927",
    colorInput: "#262233",
    colorInputForeground: "#f4f2f8",
    colorNeutral: "#332e42",
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
