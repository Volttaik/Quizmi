"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Background glow spread across the full section — no hard edges */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(ellipse_80%_60%_at_50%_55%,hsl(262,72%,40%,0.18)_0%,transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
        {/* Heading */}
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
              Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
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

        <div className="mt-5">
          <a href="/downloads/questly.apk" download="questly.apk">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-6 text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 gap-2"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Download Android App (.apk)
            </Button>
          </a>
        </div>

        {/* Phone — larger, seamless blend into background */}
        <div className="relative mt-6 w-[480px] sm:w-[680px] md:w-[860px]">
          <img
            src="/hero-phone-1.png"
            alt="Quizmi App"
            className="w-full h-auto object-contain"
            style={{
              maskImage: [
                "radial-gradient(ellipse 90% 100% at 50% 50%, black 30%, transparent 70%)",
                "linear-gradient(to bottom, black 20%, black 50%, transparent 85%)",
              ].join(", "),
              WebkitMaskImage: [
                "radial-gradient(ellipse 90% 100% at 50% 50%, black 30%, transparent 70%)",
                "linear-gradient(to bottom, black 20%, black 50%, transparent 85%)",
              ].join(", "),
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
        </div>
      </div>
    </section>
  );
}
