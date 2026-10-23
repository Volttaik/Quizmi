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
          background: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          border: "1px solid hsl(var(--border))",
        },
        classNames: {
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
