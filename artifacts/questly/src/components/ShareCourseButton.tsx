"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { courseShareUrl } from "@/lib/share";

type Props = {
  slug: string;
  title: string;
  /** "icon" fits cards and toolbars; "button" is a labelled action. */
  variant?: "icon" | "button";
  className?: string;
};

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context — fall through to the legacy path.
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copies (or natively shares) a stable public course link.
 *
 * The link opens the course page as a visitor, so it never exposes quiz
 * answers or protected content — the page still enforces the purchase check.
 */
export default function ShareCourseButton({ slug, title, variant = "icon", className }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(timer);
  }, [copied]);

  const share = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const url = courseShareUrl(slug);
      const shareData = {
        title: `${title} · QUIZMI`,
        text: `Practise ${title} with real CBT questions on QUIZMI.`,
        url,
      };

      const canNativeShare =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        // Native share is a mobile affordance; avoid hijacking desktop clicks.
        (navigator.maxTouchPoints ?? 0) > 0;

      if (canNativeShare) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          // A dismissed sheet is not an error worth reporting; anything else
          // falls back to copying so the action still completes.
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }

      const ok = await copyText(url);
      if (ok) {
        setCopied(true);
        toast.success("Course link copied", { description: url });
      } else {
        toast.error("Couldn't copy the link", {
          description: "Copy it from the address bar of the course page instead.",
        });
      }
    },
    [slug, title]
  );

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={share}
        aria-label={`Share ${title}`}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted ${className ?? ""}`}
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Link copied" : "Share"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Share ${title}`}
      title="Copy a shareable link"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/95 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground ${className ?? ""}`}
    >
      {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
    </button>
  );
}
