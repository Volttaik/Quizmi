"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-4 min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-[hsl(280,72%,50%)]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
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

        {/* Two hero images sliding in from left and right */}
        <div className="relative mt-16 flex justify-center items-end gap-6 sm:gap-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

          {/* Image 1 — slides in from left */}
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 w-[44%] max-w-[220px] sm:max-w-[260px]"
          >
            <img
              src="/hero-phone-1.png"
              alt="Quizmi App Preview"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </motion.div>

          {/* Image 2 — slides in from right */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
            className="relative z-10 w-[44%] max-w-[220px] sm:max-w-[260px]"
          >
            <img
              src="/hero-phone-2.png"
              alt="Quizmi Quiz Creation"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
