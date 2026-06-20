"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, Zap, BookOpen } from "lucide-react";

const floatingBadges = [
  { icon: Brain, label: "AI-Powered", color: "text-primary", bg: "bg-primary/15 border-primary/20", pos: { top: "8px", left: "-8px" } },
  { icon: Sparkles, label: "10s generation", color: "text-[hsl(142,70%,45%)]", bg: "bg-[hsl(142,70%,45%)]/15 border-[hsl(142,70%,45%)]/20", pos: { top: "8px", right: "-8px" } },
  { icon: Zap, label: "Instant flashcards", color: "text-[hsl(30,90%,55%)]", bg: "bg-[hsl(30,90%,55%)]/15 border-[hsl(30,90%,55%)]/20", pos: { bottom: "40px", left: "-8px" } },
  { icon: BookOpen, label: "Smart summaries", color: "text-[hsl(200,90%,50%)]", bg: "bg-[hsl(200,90%,50%)]/15 border-[hsl(200,90%,50%)]/20", pos: { bottom: "40px", right: "-8px" } },
];

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-4 min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-[hsl(280,72%,50%)]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            Powered by Groq AI
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.92] tracking-tighter">
            Study
            <br />
            <span className="bg-gradient-to-r from-[hsl(262,72%,65%)] via-[hsl(280,80%,70%)] to-[hsl(262,72%,55%)] bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>
        </div>

        <p className="mt-6 text-base md:text-lg text-white/45 max-w-lg mx-auto text-center leading-relaxed">
          Turn any material into quizzes, flashcards, and AI&nbsp;summaries.
          Master concepts <span className="text-white/70 font-medium">faster than ever.</span>
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-10">
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
        </div>

        <div className="relative mt-16 flex justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 w-full max-w-sm">
            <div className="relative">
              {floatingBadges.map((badge) => (
                <div
                  key={badge.label}
                  className={`absolute z-20 hidden md:flex items-center gap-2 px-3 py-2 rounded-full border ${badge.bg} backdrop-blur-sm`}
                  style={badge.pos}
                >
                  <badge.icon className={`w-3.5 h-3.5 ${badge.color}`} />
                  <span className={`text-[11px] font-bold ${badge.color}`}>{badge.label}</span>
                </div>
              ))}

              <div className="relative mx-auto w-[280px]">
                <div className="absolute inset-0 rounded-[36px] ring-1 ring-white/10 shadow-2xl shadow-black/60 z-10 pointer-events-none" />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-20" />
                <div className="rounded-[36px] overflow-hidden bg-[hsl(220,20%,97%)] aspect-[9/19.5]">
                  <img
                    src="/dashboard-screenshot.png"
                    alt="Quizmi Dashboard"
                    width={280}
                    height={607}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[hsl(222,47%,6%)] to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
