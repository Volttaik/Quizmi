import { Link } from "wouter";
import { CreditCard, GraduationCap, BookMarked, ScrollText, ArrowRight } from "lucide-react";

const actions = [
  {
    icon: CreditCard,
    label: "Buy Credits",
    desc: "Top up your credits",
    path: "/buy-credits",
    iconBg: "bg-[hsl(262,72%,55%)]/12 dark:bg-[hsl(262,72%,55%)]/15",
    iconColor: "text-primary",
    shadowColor: "hover:shadow-primary/10",
  },
  {
    icon: GraduationCap,
    label: "Create Quiz",
    desc: "AI quiz in seconds",
    path: "/create-quiz",
    iconBg: "bg-[hsl(142,70%,45%)]/12 dark:bg-[hsl(142,70%,45%)]/15",
    iconColor: "text-[hsl(142,70%,45%)]",
    shadowColor: "hover:shadow-[hsl(142,70%,45%)]/10",
  },
  {
    icon: BookMarked,
    label: "Flashcards",
    desc: "Notes → flashcards",
    path: "/flashcards",
    iconBg: "bg-[hsl(30,90%,55%)]/12 dark:bg-[hsl(30,90%,55%)]/15",
    iconColor: "text-[hsl(30,90%,55%)]",
    shadowColor: "hover:shadow-[hsl(30,90%,55%)]/10",
  },
  {
    icon: ScrollText,
    label: "AI Summary",
    desc: "Summarize any topic",
    path: "/summary",
    iconBg: "bg-[hsl(200,90%,50%)]/12 dark:bg-[hsl(200,90%,50%)]/15",
    iconColor: "text-[hsl(200,90%,50%)]",
    shadowColor: "hover:shadow-[hsl(200,90%,50%)]/10",
  },
];

export default function ActionCards() {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {actions.map(({ icon: Icon, label, desc, path, iconBg, iconColor, shadowColor }) => (
        <Link
          key={label}
          to={path}
          className={`group rounded-2xl bg-card border border-border/60 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_28px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_6px_28px_rgba(0,0,0,0.40)] ${shadowColor} hover:-translate-y-0.5 hover:border-primary/20 transition-all duration-200`}
        >
          <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center mb-3 shadow-sm`}>
            <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.8} />
          </div>
          <h4 className="text-sm font-extrabold text-foreground mb-0.5">{label}</h4>
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] text-muted-foreground leading-tight font-medium">{desc}</p>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  );
}
