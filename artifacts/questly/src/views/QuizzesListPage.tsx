"use client";
import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, ArrowLeft, Loader2, ChevronRight, Trash2, Trophy,
  Clock, Link2, Heart, Users, Home, GraduationCap, Brain, HelpCircle, type LucideProps,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { QuizType } from "@/lib/quizTypes";
import { QUIZ_TYPE_CONFIG } from "@/lib/quizTypes";
import type { FC } from "react";

interface Quiz {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  createdAt: string;
  quizType?: QuizType;
  subjectName?: string;
  shareSlug?: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-[hsl(142,70%,45%)] bg-[hsl(142,70%,45%)]/10",
  medium: "text-[hsl(30,90%,55%)] bg-[hsl(30,90%,55%)]/10",
  hard: "text-[hsl(0,84%,60%)] bg-[hsl(0,84%,60%)]/10",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_ICONS: Record<QuizType, FC<LucideProps>> = {
  study: BookOpen,
  love: Heart,
  friendship: Users,
  family: Home,
  classroom: GraduationCap,
  personality: Brain,
  knowme: HelpCircle,
};

function QuizTypeIcon({ type, className }: { type: QuizType; className?: string }) {
  const Icon = TYPE_ICONS[type] ?? BookOpen;
  return <Icon className={className} />;
}

export default function QuizzesListPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [copying, setCopying] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/quizzes")
      .then((r) => r.json())
      .then((d) => setQuizzes(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Failed to load quizzes"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
      toast.success("Quiz deleted");
    } catch {
      toast.error("Failed to delete quiz");
    } finally {
      setDeleting(null);
    }
  };

  const handleCopyLink = async (quiz: Quiz, e: React.MouseEvent) => {
    e.stopPropagation();
    setCopying(quiz.id);
    const link = quiz.shareSlug
      ? `${window.location.origin}/q/${quiz.shareSlug}`
      : `${window.location.origin}/quiz/${quiz.id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Quiz link copied!");
    } catch {
      toast.info(link);
    } finally {
      setCopying(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard"
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors shadow-card dark:shadow-elevated">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground flex-1">My Quizzes</h1>
          <Button size="sm" className="gap-1.5 rounded-full text-xs font-bold shadow-elevated"
            onClick={() => router.push("/create-quiz")}>
            <Plus className="w-3.5 h-3.5" /> New Quiz
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : quizzes.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl bg-card border border-border p-10 text-center shadow-card dark:shadow-elevated">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-extrabold text-foreground mb-1">No quizzes yet</h2>
            <p className="text-sm text-muted-foreground mb-5">Create a study quiz or a social quiz to get started</p>
            <Button className="rounded-full gap-2 shadow-elevated" onClick={() => router.push("/create-quiz")}>
              <Plus className="w-4 h-4" /> Create Quiz
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {quizzes.map((quiz, i) => {
                const type: QuizType = (quiz.quizType as QuizType) || "study";
                const cfg = QUIZ_TYPE_CONFIG[type];
                const isSocial = type !== "study";
                return (
                  <motion.div key={quiz.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.04 }}>
                    <button
                      onClick={() => router.push(`/quiz/${quiz.id}`)}
                      className="w-full rounded-2xl bg-card border border-border/60 p-4 text-left hover:border-primary/20 hover:-translate-y-0.5 transition-all shadow-card dark:shadow-elevated hover:shadow-card-hover dark:hover:shadow-card-hover">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.theme.iconBg}`}>
                          <QuizTypeIcon type={type} className={`w-5 h-5 ${cfg.theme.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-foreground truncate">{quiz.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.theme.badge}`}>
                              {cfg.shortLabel}
                            </span>
                            {isSocial && quiz.subjectName && (
                              <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[80px]">
                                {quiz.subjectName}
                              </span>
                            )}
                            {!isSocial && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${DIFFICULTY_COLORS[quiz.difficulty] ?? DIFFICULTY_COLORS.medium}`}>
                                {quiz.difficulty}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                              <Trophy className="w-3 h-3" /> {quiz.questionCount} Qs
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                              <Clock className="w-3 h-3" /> {timeAgo(quiz.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => handleCopyLink(quiz, e)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Copy share link">
                            {copying === quiz.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Link2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => handleDelete(quiz.id, e)}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete quiz">
                            {deleting === quiz.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
