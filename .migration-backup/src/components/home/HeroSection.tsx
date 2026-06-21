"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const slides = [
  { src: "/hero-phone-1.png", alt: "Quizmi App Preview" },
  { src: "/hero-phone-2.png", alt: "Quizmi Quiz Creation" },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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

        {/* Slideshow — one image at a time */}
        <div className="relative mt-16 flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative w-[260px] sm:w-[300px] h-[420px] sm:h-[480px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 32, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -32, scale: 0.94 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <img
                  src={slides[current].src}
                  alt={slides[current].alt}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2 mt-6 relative z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-6 h-2 bg-primary"
                    : "w-2 h-2 bg-white/25 hover:bg-white/50"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
