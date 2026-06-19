"use client";

import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/forever",
    desc: "Get started",
    features: ["5 quizzes per month", "10 flashcard sets", "Basic AI summaries", "Mobile access"],
    popular: false,
    cta: "Start Free",
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    desc: "For serious students",
    features: ["Unlimited quizzes", "Unlimited flashcards", "Advanced AI summaries", "Spaced repetition", "Study analytics", "Priority support"],
    popular: true,
    cta: "Get Pro",
  },
  {
    name: "Team",
    price: "$29",
    period: "/month",
    desc: "Study groups",
    features: ["Everything in Pro", "Up to 10 members", "Shared study sets", "Collaboration tools", "Admin dashboard", "API access"],
    popular: false,
    cta: "Get Team",
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 tracking-tight">
            Simple pricing,
            <br />
            <span className="text-white/40">no surprises</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-3xl p-8 flex flex-col ${
                plan.popular
                  ? "bg-gradient-to-b from-[hsl(262,72%,55%)] to-[hsl(262,72%,42%)] text-white ring-1 ring-white/20 scale-[1.03] shadow-2xl shadow-primary/30"
                  : "border border-white/[0.06] text-white"
              }`}
            >
              {plan.popular && (
                <div className="flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-5">
                  <Zap className="w-3 h-3" /> Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className={`text-sm ${plan.popular ? "text-white/60" : "text-white/30"}`}>{plan.period}</span>
              </div>
              <p className={`mt-1 text-xs ${plan.popular ? "text-white/60" : "text-white/30"}`}>{plan.desc}</p>

              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? "bg-white/20" : "bg-primary/20"}`}>
                      <Check className={`w-2.5 h-2.5 ${plan.popular ? "text-white" : "text-primary"}`} />
                    </div>
                    <span className={plan.popular ? "text-white/90" : "text-white/50"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/sign-up" className="mt-8">
                <Button
                  className={`w-full rounded-full font-semibold ${
                    plan.popular
                      ? "bg-white text-[hsl(262,72%,45%)] hover:bg-white/90"
                      : "bg-white/[0.04] border border-white/10 text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
