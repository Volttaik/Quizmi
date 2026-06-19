"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative pt-28 pb-8 min-h-screen flex flex-col items-center justify-center">
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] bg-[hsl(280,72%,50%)]/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.95] tracking-tighter">
            Study
            <br />
            <span className="bg-gradient-to-r from-[hsl(262,72%,60%)] via-[hsl(280,80%,65%)] to-[hsl(262,72%,50%)] bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-base md:text-lg text-white/40 max-w-md mx-auto text-center leading-relaxed"
        >
          Turn any material into quizzes, flashcards, and AI&nbsp;summaries. Master concepts faster than ever.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center gap-3 mt-10"
        >
          <Link href="/sign-up">
            <Button size="lg" className="rounded-full px-8 text-sm font-semibold">
              Start Free <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full px-8 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5"
            >
              See How It Works
            </Button>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 flex justify-center"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 w-full max-w-md">
            <div className="rounded-3xl border-2 border-white/[0.08] bg-[hsl(220,20%,97%)] shadow-2xl shadow-primary/20 overflow-hidden">
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-28 h-5 rounded-full bg-[hsl(222,47%,11%)]" />
              </div>
              <div className="relative">
                <div className="absolute inset-0 h-36 overflow-hidden rounded-b-3xl">
                  <div className="w-full h-full bg-gradient-to-br from-[hsl(262,72%,55%)] via-[hsl(262,72%,48%)] to-[hsl(270,72%,40%)]" />
                </div>
                <div className="relative px-5 pt-3 pb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-[10px] font-extrabold text-[hsl(262,72%,55%)]">Q</div>
                    <div>
                      <p className="text-[10px] font-bold text-white">Hi there!</p>
                      <p className="text-[7px] text-white/60">Keep learning!</p>
                    </div>
                    <div className="ml-auto w-6 h-6 rounded-full bg-white/20" />
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-[hsl(262,72%,55%)] to-[hsl(270,72%,40%)] p-4 text-white border border-white/10">
                    <p className="text-[8px] text-white/60 font-medium">Your Study Credits</p>
                    <p className="text-2xl font-extrabold leading-none mt-1">2,450</p>
                    <p className="text-[7px] text-white/40 font-medium">credits</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[7px] font-bold">Premium Learner</div>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-4 -mt-1">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Buy Credits", color: "bg-primary/40" },
                    { label: "Create Quiz", color: "bg-[hsl(142,70%,45%)]/40" },
                    { label: "Flashcards", color: "bg-[hsl(30,90%,55%)]/40" },
                    { label: "AI Summary", color: "bg-[hsl(200,90%,50%)]/40" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-white p-2.5 shadow-sm border border-[hsl(220,20%,92%)]">
                      <div className={`w-3 h-3 rounded-sm ${item.color} mb-1.5`} />
                      <p className="text-[8px] font-extrabold text-[hsl(222,47%,11%)]">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-around pt-3 mt-3 border-t border-[hsl(220,20%,90%)]">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                  <div className="w-4 h-4 rounded-full bg-[hsl(220,13%,46%)]/15" />
                  <div className="w-6 h-6 rounded-full bg-primary -mt-2" />
                  <div className="w-4 h-4 rounded-full bg-[hsl(220,13%,46%)]/15" />
                  <div className="w-4 h-4 rounded-full bg-[hsl(220,13%,46%)]/15" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[hsl(222,47%,6%)] to-transparent pointer-events-none" />
    </section>
  );
}
