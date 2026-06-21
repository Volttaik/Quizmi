"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QUIZ_TYPE_CONFIG, type QuizType } from "@/lib/quizTypes";
import { generateShareCard } from "@/lib/generateShareCard";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  quizType: QuizType;
  quizTitle: string;
  subjectName: string;
  pct: number;
  banner: string;
  shareUrl: string;
}

export default function ShareModal({
  open, onClose, quizType, quizTitle, subjectName, pct, banner, shareUrl,
}: ShareModalProps) {
  const cfg = QUIZ_TYPE_CONFIG[quizType];
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgBlob, setImgBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const blobRef = useRef<string | null>(null);

  // Generate image when modal opens
  useEffect(() => {
    if (!open) return;
    setGenerating(true);
    generateShareCard({ type: quizType, quizTitle, subjectName, pct, banner, shareUrl })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        blobRef.current = url;
        setImgBlob(blob);
        setImgUrl(url);
      })
      .catch(() => toast.error("Couldn't generate image"))
      .finally(() => setGenerating(false));
  }, [open, quizType, quizTitle, subjectName, pct, banner, shareUrl]);

  // Cleanup on unmount
  useEffect(() => () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); }, []);

  const canShareFiles = typeof navigator !== "undefined" && "share" in navigator && "canShare" in navigator;

  const handleShareImage = async () => {
    if (!imgBlob) return;
    const file = new File([imgBlob], "quizmi-result.png", { type: "image/png" });
    if (canShareFiles && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${quizTitle} — ${pct}%`,
          text: `${banner}\n\nCreate your own quiz at quizmi.space`,
        });
        onClose();
      } catch (e: any) {
        if (e?.name !== "AbortError") handleDownload();
      }
    } else {
      handleDownload();
    }
  };

  const handleDownload = () => {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = "quizmi-result.png";
    a.click();
    toast.success("Image saved!");
    onClose();
  };

  const handleWhatsApp = () => {
    const text = `${cfg.shareEmoji} I scored *${pct}%* on "${quizTitle}"!\n${banner}\n\nCan you beat me? 👉 ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl max-w-lg mx-auto"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}>

            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-extrabold text-foreground">Share Your Result</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.theme.badge} inline-block mt-0.5`}>
                  {cfg.label} · {pct}%
                </span>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Image preview */}
            <div className="rounded-2xl overflow-hidden mb-4 aspect-square w-full max-w-[280px] mx-auto bg-muted/40 flex items-center justify-center relative">
              {generating ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Generating image…</p>
                </div>
              ) : imgUrl ? (
                <img src={imgUrl} alt="Share card" className="w-full h-full object-cover" />
              ) : (
                <p className="text-xs text-muted-foreground">Preview unavailable</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {/* Share image (native share or download) */}
              <Button
                onClick={handleShareImage}
                disabled={generating || !imgBlob}
                className="w-full rounded-2xl gap-2 py-5 text-sm font-bold"
                size="lg">
                <Share2 className="w-4 h-4" />
                {canShareFiles ? "Share Image" : "Download Image"}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp link share */}
                <Button
                  onClick={handleWhatsApp}
                  className="rounded-2xl gap-2 py-5 text-sm font-bold"
                  style={{ background: "#25D366", color: "#fff" }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>

                {/* Download fallback */}
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={generating || !imgBlob}
                  className="rounded-2xl gap-2 py-5 text-sm font-bold">
                  <Download className="w-4 h-4" /> Save
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
