"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Check, Copy, Download, Loader2, MessageCircle, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  cardFileName,
  courseUrlFor,
  renderResultCard,
  shareTextFor,
} from "@/lib/share-card";
import type { AttemptResult } from "@/lib/types";

type Busy = "idle" | "rendering" | "sharing";

/**
 * Share My Results: builds a branded achievement graphic from the real stored
 * result, then hands it to the device share sheet when the browser supports
 * sharing files. Where it does not, a fallback sheet offers the image for
 * download, WhatsApp for the message and course link, and a copy option.
 */
export default function ShareResultButton({
  result,
  size = "lg",
  className = "rounded-full",
}: {
  result: AttemptResult;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const [busy, setBusy] = useState<Busy>("idle");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const { user } = useUser();

  // The card is the sharer's own result, so the display name can come from
  // their signed-in account without touching any stored attempt data.
  const userName = user?.fullName ?? user?.username ?? user?.firstName ?? null;

  const courseUrl = courseUrlFor(result.courseSlug);
  const shareText = shareTextFor(result, courseUrl, { userName });

  const buildCard = async (): Promise<Blob> => {
    if (lastBlob) return lastBlob;
    const blob = await renderResultCard(result, { userName });
    setLastBlob(blob);
    return blob;
  };

  const downloadCard = async () => {
    try {
      setBusy("rendering");
      const blob = await buildCard();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = cardFileName(result);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast.success("Result image saved. Attach it in WhatsApp to share the graphic.");
    } catch {
      toast.error("The result image could not be generated. Try again.");
    } finally {
      setBusy("idle");
    }
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener,noreferrer");
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Result and course link copied.");
      setSheetOpen(false);
    } catch {
      toast.error("Could not copy. Select and copy the text manually.");
    }
  };

  const share = async () => {
    if (busy !== "idle") return;

    // Native file sharing (Web Share API level 2) — the graphic attaches
    // directly to WhatsApp, chats and social apps where supported.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        setBusy("rendering");
        const blob = await buildCard();
        const file =
          typeof File !== "undefined"
            ? new File([blob], cardFileName(result), { type: "image/png" })
            : null;

        if (file && navigator.canShare?.({ files: [file] })) {
          setBusy("sharing");
          await navigator.share({
            files: [file],
            title: `My ${result.courseTitle} result`,
            text: shareText,
          });
          setBusy("idle");
          return;
        }

        // Text-only sharing still gets the message and course link across.
        await navigator.share({
          title: `My ${result.courseTitle} result`,
          text: shareText,
        });
        setBusy("idle");
        return;
      } catch (error) {
        setBusy("idle");
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Anything else falls through to the manual sheet.
      }
    }

    setSheetOpen(true);
  };

  return (
    <>
      <Button onClick={() => void share()} disabled={busy !== "idle"} size={size} className={className}>
        {busy !== "idle" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Preparing…
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" /> Share my results
          </>
        )}
      </Button>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setSheetOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Share your result"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-foreground">Share your result</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Your device could not attach the image automatically. Save the graphic, then share
                  it with your message and course link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close share options"
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <Button
                onClick={() => void downloadCard()}
                disabled={busy !== "idle"}
                className="w-full rounded-xl"
              >
                {busy === "rendering" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Save result image
              </Button>
              <Button
                variant="outline"
                onClick={shareToWhatsApp}
                className="w-full rounded-xl"
              >
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </Button>
              <Button variant="outline" onClick={() => void copyText()} className="w-full rounded-xl">
                <Copy className="h-4 w-4" />
                Copy message and link
              </Button>
            </div>

            <div className="mt-4 rounded-xl bg-muted/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Message
              </p>
              <p className="mt-1 break-words text-xs leading-relaxed text-foreground/90">
                {shareText}
              </p>
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              The link opens this course on QUIZMI — recipients can view it and buy access
              themselves.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
