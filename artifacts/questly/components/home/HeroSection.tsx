"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, Zap, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

const floatingBadges = [
  { icon: Brain, label: "AI-Powered", color: "text-primary", bg: "bg-primary/15 border-primary/20", top: "top-6", left: "left-0" },
  { icon: Sparkles, label: "10s generation", color: "text-[hsl(142,70%,45%)]", bg: "bg-[hsl(142,70%,45%)]/15 border-[hsl(142,70%,45%)]/20", top: "top-6", right: "right-0" },
  { icon: Zap, label: "Instant flashcards", color: "text-[hsl(30,90%,55%)]", bg: "bg-[hsl(30,90%,55%)]/15 border-[hsl(30,90%,55%)]/20", bottom: "bottom-6", left: "left-0" },
  { icon: BookOpen, label: "Smart summaries", color: "text-[hsl(200,90%,50%)]", bg: "bg-[hsl(200,90%,50%)]/15 border-[hsl(200,90%,50%)]/20", bottom: "bottom-6", right: "right-0" },
];

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-4 min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-[hsl(280,72%,50%)]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-[hsl(200,90%,50%)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            Powered by Gemini AI
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.92] tracking-tighter">
            Study
            <br />
            <span className="bg-gradient-to-r from-[hsl(262,72%,65%)] via-[hsl(280,80%,70%)] to-[hsl(262,72%,55%)] bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-base md:text-lg text-white/45 max-w-lg mx-auto text-center leading-relaxed"
        >
          Turn any material into quizzes, flashcards, and AI&nbsp;summaries.
          Master concepts <span className="text-white/70 font-medium">faster than ever.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row justify-center gap-3 mt-10"
        >
          <Link href="/sign-up">
            <Button size="lg" className="rounded-full px-8 text-sm font-bold shadow-xl shadow-primary/30 w-full sm:w-auto">
              Start for Free <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full px-8 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20 w-full sm:w-auto"
            >
              See How It Works
            </Button>
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex items-center justify-center gap-4 mt-8"
        >
          <div className="flex -space-x-2">
            {["hsl(262,72%,55%)", "hsl(142,70%,45%)", "hsl(30,90%,55%)", "hsl(200,90%,50%)", "hsl(340,80%,55%)"].map((color, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-[hsl(222,47%,6%)] flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
              >
                {["S", "J", "A", "M", "L"][i]}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 font-medium">
            <span className="text-white/70 font-bold">250,000+</span> students learning smarter
          </p>
        </motion.div>

        {/* Dashboard image with floating badges */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 flex justify-center"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 w-full max-w-2xl">
            {/* Floating feature badges */}
            <div className="relative">
              {floatingBadges.map((badge, i) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className={`absolute z-20 hidden md:flex items-center gap-2 px-3 py-2 rounded-full border ${badge.bg} backdrop-blur-sm`}
                  style={{
                    top: badge.top,
                    bottom: (badge as { bottom?: string }).bottom,
                    left: (badge as { left?: string }).left,
                    right: (badge as { right?: string }).right,
                  }}
                >
                  <badge.icon className={`w-3.5 h-3.5 ${badge.color}`} />
                  <span className={`text-[11px] font-bold ${badge.color}`}>{badge.label}</span>
                </motion.div>
              ))}

              {/* Main dashboard image */}
              <div className="rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 mx-8 md:mx-16">
                <Image
                  src="/dashboard-preview.png"
                  alt="Quizmi Dashboard"
                  width={600}
                  height={900}
                  className="w-full object-cover"
                  priority
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    el.style.display = "none";
                    const fallback = el.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                {/* Fallback CSS dashboard if image not loaded */}
                <div className="hidden flex-col bg-[hsl(220,20%,97%)] min-h-[400px]">
                  <div className="h-36 bg-gradient-to-br from-[hsl(262,72%,55%)] to-[hsl(270,72%,40%)] p-5 relative overflow-hidden">
                    <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/[0.06]" />
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-black text-white">Q</div>
                      <div>
                        <p className="text-xs font-bold text-white">Hi, Learner!</p>
                        <p className="text-[10px] text-white/50">Keep learning!</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/60">Credits</p>
                      <p className="text-3xl font-black text-white">2,450</p>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-2.5">
                    {[
                      { label: "Buy Credits", bg: "bg-primary/10", color: "text-primary" },
                      { label: "Create Quiz", bg: "bg-[hsl(142,70%,45%)]/10", color: "text-[hsl(142,70%,45%)]" },
                      { label: "Flashcards", bg: "bg-[hsl(30,90%,55%)]/10", color: "text-[hsl(30,90%,55%)]" },
                      { label: "AI Summary", bg: "bg-[hsl(200,90%,50%)]/10", color: "text-[hsl(200,90%,50%)]" },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-xl ${item.bg} p-3`}>
                        <div className={`w-2.5 h-2.5 rounded-sm ${item.bg.replace("/10", "/60")} mb-2`} />
                        <p className={`text-[11px] font-black ${item.color}`}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gradient fade at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[hsl(222,47%,6%)] to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
