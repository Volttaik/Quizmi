"use client";
import { motion } from "framer-motion";
import { Upload, Sparkles, BookOpen } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Upload,
    title: "Upload Your Material",
    desc: "Drop in your lecture notes, textbook pages, or any study content. PDF, text, images — we handle it all.",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "AI Does the Heavy Lifting",
    desc: "Our AI analyzes your content, identifies key concepts, and generates quizzes, flashcards, and summaries.",
  },
  {
    num: "03",
    icon: BookOpen,
    title: "Study & Master",
    desc: "Review with adaptive tools that learn how you learn. Track progress and master every concept.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 relative">
      <div className="absolute left-1/2 top-0 w-px h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent hidden md:block" />
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            Three steps to
            <br />
            <span className="text-white/40">mastery</span>
          </h2>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`flex flex-col md:flex-row items-center gap-8 py-12 ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
            >
              <div className="flex-1 text-center md:text-left">
                <span className="text-6xl font-black text-white/[0.04]">{step.num}</span>
                <h3 className="text-xl font-bold text-white -mt-6 mb-3">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed max-w-sm">{step.desc}</p>
              </div>
              <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
