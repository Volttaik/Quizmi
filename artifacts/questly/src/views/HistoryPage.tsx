"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Brain, BookOpen, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/dashboard/BottomNav";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string;
  createdAt: string;
}

interface QuizAttempt {
  id: number;
  quizId: number;
  score: number;
  total: number;
  completedAt: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function TypeIcon({ type, amount }: { type: string; amount: number }) {
  if (type === "purchase") return <Zap className="w-4 h-4 text-yellow-500" />;
  if (amount < 0 && type === "usage") {
    const d = typeof type === "string" ? type : "";
    return <Brain className="w-4 h-4 text-purple-400" />;
  }
  return <TrendingUp className="w-4 h-4 text-green-500" />;
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [tab, setTab] = useState<"credits" | "quizzes">("credits");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/credits/transactions").then((r) => r.json()).catch(() => []),
      fetch("/api/quiz-attempts").then((r) => r.json()).catch(() => []),
    ]).then(([txs, atts]) => {
      setTransactions(Array.isArray(txs) ? txs : []);
      setAttempts(Array.isArray(atts) ? atts : []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="absolute top-0 left-0 right-0 h-[160px] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,35%)] via-[hsl(265,65%,30%)] to-[hsl(275,60%,24%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <h1 className="text-lg font-extrabold text-white">History</h1>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("credits")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === "credits" ? "bg-primary text-white" : "bg-card text-muted-foreground"}`}
          >
            Credits
          </button>
          <button
            onClick={() => setTab("quizzes")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === "quizzes" ? "bg-primary text-white" : "bg-card text-muted-foreground"}`}
          >
            Quiz Results
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && tab === "credits" && (
          <div className="space-y-3">
            {transactions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No credit history yet</p>
                <p className="text-xs opacity-60 mt-1">Use AI features to see your activity here</p>
              </div>
            )}
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-card rounded-2xl p-4 flex items-center gap-3 border border-border/40">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? "bg-green-500/10" : "bg-primary/10"}`}>
                  <TypeIcon type={tx.type} amount={tx.amount} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{formatTime(tx.createdAt)}</p>
                </div>
                <span className={`text-sm font-extrabold ${tx.amount > 0 ? "text-green-500" : "text-red-400"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "quizzes" && (
          <div className="space-y-3">
            {attempts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No quiz attempts yet</p>
                <p className="text-xs opacity-60 mt-1">Take a quiz to see your results here</p>
              </div>
            )}
            {attempts.map((a) => {
              const pct = Math.round((a.score / a.total) * 100);
              return (
                <div key={a.id} className="bg-card rounded-2xl p-4 flex items-center gap-3 border border-border/40">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pct >= 80 ? "bg-green-500/10" : pct >= 60 ? "bg-yellow-500/10" : "bg-red-500/10"}`}>
                    <Trophy className={`w-5 h-5 ${pct >= 80 ? "text-green-500" : pct >= 60 ? "text-yellow-500" : "text-red-400"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Quiz #{a.quizId}</p>
                    <p className="text-xs text-muted-foreground">{a.score}/{a.total} correct · {formatTime(a.completedAt)}</p>
                  </div>
                  <span className={`text-lg font-extrabold ${pct >= 80 ? "text-green-500" : pct >= 60 ? "text-yellow-500" : "text-red-400"}`}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
