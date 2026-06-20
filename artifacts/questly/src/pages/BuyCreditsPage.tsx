import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const packages = [
  { id: "starter", name: "Starter", credits: 500, price: "₦500", priceUsd: "$0.50", desc: "Perfect for occasional use", popular: false, perCredit: "₦1 per credit" },
  { id: "standard", name: "Standard", credits: 1500, price: "₦1,200", priceUsd: "$1.20", desc: "Best for regular students", popular: true, perCredit: "₦0.80 per credit" },
  { id: "pro", name: "Pro", credits: 5000, price: "₦3,500", priceUsd: "$3.50", desc: "For power users", popular: false, perCredit: "₦0.70 per credit" },
] as const;

const CREDIT_COSTS = [
  { action: "Generate a quiz (any length)", cost: 1 },
  { action: "Generate flashcard set (any count)", cost: 1 },
  { action: "Generate AI summary", cost: 1 },
];

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
      if (!res.ok) { toast.error(data.error ?? "Failed to initialize payment"); }
      else { window.location.href = data.url; }
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(null); }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground flex-1">Buy Credits</h1>
        </div>

        <div className="space-y-3 mb-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-2xl p-5 border ${pkg.popular ? "bg-gradient-to-br from-[hsl(262,72%,55%)] to-[hsl(270,72%,40%)] text-white border-transparent" : "bg-card border-border"}`}
            >
              {pkg.popular && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Best Value</span>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className={`text-base font-extrabold ${pkg.popular ? "text-white" : "text-foreground"}`}>{pkg.name}</h3>
                  <p className={`text-xs font-medium mt-0.5 ${pkg.popular ? "text-white/60" : "text-muted-foreground"}`}>{pkg.desc}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-extrabold ${pkg.popular ? "text-white" : "text-foreground"}`}>{pkg.price}</p>
                  <p className={`text-[10px] ${pkg.popular ? "text-white/50" : "text-muted-foreground"}`}>{pkg.perCredit}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-4">
                <Zap className={`w-4 h-4 ${pkg.popular ? "text-white" : "text-primary"}`} />
                <span className={`text-sm font-extrabold ${pkg.popular ? "text-white" : "text-foreground"}`}>{pkg.credits.toLocaleString()} Credits</span>
              </div>
              <Button
                onClick={() => handlePurchase(pkg)}
                disabled={loading !== null}
                className={`w-full rounded-full text-sm font-semibold ${pkg.popular ? "bg-white text-[hsl(262,72%,45%)] hover:bg-white/90" : ""}`}
                variant={pkg.popular ? "default" : "outline"}
              >
                {loading === pkg.id ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</> : `Buy ${pkg.credits.toLocaleString()} Credits`}
              </Button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-card border border-border p-5">
          <h3 className="text-sm font-extrabold text-foreground mb-4">Credit Usage Guide</h3>
          <div className="space-y-3">
            {CREDIT_COSTS.map((item) => (
              <div key={item.action} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground">{item.action}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="text-xs font-bold text-foreground">{item.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
