"use client";
import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Check, Loader2, ShieldCheck, Clock, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const packages = [
  { id: "starter", name: "Starter", credits: 50, price: "₦500", desc: "Perfect for occasional use", popular: false, perCredit: "₦10.00/credit" },
  { id: "standard", name: "Standard", credits: 100, price: "₦1,000", desc: "Best for regular students", popular: true, perCredit: "₦10.00/credit" },
  { id: "pro", name: "Pro", credits: 350, price: "₦3,500", desc: "Unlimited learning power", popular: false, perCredit: "₦10.00/credit" },
] as const;

const CREDIT_COSTS = [
  { action: "Generate a quiz", cost: 1, icon: "🧠" },
  { action: "Create flashcard set", cost: 1, icon: "🃏" },
  { action: "Generate AI summary", cost: 1, icon: "📄" },
  { action: "AI chat messages", cost: 0, icon: "💬", note: "Included" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 26 } },
};

export default function BuyCreditsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const handlePurchase = async (pkg: typeof packages[number]) => {
    setLoading(pkg.id);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkg.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to initialize payment");
        setLoading(null);
      } else {
        if (typeof window !== "undefined") {
          localStorage.setItem("pending_payment_ref", data.reference);
          localStorage.setItem("pending_payment_pkg", pkg.id);
          localStorage.setItem("pending_payment_credits", String(pkg.credits));
        }
        setRedirecting(true);
        setTimeout(() => { window.location.href = data.url; }, 400);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <AnimatePresence>
        {redirecting && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm gap-5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
              animate={{ scale: [1, 1.08, 1], rotate: [0, 6, -6, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}>
              <Zap className="w-9 h-9 text-primary fill-primary/30" />
            </motion.div>
            <div className="text-center">
              <p className="text-base font-extrabold text-foreground">Redirecting to Paystack…</p>
              <p className="text-xs text-muted-foreground mt-1">Secure checkout — do not close this page</p>
            </div>
            <motion.div className="flex gap-1.5">
              {[0, 0.15, 0.3].map((d) => (
                <motion.div key={d} className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.9, delay: d }} />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <motion.div className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Link href="/dashboard" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-foreground">Buy Credits</h1>
            <p className="text-xs text-muted-foreground">Power your AI study sessions</p>
          </div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3 mb-6">
          {packages.map((pkg) => (
            <motion.div key={pkg.id} variants={item}>
              {pkg.popular ? (
                <div className="relative rounded-2xl p-5 bg-gradient-to-br from-[hsl(262,72%,52%)] to-[hsl(270,72%,38%)] text-white shadow-lg shadow-purple-500/25 overflow-hidden">
                  <motion.div className="absolute inset-0 opacity-30 pointer-events-none"
                    animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                    style={{ background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
                  <span className="absolute top-3.5 right-4 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Best Value
                  </span>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-white">{pkg.name}</h3>
                      <p className="text-xs font-medium mt-0.5 text-white/60">{pkg.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-white">{pkg.price}</p>
                      <p className="text-[10px] text-white/50">{pkg.perCredit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span className="text-sm font-extrabold text-white">{pkg.credits.toLocaleString()} Credits</span>
                  </div>
                  <Button onClick={() => handlePurchase(pkg)} disabled={loading !== null}
                    className="w-full rounded-xl h-11 bg-white text-purple-700 hover:bg-white/90 font-bold text-sm shadow-none">
                    {loading === pkg.id
                      ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing…</>
                      : `Buy ${pkg.credits.toLocaleString()} Credits`}
                  </Button>
                </div>
              ) : (
                <div className="relative rounded-2xl p-5 bg-card border border-border hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-foreground">{pkg.name}</h3>
                      <p className="text-xs font-medium mt-0.5 text-muted-foreground">{pkg.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-foreground">{pkg.price}</p>
                      <p className="text-[10px] text-muted-foreground">{pkg.perCredit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-4">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-extrabold text-foreground">{pkg.credits.toLocaleString()} Credits</span>
                  </div>
                  <Button onClick={() => handlePurchase(pkg)} disabled={loading !== null} variant="outline"
                    className="w-full rounded-xl h-11 font-semibold text-sm">
                    {loading === pkg.id
                      ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing…</>
                      : `Buy ${pkg.credits.toLocaleString()} Credits`}
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl bg-card border border-border p-5 mb-4">
          <h3 className="text-sm font-extrabold text-foreground mb-4">Credit Usage Guide</h3>
          <div className="space-y-3">
            {CREDIT_COSTS.map((c) => (
              <div key={c.action} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{c.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground">{c.action}</span>
                </div>
                <div className="flex items-center gap-1">
                  {c.note
                    ? <span className="text-xs font-bold text-emerald-500">{c.note}</span>
                    : <><Zap className="w-3 h-3 text-primary" /><span className="text-xs font-bold text-foreground">{c.cost}</span></>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          className="flex items-center gap-3 text-xs text-muted-foreground justify-center">
          <div className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure payment</div>
          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary" /> Instant delivery</div>
          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-primary" /> No expiry</div>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
}
