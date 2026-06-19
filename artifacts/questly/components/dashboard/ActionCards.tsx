"use client";

import Link from "next/link";
import { CreditCard, GraduationCap, BookMarked, ScrollText, ArrowRight } from "lucide-react";

const actions = [
  {
    icon: CreditCard,
    label: "Buy Credits",
    desc: "Top up your study credits",
    path: "/buy-credits",
    bg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: GraduationCap,
    label: "Create Quiz",
    desc: "Make quizzes in seconds",
    path: "/create-quiz",
    bg: "bg-[hsl(142,70%,45%)]/10",
    iconColor: "text-[hsl(142,70%,45%)]",
  },
  {
    icon: BookMarked,
    label: "Flashcards",
    desc: "Turn notes into flashcards",
    path: "/flashcards",
    bg: "bg-[hsl(30,90%,55%)]/10",
    iconColor: "text-[hsl(30,90%,55%)]",
  },
  {
    icon: ScrollText,
    label: "AI Summary",
    desc: "Summarize any topic instantly",
    path: "/summary",
    bg: "bg-[hsl(200,90%,50%)]/10",
    iconColor: "text-[hsl(200,90%,50%)]",
  },
];

export default function ActionCards() {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {actions.map(({ icon: Icon, label, desc, path, bg, iconColor }) => (
        <Link
          key={label}
          href={path}
          className="rounded-2xl bg-card border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all group"
        >
          <div
            className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center mb-3`}
          >
            <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.8} />
          </div>
          <h4 className="text-sm font-extrabold text-foreground mb-0.5">
            {label}
          </h4>
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] text-muted-foreground leading-tight font-medium">
              {desc}
            </p>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  );
}
