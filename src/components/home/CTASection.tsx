"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Users, Home, GraduationCap, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const types = [
  { icon: Heart, label: "Love", color: "text-rose-400", bg: "bg-rose-400/10" },
  { icon: Users, label: "Friendship", color: "text-amber-400", bg: "bg-amber-400/10" },
  { icon: Home, label: "Family", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { icon: GraduationCap, label: "Classroom", color: "text-sky-400", bg: "bg-sky-400/10" },
  { icon: BookOpen, label: "Study", color: "text-violet-400", bg: "bg-violet-400/10" },
];

export default function CTASection() {
  return (
    <section className="py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl border border-white/[0.07] p-12 md:p-20 text-center overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 rounded-full blur-[130px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-20 w-[300px] h-[300px] bg-rose-500/6 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-10 -right-20 w-[300px] h-[300px] bg-sky-500/6 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative">
            {/* Quiz type pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {types.map((t) => {
                const Icon = t.icon;
                return (
                  <span key={t.label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${t.bg} ${t.color} text-xs font-semibold border border-white/[0.06]`}>
                    <Icon className="w-3 h-3" />
                    {t.label}
                  </span>
                );
              })}
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Who really knows you?
              <br />
              <span className="text-white/40">Find out today.</span>
            </h2>
            <p className="text-sm text-white/40 max-w-md mx-auto mb-10">
              Build your quiz in seconds, share the link, and get a personalised result for every person who takes it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="rounded-full px-10 text-sm font-bold shadow-xl shadow-primary/30 w-full sm:w-auto">
                  Create Your Quiz <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-10 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5 border border-white/10 w-full sm:w-auto"
                >
                  Already have an account?
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
