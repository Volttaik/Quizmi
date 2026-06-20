"use client";
import { ArrowRight, Coins } from "lucide-react";
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

      <div className="relative flex items-center gap-4 p-5">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Study Credits</span>
          </div>
          <h3 className="text-base font-extrabold text-white leading-tight mb-1.5">
            Power your learning<br />
            <span className="text-primary">with AI credits.</span>
          </h3>
          <p className="text-[11px] text-white/40 leading-relaxed mb-3">
            Generate quizzes, flashcards & summaries instantly.
          </p>
          <Link
            href="/buy-credits"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary/80 hover:bg-primary px-4 py-2 rounded-full transition-all hover:shadow-glow-primary active:scale-95"
          >
            Buy Now <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center">
          <img
            src="/study-banner.png"
            alt="Study"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                const icon = document.createElement("div");
                icon.className = "flex items-center justify-center w-full h-full";
                parent.appendChild(icon);
              }
            }}
          />
          <Coins className="w-10 h-10 text-primary/60 absolute" style={{ display: "none" }} />
        </div>
      </div>
    </motion.div>
  );
}
