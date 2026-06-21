"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWAButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isInstalled) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="rounded-full px-6 text-xs font-semibold text-white/60 bg-white/5 border border-white/15 gap-2 cursor-default"
      >
        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
        App Installed
      </Button>
    );
  }

  if (!installPrompt) return null;

  const handleInstall = async () => {
    if (!installPrompt) return;
    setIsInstalling(true);
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
    setIsInstalling(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      disabled={isInstalling}
      className="rounded-full px-6 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 gap-2 transition-all"
    >
      <Download className="w-3.5 h-3.5" />
      {isInstalling ? "Installing…" : "Install App"}
    </Button>
  );
}
