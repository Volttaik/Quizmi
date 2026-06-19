import { motion } from "framer-motion";
import { Users, Trophy, Star, TrendingUp } from "lucide-react";

const stats = [
  { value: "250K+", label: "Active Students", icon: Users },
  { value: "1.2M", label: "Quizzes Created", icon: Trophy },
  { value: "4.8★", label: "App Rating", icon: Star },
  { value: "98%", label: "Pass Rate Boost", icon: TrendingUp },
];

export default function StatsBar() {
  return (
    <div className="relative py-16 border-y border-white/[0.05]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none" />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`text-center flex flex-col items-center gap-2 ${i < 3 ? "md:border-r md:border-white/[0.06]" : ""}`}
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl md:text-4xl font-black text-white tracking-tight">{stat.value}</p>
              <p className="text-xs text-white/30 font-medium uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
