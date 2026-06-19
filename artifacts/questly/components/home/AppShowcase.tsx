"use client";

import { motion } from "framer-motion";
import { Sparkles, GraduationCap, BookMarked, ScrollText } from "lucide-react";

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
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            {
              icon: GraduationCap,
              title: "Quiz Mode",
              desc: "Test yourself with AI-generated multiple choice questions. Instant feedback on every answer.",
              color: "text-[hsl(142,70%,45%)]",
              bg: "bg-[hsl(142,70%,45%)]/10",
            },
            {
              icon: BookMarked,
              title: "Flashcard Decks",
              desc: "Flip cards, mark confidence, and let spaced repetition do the rest.",
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: ScrollText,
              title: "AI Summaries",
              desc: "Paste a chapter, get a structured summary with key points and definitions.",
              color: "text-[hsl(200,90%,50%)]",
              bg: "bg-[hsl(200,90%,50%)]/10",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl border border-white/[0.06] p-8 hover:border-white/[0.1] transition-colors"
            >
              <div className={`w-12 h-12 rounded-2xl ${item.bg} border border-white/[0.05] flex items-center justify-center mb-6`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
