"use client";
import { Zap, PlusCircle, BookOpen, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  credits: number;
  plan: string;
}

export default function CreditCard({ credits, plan }: Props) {
  const planLabel = plan === "pro" ? "Pro Learner" : plan === "team" ? "Team Plan" : "Free";
  const planColor =
    plan === "pro"
      ? "bg-yellow-400/25 text-yellow-200 border-yellow-400/20"
      : plan === "team"
      ? "bg-blue-400/25 text-blue-200 border-blue-400/20"
      : "bg-white/12 text-white/65 border-white/10";

  return (
    <div className="relative overflow-hidden rounded-3xl mb-5 shadow-2xl shadow-primary/35">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,56%)] via-[hsl(265,72%,48%)] to-[hsl(275,72%,36%)]" />
      {/* Orbs */}
      <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/[0.08]" />
      <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-white/[0.05]" />
      <div className="absolute top-0 left-1/3 w-32 h-32 rounded-full bg-[hsl(280,80%,60%)]/20 blur-2xl" />
      {/* Watermark icon */}
      <div className="absolute bottom-2 right-4 opacity-[0.08]">
        <BookOpen className="w-32 h-32 text-white" strokeWidth={0.8} />
      </div>
      {/* Subtle grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="card-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#card-grid)" />
      </svg>

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Study Credits</p>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${planColor}`}>
            <Zap className="w-2.5 h-2.5" />
            {planLabel}
          </div>
        </div>

        <motion.div
          className="flex items-baseline gap-2 mb-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="text-5xl font-black text-white tracking-tight leading-none tabular-nums">
            {credits.toLocaleString()}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white/50">credits</span>
            <div className="flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 text-[hsl(142,70%,60%)]" />
              <span className="text-[10px] text-white/40 font-medium">Never expire</span>
            </div>
          </div>
        </motion.div>

        {/* Progress bar showing credits */}
        <div className="mb-4">
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-white/60 to-white/30"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (credits / 500) * 100)}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-white/30 mt-1">{Math.min(credits, 500)}/500 credits</p>
        </div>

        <Link
          href="/buy-credits"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/10 transition-all text-xs font-bold text-white active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add Credits
        </Link>
      </div>
    </div>
  );
}
