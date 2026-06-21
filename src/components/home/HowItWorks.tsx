"use client";
import { motion } from "framer-motion";
import { PenLine, Sparkles, Link2, Trophy } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: PenLine,
    title: "Pick your quiz type",
    desc: "Choose from Love, Friendship, Family, Classroom, or Study. Each type comes with its own theme and question style.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "AI builds it for you",
    desc: "Describe the subject or paste your notes. Our AI generates smart, personalised questions in seconds.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  {
    num: "03",
    icon: Link2,
    title: "Share the link",
    desc: "Every quiz gets a unique shareable link. Send it to anyone — they don't need an account to take it.",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
  },
  {
    num: "04",
    icon: Trophy,
    title: "See your results",
    desc: "Get a personalised result banner — \"You know Sarah inside out!\" — and share your score with the world.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            From idea to quiz
            <br />
            <span className="text-white/40">in under a minute</span>
          </h2>
        </motion.div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className={`relative rounded-2xl border ${step.border} bg-white/[0.02] p-7 flex gap-5 items-start`}
            >
              <div className={`w-12 h-12 rounded-2xl ${step.bg} border ${step.border} flex items-center justify-center flex-shrink-0`}>
                <step.icon className={`w-5 h-5 ${step.color}`} />
              </div>
              <div>
                <span className="text-4xl font-black text-white/[0.04] leading-none block -mb-2">{step.num}</span>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
