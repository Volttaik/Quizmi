"use client";
import { useEffect, useState, type JSX } from "react";
import { ArrowLeft, Trophy, Medal, Crown, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/dashboard/BottomNav";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  totalScore: number;
  totalQuizzes: number;
  avgScore: number;
  isMe: boolean;
}

const rankColors: Record<number, string> = {
  1: "text-yellow-400 bg-yellow-400/15 border-yellow-400/30",
  2: "text-gray-300 bg-gray-300/15 border-gray-300/30",
  3: "text-orange-400 bg-orange-400/15 border-orange-400/30",
};

const rankIcons: Record<number, JSX.Element> = {
  1: <Crown className="w-4 h-4 text-yellow-400" />,
  2: <Medal className="w-4 h-4 text-gray-300" />,
  3: <Medal className="w-4 h-4 text-orange-400" />,
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const me = entries.find((e) => e.isMe);

  return (
    <div className="min-h-screen bg-background pb-28 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[200px] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,35%)] via-[hsl(265,65%,28%)] to-[hsl(275,60%,22%)]" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-yellow-400/10 rounded-full blur-[80px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-white">Leaderboard</h1>
            <p className="text-xs text-white/50">Top quiz performers</p>
          </div>
          <Trophy className="w-6 h-6 text-yellow-400" />
        </div>

        {/* My rank */}
        {me && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative overflow-hidden rounded-2xl bg-primary/90 p-4 mb-5 shadow-glow-primary"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-[hsl(275,72%,48%)]" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-extrabold text-white">
                #{me.rank}
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/70 font-medium">Your ranking</p>
                <p className="text-sm font-extrabold text-white">{me.name} (You)</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-white">{me.avgScore}%</p>
                <p className="text-[10px] text-white/60">{me.totalQuizzes} quizzes</p>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-10 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">No rankings yet</p>
            <p className="text-xs text-muted-foreground">Complete quizzes to appear here</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-2xl border p-4 flex items-center gap-3 ${
                  entry.isMe
                    ? "bg-primary/10 border-primary/30"
                    : "bg-card border-border/50 shadow-card"
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border text-sm font-extrabold flex-shrink-0 ${
                  rankColors[entry.rank] ?? "bg-muted/50 text-muted-foreground border-border"
                }`}>
                  {rankIcons[entry.rank] ?? <span>#{entry.rank}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${entry.isMe ? "text-primary" : "text-foreground"}`}>
                    {entry.name}{entry.isMe ? " (You)" : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">{entry.totalQuizzes} quizzes</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground font-medium">{entry.totalScore} pts total</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-lg font-extrabold ${entry.rank === 1 ? "text-yellow-500" : entry.isMe ? "text-primary" : "text-foreground"}`}>
                    {entry.avgScore}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">avg score</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && entries.length > 0 && !me && (
          <div className="mt-4 rounded-2xl border border-dashed border-primary/30 p-4 text-center">
            <TrendingUp className="w-6 h-6 text-primary/50 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-medium">Complete a quiz to enter the leaderboard!</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
