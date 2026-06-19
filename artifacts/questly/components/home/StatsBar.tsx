"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "250K+", label: "Active Students" },
  { value: "1.2M", label: "Quizzes Created" },
  { value: "4.8", label: "App Store Rating" },
  { value: "98%", label: "Pass Rate Improvement" },
];

export default function StatsBar() {
  return (
    <div className="relative py-16 border-y border-white/[0.04]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`text-center ${i < 3 ? "md:border-r md:border-white/[0.06]" : ""}`}
            >
              <p className="text-3xl md:text-4xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/30 mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
