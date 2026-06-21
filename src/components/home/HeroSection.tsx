"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Users, Home, GraduationCap, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";

const slides = [
  { label: "Love", icon: Heart, color: "text-rose-400", border: "border-rose-400/40", bg: "bg-rose-400/10", src: "/quiz-slide-love.png" },
  { label: "Friends", icon: Users, color: "text-amber-400", border: "border-amber-400/40", bg: "bg-amber-400/10", src: "/quiz-slide-friendship.png" },
  { label: "Study", icon: BookOpen, color: "text-violet-400", border: "border-violet-400/40", bg: "bg-violet-400/10", src: "/quiz-slide-study.png" },
  { label: "Classroom", icon: GraduationCap, color: "text-sky-400", border: "border-sky-400/40", bg: "bg-sky-400/10", src: "/quiz-slide-classroom.png" },
  { label: "Family", icon: Home, color: "text-emerald-400", border: "border-emerald-400/40", bg: "bg-emerald-400/10", src: "/quiz-slide-family.png" },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 3500);
    return () => clearInterval(t);
  }, []);

  const slide = slides[current];

  return (
    <section className="relative pt-24 pb-4 min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-rose-500/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/4 rounded-full blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Love · Friends · Family · Study · Classroom
          </div>
        </div>

        {/* Headline */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.92] tracking-tighter">
            Quiz for
            <br />
            <span className="bg-gradient-to-r from-rose-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
              every moment
            </span>
          </h1>
        </div>

        <p className="mt-6 text-base md:text-lg text-white/45 max-w-md mx-auto text-center leading-relaxed">
          Create quizzes about your studies, relationships, friendships, family, and classroom — share with anyone, see who really knows you.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-10">
          <Link href="/sign-up">
            <Button size="lg" className="rounded-full px-8 text-sm font-bold shadow-xl shadow-primary/30 w-full sm:w-auto">
              Create a Quiz <ArrowRight className="w-4 h-4 ml-1.5" />
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

        {/* Phone mockup */}
        <div className="relative mt-16 flex flex-col items-center gap-5">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-primary/12 rounded-full blur-[100px] pointer-events-none" />

          {/* Type selector tabs */}
          <div className="relative z-10 flex items-center gap-2 flex-wrap justify-center">
            {slides.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => setCurrent(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all duration-300 ${
                    current === i
                      ? `${s.border} ${s.bg} ${s.color}`
                      : "border-white/[0.06] bg-transparent text-white/30 hover:text-white/50"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Phone */}
          <div className="relative z-10 w-[260px]">
            {/* Frame ring */}
            <div className="absolute inset-0 rounded-[38px] ring-1 ring-white/10 shadow-2xl shadow-black/60 z-10 pointer-events-none" />
            {/* Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-[18px] bg-black rounded-full z-20" />
            {/* Screen */}
            <div className="rounded-[38px] overflow-hidden bg-black aspect-[9/19.5] relative">
              {slides.map((s, i) => (
                <img
                  key={s.label}
                  src={s.src}
                  alt={`${s.label} quiz screen`}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out"
                  style={{ opacity: i === current ? 1 : 0 }}
                />
              ))}
            </div>
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[hsl(222,47%,6%)] to-transparent pointer-events-none rounded-b-[38px] z-10" />
          </div>

          {/* Dot indicators */}
          <div className="relative z-10 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/20"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
