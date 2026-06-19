"use client";

import { motion } from "framer-motion";
import { GraduationCap, BookMarked, ScrollText, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const showcaseItems = [
  {
    icon: GraduationCap,
    title: "Quiz Mode",
    desc: "Test yourself with AI-generated multiple choice questions. Instant feedback on every answer.",
    color: "text-[hsl(142,70%,45%)]",
    bg: "bg-[hsl(142,70%,45%)]/10",
    img: "/quiz-cards-visual.png",
  },
  {
    icon: BookMarked,
    title: "Flashcard Decks",
    desc: "Flip cards, mark confidence, and let spaced repetition do the rest.",
    color: "text-primary",
    bg: "bg-primary/10",
    img: "/flashcard-preview.png",
  },
  {
    icon: ScrollText,
    title: "AI Summaries",
    desc: "Paste a chapter, get a structured summary with key points and definitions.",
    color: "text-[hsl(200,90%,50%)]",
    bg: "bg-[hsl(200,90%,50%)]/10",
    img: "/hero-visual.png",
  },
];

export default function AppShowcase() {
  return (
    <section className="py-28 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">App</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            Built for how
            <br />
            <span className="text-white/40">students actually study</span>
          </h2>
          <p className="mt-4 text-sm text-white/35 max-w-md mx-auto">
            Every feature was designed around real student workflows. No fluff, just tools that work.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {showcaseItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-3xl border border-white/[0.06] overflow-hidden hover:border-white/[0.14] transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[hsl(222,47%,6%)] z-10" />
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover opacity-50 group-hover:opacity-65 group-hover:scale-105 transition-all duration-700"
                />
                <div className={`absolute top-4 left-4 z-20 w-10 h-10 rounded-2xl ${item.bg} border border-white/[0.08] flex items-center justify-center`}>
                  <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-4">{item.desc}</p>
                <Link href="/sign-up" className={`inline-flex items-center gap-1.5 text-xs font-bold ${item.color} hover:opacity-80 transition-opacity`}>
                  Try it free <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
