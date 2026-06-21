"use client";
import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Zap, Home, RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Particle { id: number; x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; }

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#a855f7", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#ffffff"];
    const particles: Particle[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6,
      life: 1,
    }));
    let frame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 0.005;
        if (p.life <= 0 || p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = -20;
          p.vx = (Math.random() - 0.5) * 4;
          p.vy = 2 + Math.random() * 3;
          p.life = 0.8 + Math.random() * 0.2;
        }
        ctx.save();
        ctx.globalAlpha = p.life * 0.85;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      frame = requestAnimationFrame(animate);
    };
    animate();
    const timeout = setTimeout(() => cancelAnimationFrame(frame), 4500);
    return () => { cancelAnimationFrame(frame); clearTimeout(timeout); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.7 }} />;
}

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<"verifying" | "done">("verifying");
  const hasRef = useRef(false);

  const status = searchParams.get("status");
  const credits = searchParams.get("credits");
  const reason = searchParams.get("reason");
  const ref = searchParams.get("ref");

  useEffect(() => {
    if (hasRef.current) return;
    hasRef.current = true;

    if (typeof window !== "undefined") {
      localStorage.removeItem("pending_payment_ref");
      localStorage.removeItem("pending_payment_pkg");
      localStorage.removeItem("pending_payment_credits");
    }

    const delay = status === "success" ? 1200 : 800;
    const timer = setTimeout(() => setStage("done"), delay);
    return () => clearTimeout(timer);
  }, [status]);

  const isSuccess = status === "success";

  const reasonMap: Record<string, string> = {
    no_reference: "No payment reference found.",
    not_configured: "Payment system is not configured.",
    payment_not_successful: "Your payment did not complete successfully.",
    missing_metadata: "Payment data is incomplete.",
    server_error: "A server error occurred while verifying your payment.",
  };
  const errorMessage = reasonMap[reason ?? ""] ?? "Your payment could not be verified.";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {stage === "done" && isSuccess && <Confetti />}

      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-0 left-0 right-0 h-[400px] ${isSuccess ? "bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-transparent" : "bg-gradient-to-br from-red-600/15 via-red-500/8 to-transparent"}`} />
        <div className={`absolute top-10 left-1/4 w-72 h-72 rounded-full blur-[100px] ${isSuccess ? "bg-emerald-500/20" : "bg-red-500/15"}`} />
      </div>

      <AnimatePresence mode="wait">
        {stage === "verifying" ? (
          <motion.div key="verifying"
            className="relative z-10 flex flex-col items-center gap-5 max-w-sm w-full text-center"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}>
            <motion.div
              className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center"
              animate={{ scale: [1, 1.06, 1], rotate: [0, 4, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}>
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </motion.div>
            <div>
              <p className="text-lg font-extrabold text-foreground">Verifying payment…</p>
              <p className="text-xs text-muted-foreground mt-1">This only takes a moment</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 0.18, 0.36].map((d) => (
                <motion.div key={d} className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: d }} />
              ))}
            </div>
          </motion.div>
        ) : isSuccess ? (
          <motion.div key="success"
            className="relative z-10 flex flex-col items-center max-w-sm w-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <motion.div
              className="w-28 h-28 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mb-6"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}>
              <CheckCircle className="w-14 h-14 text-emerald-500" strokeWidth={1.5} />
            </motion.div>

            <motion.div className="text-center mb-7"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="text-2xl font-extrabold text-foreground mb-1">Payment Successful! 🎉</h1>
              <p className="text-muted-foreground text-sm">Your credits have been added to your account.</p>

              {credits && (
                <motion.div
                  className="inline-flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-6 py-3.5 rounded-2xl mt-5"
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 280, damping: 18 }}>
                  <motion.div
                    animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1.2, 1.1, 1.1, 1] }}
                    transition={{ delay: 0.6, duration: 0.7 }}>
                    <Zap className="w-6 h-6 fill-current" />
                  </motion.div>
                  <span className="text-2xl font-extrabold">+{parseInt(credits).toLocaleString()} Credits</span>
                </motion.div>
              )}
            </motion.div>

            <motion.div className="w-full space-y-3"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Link href="/dashboard" className="block">
                <Button className="w-full rounded-2xl h-12 font-semibold" size="lg">
                  <Home className="w-4 h-4 mr-2" /> Go to Dashboard
                </Button>
              </Link>
              <Link href="/create-quiz" className="block">
                <Button variant="outline" className="w-full rounded-2xl h-12 font-semibold" size="lg">
                  <Zap className="w-4 h-4 mr-2" /> Start Generating
                </Button>
              </Link>
            </motion.div>

            {ref && (
              <motion.p className="text-[10px] text-muted-foreground/40 mt-6 text-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                Ref: {ref}
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div key="failed"
            className="relative z-10 flex flex-col items-center max-w-sm w-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <motion.div
              className="w-28 h-28 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mb-6"
              initial={{ scale: 0, x: -20 }}
              animate={{ scale: 1, x: [0, -8, 8, -6, 6, 0] }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}>
              <XCircle className="w-14 h-14 text-red-500" strokeWidth={1.5} />
            </motion.div>

            <motion.div className="text-center mb-7"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="text-2xl font-extrabold text-foreground mb-2">Payment Failed</h1>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
              <p className="text-muted-foreground/60 text-xs mt-1.5">Your card was not charged.</p>
            </motion.div>

            <motion.div className="w-full space-y-3"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Link href="/buy-credits" className="block">
                <Button className="w-full rounded-2xl h-12 font-semibold" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </Button>
              </Link>
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full rounded-2xl h-12 font-semibold" size="lg">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense>
      <PaymentCallbackContent />
    </Suspense>
  );
}
