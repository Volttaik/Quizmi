"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Questly turned my chaotic notes into a full quiz in seconds. My exam score jumped from a C to an A.",
    name: "Sarah K.",
    role: "Medical Student",
    initials: "SK",
  },
  {
    quote: "The flashcard feature is incredible. Spaced repetition actually works — I remembered everything on test day.",
    name: "James O.",
    role: "Law Student",
    initials: "JO",
  },
  {
    quote: "I used to spend hours making study guides. Now I paste my notes and the AI does it in 10 seconds.",
    name: "Aisha M.",
    role: "Engineering Student",
    initials: "AM",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-28">
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
            <span className="text-white/40">love Questly</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl border border-white/[0.06] p-8"
            >
              <p className="text-sm text-white/60 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
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
