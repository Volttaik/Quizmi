"use client";
import Link from "next/link";
import { CreditCard, GraduationCap, BookMarked, ScrollText, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  {
    icon: GraduationCap,
    label: "My Quizzes",
    desc: "View & take quizzes",
    path: "/quizzes",
    iconBg: "bg-[hsl(262,72%,55%)]/10 dark:bg-[hsl(262,72%,55%)]/15",
    iconColor: "text-primary",
    glow: "hsl(262,72%,55%)",
  },
  {
    icon: Sparkles,
    label: "AI Summary",
    desc: "Summarize any topic",
    path: "/summary",
    iconBg: "bg-[hsl(200,90%,50%)]/10 dark:bg-[hsl(200,90%,50%)]/15",
    iconColor: "text-[hsl(200,90%,50%)]",
    glow: "hsl(200,90%,50%)",
  },
  {
    icon: BookMarked,
    label: "Flashcards",
    desc: "Notes → flashcards",
    path: "/flashcards",
    iconBg: "bg-[hsl(30,90%,55%)]/10 dark:bg-[hsl(30,90%,55%)]/15",
    iconColor: "text-[hsl(30,90%,55%)]",
    glow: "hsl(30,90%,55%)",
  },
  {
    icon: CreditCard,
    label: "Buy Credits",
    desc: "Top up your balance",
    path: "/buy-credits",
    iconBg: "bg-[hsl(142,70%,45%)]/10 dark:bg-[hsl(142,70%,45%)]/15",
    iconColor: "text-[hsl(142,70%,45%)]",
    glow: "hsl(142,70%,45%)",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const card = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function ActionCards() {
  return (
    <motion.div
      className="grid grid-cols-2 gap-3 mb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {actions.map(({ icon: Icon, label, desc, path, iconBg, iconColor }) => (
        <motion.div key={label} variants={card}>
          <Link
            href={path}
            className="group rounded-2xl bg-card border border-border/60 p-4 shadow-card dark:shadow-elevated hover:shadow-card-hover dark:hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/20 transition-all duration-200 block"
          >
            <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-200`}>
              <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.8} />
            </div>
            <h4 className="text-sm font-extrabold text-foreground mb-0.5 leading-tight">{label}</h4>
            <div className="flex items-center justify-between gap-1">
              <p className="text-[11px] text-muted-foreground leading-tight font-medium">{desc}</p>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
