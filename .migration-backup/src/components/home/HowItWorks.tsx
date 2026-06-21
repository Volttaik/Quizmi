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
    <section id="how-it-works" className="py-28 relative overflow-hidden">
      {/* Full-section diffuse glow — no hard edges */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(ellipse_60%_70%_at_70%_50%,hsl(280,72%,40%,0.14)_0%,transparent_70%)]" />
      </div>

      <div className="absolute left-1/2 top-0 w-px h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent hidden md:block" />

      <div className="container mx-auto px-4 relative z-10">
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

        {/* Steps + floating girl side-by-side on desktop */}
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-0">

          {/* Steps column */}
          <div className="flex-1 space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex items-start gap-6 py-10"
              >
                <div className="w-14 h-14 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-1">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="text-5xl font-black text-white/[0.04] leading-none block -mb-2">{step.num}</span>
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed max-w-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Girl with phone — seamless blend, no separate glow div */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex justify-center items-center"
          >
            <img
              src="/hero-phone-2.png"
              alt="Quizmi Study"
              className="w-[280px] sm:w-[340px] md:w-[400px] h-auto object-contain"
              style={{
                maskImage: [
                  "radial-gradient(ellipse 90% 100% at 50% 50%, black 28%, transparent 68%)",
                  "linear-gradient(to bottom, black 15%, black 55%, transparent 88%)",
                ].join(", "),
                WebkitMaskImage: [
                  "radial-gradient(ellipse 90% 100% at 50% 50%, black 28%, transparent 68%)",
                  "linear-gradient(to bottom, black 15%, black 55%, transparent 88%)",
                ].join(", "),
                maskComposite: "intersect",
                WebkitMaskComposite: "source-in",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
