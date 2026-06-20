"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Trophy } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/dashboard/BottomNav";
import { motion } from "framer-motion";

interface Achievement {
  id: number;
  type: string;
  unlockedAt: string;
}

const ALL_ACHIEVEMENTS = [
  { type: "first_quiz", emoji: "🎯", title: "First Quiz", desc: "Complete your first quiz" },
  { type: "quiz_10", emoji: "🔟", title: "Quiz Enthusiast", desc: "Complete 10 quizzes" },
  { type: "quiz_50", emoji: "💯", title: "Quiz Master", desc: "Complete 50 quizzes" },
  { type: "streak_3", emoji: "🔥", title: "On Fire", desc: "Maintain a 3-day streak" },
  { type: "streak_7", emoji: "⚡", title: "Week Warrior", desc: "Maintain a 7-day streak" },
  { type: "streak_30", emoji: "🏆", title: "Monthly Legend", desc: "Maintain a 30-day streak" },
  { type: "first_flashcard", emoji: "🃏", title: "Card Creator", desc: "Create your first flashcard set" },
  { type: "flashcard_5", emoji: "📚", title: "Flashcard Fan", desc: "Create 5 flashcard sets" },
];

export default function AchievementsPage() {
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((d) => setUnlocked(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unlockedTypes = new Set(unlocked.map((a) => a.type));
  const unlockedCount = unlockedTypes.size;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="absolute top-0 left-0 right-0 h-[180px] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,35%)] via-[hsl(265,65%,28%)] to-[hsl(40,90%,30%)]" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-yellow-400/15 rounded-full blur-[80px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/profile" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-white">Achievements</h1>
            <p className="text-xs text-white/50">{unlockedCount} / {ALL_ACHIEVEMENTS.length} unlocked</p>
          </div>
          <Trophy className="w-6 h-6 text-yellow-400" />
        </div>

        {/* Progress bar */}
        <div className="mb-6 mt-3">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${(unlockedCount / ALL_ACHIEVEMENTS.length) * 100}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ALL_ACHIEVEMENTS.map((ach, i) => {
            const isUnlocked = unlockedTypes.has(ach.type);
            const achievement = unlocked.find((a) => a.type === ach.type);

            return (
              <motion.div
                key={ach.type}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-2xl border p-4 flex flex-col items-center text-center gap-2 relative overflow-hidden ${
                  isUnlocked
                    ? "bg-gradient-to-b from-yellow-400/10 to-orange-400/5 border-yellow-400/30 shadow-[0_2px_16px_rgba(251,191,36,0.12)]"
                    : "bg-card border-border/40 opacity-50"
                }`}
              >
                {isUnlocked && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  </div>
                )}
                <div className={`text-4xl ${!isUnlocked ? "grayscale" : ""}`}>{ach.emoji}</div>
                <div>
                  <p className={`text-sm font-extrabold ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                    {ach.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{ach.desc}</p>
                </div>
                {!isUnlocked && (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                )}
                {isUnlocked && achievement && (
                  <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
