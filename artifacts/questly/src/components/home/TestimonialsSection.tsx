import { motion } from "framer-motion";

const stats = [
  { value: "10s", label: "Quiz generated from notes", icon: "⚡" },
  { value: "AI", label: "Powered by Gemini AI", icon: "🤖" },
  { value: "∞", label: "Study possibilities", icon: "📚" },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Why Quizmi</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            Built for
            <br />
            <span className="text-white/40">serious learners</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl border border-white/[0.06] p-8 text-center hover:border-primary/20 transition-colors"
            >
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="text-4xl font-black text-primary mb-2">{s.value}</div>
              <p className="text-sm text-white/50 leading-relaxed">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
