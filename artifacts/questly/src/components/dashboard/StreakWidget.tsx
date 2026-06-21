"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Calendar } from "lucide-react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
}

export default function StreakWidget() {
  const [data, setData] = useState<StreakData | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/streak")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});

    fetch("/api/streak", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.newAchievements?.length > 0) {
          setNewAchievements(d.newAchievements);
        }
      })
      .catch(() => {});
  }, []);

  const streak = data?.currentStreak ?? 0;
  const flameColor = streak >= 7 ? "#f97316" : streak >= 3 ? "#fb923c" : "#fbbf24";

  return (
    <div className="rounded-2xl bg-card border border-border/50 p-3.5 mb-4 shadow-card dark:shadow-elevated">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div
            className="relative"
            animate={streak > 0 ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${flameColor}20` }}
            >
              <Flame className="w-5 h-5" style={{ color: flameColor }} />
            </div>
            {streak > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 border-2 border-card flex items-center justify-center">
                <span className="text-[7px] font-black text-white">{streak}</span>
              </div>
            )}
          </motion.div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-foreground">{streak}</span>
              <span className="text-xs font-semibold text-muted-foreground">day streak</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {streak === 0
                ? "Start studying to begin!"
                : streak === 1
                ? "Great start! Come back tomorrow"
                : `${streak} days strong!`}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" />
            <span className="font-bold text-foreground text-xs">{data?.longestStreak ?? 0}</span>
            <span>best</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="font-bold text-foreground text-xs">{data?.totalStudyDays ?? 0}</span>
            <span>total days</span>
          </div>
        </div>
      </div>

      {streak > 0 && (
        <div className="mt-3 flex items-center gap-1">
          {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 400 }}
              className="flex-1 h-1.5 rounded-full"
              style={{ background: `linear-gradient(to right, ${flameColor}80, ${flameColor})` }}
            />
          ))}
          {streak < 7 && Array.from({ length: 7 - streak }).map((_, i) => (
            <div key={`empty-${i}`} className="flex-1 h-1.5 rounded-full bg-muted" />
          ))}
        </div>
      )}

      {newAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-1.5 bg-yellow-500/10 px-3 py-2 rounded-xl"
        >
          <Trophy className="w-3.5 h-3.5" /> Achievement unlocked!
        </motion.div>
      )}
    </div>
  );
}
