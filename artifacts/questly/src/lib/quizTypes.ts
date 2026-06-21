export type QuizType = "study" | "love" | "friendship" | "family" | "classroom";

export const QUIZ_TYPE_CONFIG = {
  study: {
    iconName: "BookOpen",
    label: "Study Quiz",
    shortLabel: "Study",
    description: "Test academic knowledge on any topic",
    theme: {
      gradient: "from-[hsl(262,72%,56%)] via-[hsl(265,72%,48%)] to-[hsl(275,72%,36%)]",
      accent: "hsl(262,72%,56%)",
      badge: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-400/20",
      resultGradient: "from-[hsl(262,72%,52%)] to-[hsl(275,72%,38%)]",
      iconColor: "text-violet-500",
      iconBg: "bg-violet-500/10",
    },
    resultMessages: {
      perfect: (name: string) => `You aced ${name}!`,
      great: (name: string) => `You really know your ${name}!`,
      good: (name: string) => `You are good at ${name}!`,
      keep: (name: string) => `Keep studying ${name}!`,
      low: (name: string) => `Time to hit the books on ${name}!`,
    },
    floatingMessages: {
      good: (_name: string) => "Genius unlocked! 🧠",
      bad: (name: string) => `Hit the books on ${name}! 📚`,
    },
  },
  love: {
    iconName: "Heart",
    label: "Love Quiz",
    shortLabel: "Love",
    description: "How well do they know you?",
    theme: {
      gradient: "from-rose-500 via-pink-500 to-red-500",
      accent: "hsl(340,80%,55%)",
      badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-400/20",
      resultGradient: "from-rose-500 to-pink-600",
      iconColor: "text-rose-500",
      iconBg: "bg-rose-500/10",
    },
    resultMessages: {
      perfect: (name: string) => `You know ${name} inside and out!`,
      great: (name: string) => `You are truly in love with ${name}!`,
      good: (name: string) => `You know ${name} pretty well!`,
      keep: (name: string) => `Still learning about ${name}!`,
      low: (name: string) => `Get to know ${name} better!`,
    },
    floatingMessages: {
      good: (name: string) => `${name} is lucky to have you 💕`,
      bad: (name: string) => `Do you really love ${name}? 💔`,
    },
  },
  friendship: {
    iconName: "Users",
    label: "Friendship Quiz",
    shortLabel: "Friendship",
    description: "Test how well you know your bestie",
    theme: {
      gradient: "from-amber-500 via-orange-500 to-yellow-500",
      accent: "hsl(35,90%,55%)",
      badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-400/20",
      resultGradient: "from-amber-500 to-orange-600",
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500/10",
    },
    resultMessages: {
      perfect: (name: string) => `${name} and you are inseparable!`,
      great: (name: string) => `Best friends for life with ${name}!`,
      good: (name: string) => `A solid friendship with ${name}!`,
      keep: (name: string) => `Still building that bond with ${name}!`,
      low: (name: string) => `Time to hang out with ${name} more!`,
    },
    floatingMessages: {
      good: (_name: string) => "Group for life! 🔥",
      bad: (name: string) => `Do you even know ${name}? 😅`,
    },
  },
  family: {
    iconName: "Home",
    label: "Family Quiz",
    shortLabel: "Family",
    description: "How well do you know your family?",
    theme: {
      gradient: "from-emerald-500 via-teal-500 to-green-600",
      accent: "hsl(158,64%,52%)",
      badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-400/20",
      resultGradient: "from-emerald-500 to-teal-600",
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/10",
    },
    resultMessages: {
      perfect: (_name: string) => `You know your family inside and out!`,
      great: (name: string) => `Family bonds with ${name} are strong!`,
      good: (name: string) => `You know ${name} well!`,
      keep: (name: string) => `Spend more time with ${name}!`,
      low: (name: string) => `Time to connect with ${name}!`,
    },
    floatingMessages: {
      good: (_name: string) => "Family bond is unbreakable! 💪",
      bad: (name: string) => `Call ${name} more often! 📞`,
    },
  },
  classroom: {
    iconName: "GraduationCap",
    label: "Classroom Quiz",
    shortLabel: "Class",
    description: "Challenge your classmates",
    theme: {
      gradient: "from-blue-500 via-indigo-500 to-blue-700",
      accent: "hsl(217,91%,60%)",
      badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-400/20",
      resultGradient: "from-blue-500 to-indigo-600",
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10",
    },
    resultMessages: {
      perfect: (name: string) => `Top of the class in ${name}!`,
      great: (name: string) => `Excellent student in ${name}!`,
      good: (name: string) => `Good work in ${name}!`,
      keep: (name: string) => `Keep studying ${name}!`,
      low: (name: string) => `Review your notes on ${name}!`,
    },
    floatingMessages: {
      good: (_name: string) => "Teacher's favourite! ⭐",
      bad: (name: string) => `Study harder in ${name}! 😬`,
    },
  },
} as const;

export function getFloatingMessage(type: QuizType, subjectName: string, pct: number): string {
  const cfg = QUIZ_TYPE_CONFIG[type];
  const name = subjectName || "this";
  return pct >= 60 ? cfg.floatingMessages.good(name) : cfg.floatingMessages.bad(name);
}

export function getResultMessage(type: QuizType, subjectName: string, pct: number): string {
  const cfg = QUIZ_TYPE_CONFIG[type];
  const name = subjectName || "this";
  if (pct === 100) return cfg.resultMessages.perfect(name);
  if (pct >= 80) return cfg.resultMessages.great(name);
  if (pct >= 60) return cfg.resultMessages.good(name);
  if (pct >= 40) return cfg.resultMessages.keep(name);
  return cfg.resultMessages.low(name);
}

export function generateShareSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 32);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}
