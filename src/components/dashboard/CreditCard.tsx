"use client";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  credits: number;
  plan: string;
}

export default function CreditCard({ credits, plan }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl mb-5 shadow-2xl shadow-primary/35">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,56%)] via-[hsl(265,72%,48%)] to-[hsl(275,72%,36%)]" />

      {/* Abstract mesh background — flowing aurora shapes */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="a1" cx="20%" cy="30%" r="60%">
            <stop offset="0%" stopColor="hsl(280,90%,75%)" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="hsl(280,90%,75%)" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="a2" cx="80%" cy="70%" r="55%">
            <stop offset="0%" stopColor="hsl(245,80%,70%)" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="hsl(245,80%,70%)" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="a3" cx="55%" cy="10%" r="45%">
            <stop offset="0%" stopColor="hsl(300,70%,80%)" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="hsl(300,70%,80%)" stopOpacity="0"/>
          </radialGradient>
          <filter id="blur">
            <feGaussianBlur stdDeviation="8"/>
          </filter>
        </defs>
        {/* Aurora blobs */}
        <ellipse cx="80" cy="55" rx="120" ry="70" fill="url(#a1)" filter="url(#blur)" />
        <ellipse cx="320" cy="110" rx="110" ry="65" fill="url(#a2)" filter="url(#blur)" />
        <ellipse cx="220" cy="20" rx="90" ry="50" fill="url(#a3)" filter="url(#blur)" />
        {/* Subtle flowing lines */}
        <path d="M 0 100 Q 100 60 200 90 T 400 70" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" fill="none"/>
        <path d="M 0 120 Q 120 80 240 110 T 400 90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none"/>
        {/* Fine dot grid */}
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.8" fill="rgba(255,255,255,0.08)"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Glow orbs */}
      <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/[0.07]" />
      <div className="absolute -bottom-14 -left-6 w-48 h-48 rounded-full bg-white/[0.04]" />

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
