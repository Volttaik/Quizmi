"use client";
import { PlusCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  credits: number;
  plan: string;
}

export default function CreditCard({ credits, plan }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl mb-5 shadow-2xl shadow-primary/35">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,56%)] via-[hsl(265,72%,48%)] to-[hsl(275,72%,36%)]" />
      <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/[0.08]" />
      <div className="absolute -bottom-16 -left-8 w-56 h-56 rounded-full bg-white/[0.05]" />
      <div className="absolute top-0 left-1/3 w-32 h-32 rounded-full bg-[hsl(280,80%,60%)]/20 blur-2xl" />
      <div className="absolute bottom-2 right-4 opacity-[0.08]">
        <BookOpen className="w-32 h-32 text-white" strokeWidth={0.8} />
      </div>
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="card-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#card-grid)" />
      </svg>

      <div className="relative p-6">
        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Study Credits</p>

        <motion.div
          className="flex items-baseline gap-2 mb-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="text-5xl font-black text-white tracking-tight leading-none tabular-nums">
            {credits.toLocaleString()}
          </span>
          <span className="text-sm font-semibold text-white/50">credits</span>
        </motion.div>

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
