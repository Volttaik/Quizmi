"use client";

import { Zap, Sparkles, PlusCircle, BookOpen } from "lucide-react";
import Link from "next/link";

interface Props {
  credits: number;
  plan: string;
}

export default function CreditCard({ credits, plan }: Props) {
  const planLabel =
    plan === "pro"
      ? "Pro Learner"
      : plan === "team"
      ? "Team Plan"
      : "Free Learner";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(262,72%,55%)] via-[hsl(262,72%,48%)] to-[hsl(270,72%,40%)] p-6 mb-6 text-white shadow-xl shadow-primary/20">
      <div className="absolute top-4 right-4 w-20 h-20 opacity-[0.08]">
        <BookOpen className="w-full h-full" strokeWidth={1} />
      </div>
      <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-white/[0.04]" />
      <div className="absolute -bottom-4 -left-8 w-24 h-24 rounded-full bg-white/[0.03]" />

      <p className="text-sm font-medium text-white/70 mb-1">Your Study Credits</p>
      <h2 className="text-5xl font-extrabold tracking-tight">
        {credits.toLocaleString()}
      </h2>
      <p className="text-xs text-white/50 mt-0.5 font-medium">credits</p>

      <div className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 text-xs font-bold">
        <Zap className="w-3.5 h-3.5" />
        {planLabel}
      </div>

      <div className="flex items-center justify-between mt-5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
          <Sparkles className="w-3.5 h-3.5" />
          Credits never expire
        </div>
        <Link
          href="/buy-credits"
          className="flex items-center gap-2 text-sm font-bold text-white hover:text-white/80 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <PlusCircle className="w-4 h-4" />
          </div>
          Add Credits
        </Link>
      </div>
    </div>
  );
}
