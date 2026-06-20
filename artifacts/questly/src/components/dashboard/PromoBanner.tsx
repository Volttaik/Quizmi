"use client";
import { Sparkles, ArrowRight, Brain, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PromoBanner() {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative overflow-hidden rounded-3xl mb-6 shadow-elevated dark:shadow-[0_6px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,12%)] via-[hsl(240,40%,10%)] to-[hsl(262,50%,14%)]" />
      <div className="absolute -top-8 -right-8 w-48 h-48 bg-primary/25 rounded-full blur-3xl" />
      <div className="absolute -bottom-8 left-8 w-32 h-32 bg-[hsl(280,72%,50%)]/20 rounded-full blur-2xl" />

      {/* Animated accent dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/10"
            style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.5, 1] }}
            transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative flex items-center gap-4 p-5">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Pro Feature</span>
          </div>
          <h3 className="text-base font-extrabold text-white leading-tight mb-1.5">
            Smarter study,<br />
            <span className="text-primary">better results.</span>
          </h3>
          <p className="text-[11px] text-white/40 leading-relaxed mb-3">
            AI tools that adapt to how you learn.
          </p>
          <Link
            href="/buy-credits"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary/80 hover:bg-primary px-4 py-2 rounded-full transition-all hover:shadow-glow-primary active:scale-95"
          >
            Upgrade now <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Brain className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[hsl(280,72%,50%)]/20 border border-[hsl(280,72%,50%)]/30 flex items-center justify-center">
            <Zap className="w-7 h-7 text-[hsl(280,72%,60%)]" strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
