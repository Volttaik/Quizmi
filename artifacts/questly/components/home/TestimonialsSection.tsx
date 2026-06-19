"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Quizmi turned my chaotic notes into a full quiz in seconds. My exam score jumped from a C to an A.",
    name: "Sarah K.",
    role: "Medical Student",
    initials: "SK",
    color: "from-primary to-[hsl(270,72%,40%)]",
    stars: 5,
  },
  {
    quote: "The flashcard feature is incredible. Spaced repetition actually works — I remembered everything on test day.",
    name: "James O.",
    role: "Law Student",
    initials: "JO",
    color: "from-[hsl(142,70%,45%)] to-[hsl(160,70%,35%)]",
    stars: 5,
  },
  {
    quote: "I used to spend hours making study guides. Now I paste my notes and AI does it in 10 seconds.",
    name: "Aisha M.",
    role: "Engineering Student",
    initials: "AM",
    color: "from-[hsl(200,90%,50%)] to-[hsl(220,90%,40%)]",
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Testimonials</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            Students who
            <br />
            <span className="text-white/40">love Quizmi</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl border border-white/[0.06] p-7 hover:border-white/[0.12] transition-colors relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 opacity-[0.06]">
                <Quote className="w-12 h-12 text-white" />
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <span key={s} className="text-[hsl(45,95%,55%)] text-sm">★</span>
                ))}
              </div>

              <p className="text-sm text-white/65 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-black text-white`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-white/30">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
