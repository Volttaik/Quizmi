"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export default function AppToaster() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));

    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      position="bottom-center"
      richColors
      theme={isDark ? "dark" : "light"}
      toastOptions={{
        style: {
          background: "var(--surface)",
          color: "var(--surface-foreground)",
          border: "1px solid var(--border)",
          borderRadius: "0.875rem",
        },
        classNames: {
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
