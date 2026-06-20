import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Check, Loader2, ShieldCheck, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { motion } from "framer-motion";

const packages = [
  { id: "starter", name: "Starter", credits: 500, price: "₦500", desc: "Perfect for occasional use", popular: false, perCredit: "₦1.00/credit", color: "from-blue-500/10 to-blue-600/5" },
  { id: "standard", name: "Standard", credits: 1500, price: "₦1,200", desc: "Best for regular students", popular: true, perCredit: "₦0.80/credit", color: "from-purple-500 to-purple-700" },
  { id: "pro", name: "Pro", credits: 5000, price: "₦3,500", desc: "Unlimited learning power", popular: false, perCredit: "₦0.70/credit", color: "from-emerald-500/10 to-emerald-600/5" },
] as const;

const CREDIT_COSTS = [
  { action: "Generate a quiz", cost: 1, icon: "🧠" },
  { action: "Create flashcard set", cost: 1, icon: "🃏" },
  { action: "Generate AI summary", cost: 1, icon: "📄" },
  { action: "AI chat messages", cost: 0, icon: "💬", note: "Free!" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

export default function BuyCreditsPage() {
  const [loading, setLoading] = useState<string | null>(null);

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
      } else {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-foreground">Buy Credits</h1>
            <p className="text-xs text-muted-foreground">Power your AI study sessions</p>
          </div>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3 mb-6">
          {packages.map((pkg) => (
            <motion.div key={pkg.id} variants={item}>
              {pkg.popular ? (
                <div className="relative rounded-2xl p-5 bg-gradient-to-br from-[hsl(262,72%,52%)] to-[hsl(270,72%,38%)] text-white shadow-lg shadow-purple-500/25 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <span className="absolute top-3.5 right-4 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">Best Value ✨</span>
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
                  <Button
                    onClick={() => handlePurchase(pkg)}
                    disabled={loading !== null}
                    className="w-full rounded-xl h-11 bg-white text-purple-700 hover:bg-white/90 font-bold text-sm shadow-none"
                  >
                    {loading === pkg.id ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</> : `Buy ${pkg.credits.toLocaleString()} Credits`}
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
                  <Button
                    onClick={() => handlePurchase(pkg)}
                    disabled={loading !== null}
                    variant="outline"
                    className="w-full rounded-xl h-11 font-semibold text-sm"
                  >
                    {loading === pkg.id ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</> : `Buy ${pkg.credits.toLocaleString()} Credits`}
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-card border border-border p-5 mb-4"
        >
          <h3 className="text-sm font-extrabold text-foreground mb-4">Credit Usage Guide</h3>
          <div className="space-y-3">
            {CREDIT_COSTS.map((item) => (
              <div key={item.action} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground">{item.action}</span>
                </div>
                <div className="flex items-center gap-1">
                  {item.note ? (
                    <span className="text-xs font-bold text-emerald-500">{item.note}</span>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-xs font-bold text-foreground">{item.cost}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-3 text-xs text-muted-foreground justify-center"
        >
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
