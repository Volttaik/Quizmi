"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
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
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    desc: "For serious students",
    features: ["Unlimited quizzes", "Unlimited flashcards", "Advanced AI summaries", "Spaced repetition", "Study analytics", "Priority support"],
    popular: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "/month",
    desc: "Study groups",
    features: ["Everything in Pro", "Up to 10 members", "Shared study sets", "Collaboration tools", "Admin dashboard", "API access"],
    popular: false,
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

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-3xl p-8 flex flex-col ${
                plan.popular
                  ? "bg-gradient-to-b from-[hsl(262,72%,55%)] to-[hsl(262,72%,42%)] text-white ring-1 ring-white/20 scale-[1.03]"
                  : "border border-white/[0.06] text-white"
              }`}
            >
              {plan.popular && (
                <span className="inline-flex self-start px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-4">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`text-sm ${plan.popular ? "text-white/60" : "text-white/30"}`}>{plan.period}</span>
              </div>
              <p className={`mt-1 text-xs ${plan.popular ? "text-white/60" : "text-white/30"}`}>{plan.desc}</p>

              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? "text-white/80" : "text-primary"}`} />
                    <span className={plan.popular ? "text-white/90" : "text-white/50"}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/sign-up" className="mt-8">
                <Button
                  className={`w-full rounded-full ${
                    plan.popular
                      ? "bg-white text-[hsl(262,72%,45%)] hover:bg-white/90 font-semibold"
                      : "bg-white/[0.04] border border-white/10 text-white hover:bg-white/[0.08]"
                  }`}
                >
                  Get Started
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
