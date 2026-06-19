"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Globe } from "lucide-react";

const perks = [
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Generate a full quiz from any topic in under 10 seconds. No waiting, no frustration.",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    desc: "Your study materials stay yours. We never share, sell, or train on your content.",
  },
  {
    icon: Globe,
    title: "Study Anywhere",
    desc: "Mobile-first design. Pick up exactly where you left off on any device.",
  },
];

export default function GetMoreSection() {
  return (
    <section className="py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">More reasons</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            Why students love
            <br />
            <span className="text-white/40">Questly</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {perks.map((perk, i) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
                <perk.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{perk.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{perk.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
