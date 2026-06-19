import { Zap, PlusCircle, BookOpen } from "lucide-react";
import { Link } from "wouter";

interface Props {
  credits: number;
  plan: string;
}

export default function CreditCard({ credits, plan }: Props) {
  const planLabel =
    plan === "pro" ? "Pro Learner" : plan === "team" ? "Team Plan" : "Free";
  const planColor =
    plan === "pro"
      ? "bg-amber-400/20 text-amber-300"
      : plan === "team"
      ? "bg-blue-400/20 text-blue-300"
      : "bg-white/15 text-white/70";

  return (
    <div className="relative overflow-hidden rounded-3xl mb-6 shadow-2xl shadow-primary/30">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,58%)] via-[hsl(265,72%,50%)] to-[hsl(275,72%,38%)]" />
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[0.07]" />
      <div className="absolute -bottom-20 -left-10 w-60 h-60 rounded-full bg-white/[0.04]" />
      <div className="absolute bottom-2 right-4 opacity-[0.10]">
        <BookOpen className="w-28 h-28 text-white" strokeWidth={1} />
      </div>

      <div className="relative p-6">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">
          Study Credits
        </p>
        <div className="flex items-baseline gap-2 mb-5">
          <span className="text-5xl font-black text-white tracking-tight leading-none">
            {credits.toLocaleString()}
          </span>
          <span className="text-base font-semibold text-white/50">credits</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${planColor}`}>
              <Zap className="w-3 h-3" />
              {planLabel}
            </div>
            <span className="text-[10px] text-white/35 font-medium hidden sm:block">
              Never expire
            </span>
          </div>
          <Link
            to="/buy-credits"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-xs font-bold text-white"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add Credits
          </Link>
        </div>
      </div>
    </div>
  );
}
