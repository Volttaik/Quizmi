"use client";

import { Zap, Brain, Layers, Target } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Zap,
    title: "AI-Generated Quizzes",
    desc: "Paste your notes. Get a full quiz in seconds. Our AI understands context, creates targeted questions, and adapts to your level.",
    gradient: "from-[hsl(262,72%,55%)]/20 to-transparent",
  },
  {
    icon: Brain,
    title: "Smart Summaries",
    desc: "Extract the essence of any material. Key concepts, definitions, and relationships — distilled into crystal clear summaries.",
    gradient: "from-[hsl(262,83%,58%)]/15 to-transparent",
  },
  {
    icon: Layers,
    title: "Adaptive Flashcards",
    desc: "Spaced repetition that actually works. Cards reappear at the perfect moment — right before you forget.",
    gradient: "from-[hsl(199,89%,48%)]/15 to-transparent",
  },
  {
    icon: Target,
    title: "Pinpoint Concepts",
    desc: "Identify exactly which topics you struggle with. Focus your time where it matters, skip what you already know.",
    gradient: "from-[hsl(142,70%,45%)]/12 to-transparent",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-28 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Features</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            Everything you need to
            <br />
            <span className="text-white/40">ace every exam</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-3xl border border-white/[0.06] p-8 md:p-10 overflow-hidden hover:border-white/[0.12] transition-colors"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
