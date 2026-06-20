"use client";
import { useState, useEffect, useRef, type ReactElement } from "react";
import { ArrowLeft, RotateCcw, ArrowRight, Loader2, BookOpen, Trophy, Share2, Timer, Zap } from "lucide-react";
import { shareContent } from "@/lib/share";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/dashboard/BottomNav";

interface Question { question: string; options: string[]; correct: number; explanation?: string; reference?: string; }
interface Quiz { id: number; title: string; difficulty: string; questions: Question[]; }

const LABELS = ["A", "B", "C", "D"];
const TIME_PER_Q = 30;

function ConfettiPiece({ delay }: { delay: number }) {
  const colors = ["#7c3aed","#10b981","#f59e0b","#ef4444","#3b82f6","#ec4899"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = (Math.random() - 0.5) * 300;
  const rotation = Math.random() * 720 - 360;
  return (
    <motion.div
      style={{ backgroundColor: color, position: "absolute", top: "40%", left: "50%", width: 10, height: 10, borderRadius: Math.random() > 0.5 ? "50%" : 2 }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
      animate={{ x, y: -200 - Math.random() * 200, opacity: 0, scale: 0.3, rotate: rotation }}
      transition={{ duration: 1.2, delay, ease: "easeOut" }}
    />
  );
}

function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = timeLeft / total;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct);
  const color = pct > 0.5 ? "#10b981" : pct > 0.25 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }} strokeLinecap="round" />
      </svg>
      <span className="text-base font-extrabold" style={{ color }}>{timeLeft}</span>
    </div>
  );
}

function CorrectModal({ question, onNext, isLast, bonus }: { question: Question; onNext: () => void; isLast: boolean; bonus: number }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: "rgba(16,185,129,0.97)" }}
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
      <div style={{ position: "relative" }}>
        {Array.from({ length: 16 }).map((_, i) => <ConfettiPiece key={i} delay={i * 0.04} />)}
        <motion.div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center mb-6"
          initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.05 }}>
          <span style={{ fontSize: 56 }}>✅</span>
        </motion.div>
      </div>
      <motion.h2 className="text-3xl font-extrabold text-white mb-1 text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        Correct! 🎉
      </motion.h2>
      {bonus > 0 && (
        <motion.div className="flex items-center gap-1.5 bg-white/25 px-4 py-1.5 rounded-full mb-3"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Zap className="w-3.5 h-3.5 text-yellow-300" />
          <span className="text-sm font-extrabold text-white">+{bonus} speed bonus!</span>
        </motion.div>
      )}
      {question.reference && (
        <motion.div className="bg-white/20 rounded-2xl px-4 py-2.5 mb-4 max-w-sm w-full"
          initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-start gap-2">
            <BookOpen className="w-3.5 h-3.5 text-white/80 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-white/90 leading-snug">{question.reference}</p>
          </div>
        </motion.div>
      )}
      {question.explanation && (
        <motion.p className="text-sm text-white/80 text-center max-w-sm mb-6 leading-relaxed"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          {question.explanation}
        </motion.p>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button onClick={onNext} className="rounded-full px-10 py-3 text-base font-bold bg-white text-emerald-600 hover:bg-white/90 shadow-xl" size="lg">
          {isLast ? "See Results 🏆" : "Next Question →"}
        </Button>
      </motion.div>
    </motion.div>
  );
}

function WrongModal({ question, selected, onNext, isLast }: { question: Question; selected: number; onNext: () => void; isLast: boolean; }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: "rgba(220,38,38,0.97)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <motion.div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center mb-4"
        initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 0.9, 1.05, 1], x: [0, -8, 8, -5, 5, 0] }} transition={{ duration: 0.5, delay: 0.05 }}>
        <span style={{ fontSize: 56 }}>❌</span>
      </motion.div>
      <motion.h2 className="text-3xl font-extrabold text-white mb-1 text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>Not quite!</motion.h2>
      <motion.p className="text-sm text-white/70 mb-5 text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        You chose: <span className="font-bold text-white/90">{question.options[selected]}</span>
      </motion.p>
      <motion.div className="bg-white/15 rounded-2xl p-4 max-w-sm w-full mb-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <p className="text-xs font-bold text-white/60 uppercase tracking-wide mb-1.5">Correct Answer</p>
        <p className="text-sm font-bold text-white">{LABELS[question.correct]}. {question.options[question.correct]}</p>
      </motion.div>
      {question.explanation && (
        <motion.div className="bg-white/15 rounded-2xl p-4 max-w-sm w-full mb-5"
          initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <p className="text-xs font-bold text-white/60 uppercase tracking-wide mb-1.5">Explanation</p>
          <p className="text-sm text-white/90 leading-relaxed">{question.explanation}</p>
          {question.reference && (
            <div className="flex items-start gap-1.5 mt-2.5 pt-2.5 border-t border-white/20">
              <BookOpen className="w-3 h-3 text-white/50 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/60">{question.reference}</p>
            </div>
          )}
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Button onClick={onNext} className="rounded-full px-10 py-3 text-base font-bold bg-white text-red-600 hover:bg-white/90 shadow-xl" size="lg">
          {isLast ? "See Results" : "Next Question →"}
        </Button>
      </motion.div>
    </motion.div>
  );
}

function ResultsScreen({ score, total, quiz, onRestart, onDash, bonusPoints, timedMode }: {
  score: number; total: number; quiz: Quiz; onRestart: () => void; onDash: () => void; bonusPoints: number; timedMode: boolean;
}) {
  const pct = Math.round((score / total) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "👍" : pct >= 40 ? "📚" : "💪";
  const msg = pct === 100 ? "Perfect score!" : pct >= 80 ? "Excellent work!" : pct >= 60 ? "Good effort!" : pct >= 40 ? "Keep studying!" : "Don't give up!";
  const totalScore = score + bonusPoints;
  return (
    <motion.div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}>
        <span style={{ fontSize: 60 }}>{emoji}</span>
      </motion.div>
      <motion.h1 className="text-2xl font-extrabold text-foreground mb-1 text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>{msg}</motion.h1>
      <motion.p className="text-muted-foreground text-sm mb-6 text-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>{quiz.title}</motion.p>
      <motion.div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm mb-6 shadow-card"
        initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="text-center mb-4">
          <span className="text-6xl font-extrabold text-primary">{pct}%</span>
          <p className="text-sm text-muted-foreground mt-1">{score} of {total} correct</p>
          {timedMode && bonusPoints > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-xs font-bold text-yellow-600 dark:text-yellow-400">
              <Zap className="w-3.5 h-3.5" /> +{bonusPoints} speed bonus → {totalScore} total pts
            </div>
          )}
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }}
            animate={{ width: `${pct}%` }} transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Correct", value: score, color: "text-emerald-500" },
            { label: "Wrong", value: total - score, color: "text-red-500" },
            { label: timedMode ? "Bonus" : "Total", value: timedMode ? bonusPoints : total, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div className="flex gap-3 w-full max-w-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Button variant="outline" onClick={onRestart} className="flex-1 rounded-full gap-2"><RotateCcw className="w-4 h-4" /> Retry</Button>
        <Button onClick={onDash} className="flex-1 rounded-full gap-2">Dashboard <ArrowRight className="w-4 h-4" /></Button>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
        <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground text-xs mt-2"
          onClick={async () => {
            const result = await shareContent({ title: `Quiz Result — ${pct}%`, text: `I just scored ${pct}% (${score}/${total}) on "${quiz.title}"! Study smarter with Quizmi 🧠` });
            if (result === "copied") toast.success("Score copied!"); else if (result === "shared") toast.success("Shared!");
          }}>
          <Share2 className="w-3.5 h-3.5" /> Share Result
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function QuizPage() {
  const router = useRouter();
  const rawParams = useParams();
  const params = { id: rawParams?.id as string };
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [currentBonus, setCurrentBonus] = useState(0);
  const [showModeSelect, setShowModeSelect] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/quizzes/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setQuiz(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!timedMode || feedback !== null || !quiz || showModeSelect) return;
    setTimeLeft(TIME_PER_Q);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setFeedback("wrong");
          setSelected(-1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, timedMode, feedback, showModeSelect]);

  const q = quiz?.questions[current];
  const isLast = quiz ? current + 1 >= quiz.questions.length : false;

  const handleSelect = (idx: number) => {
    if (feedback || selected !== null || !q) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(idx);
    const correct = idx === q.correct;
    if (correct) {
      setScore((p) => p + 1);
      const bonus = timedMode ? Math.round(timeLeft * 2) : 0;
      setCurrentBonus(bonus);
      setBonusPoints((p) => p + bonus);
    } else {
      setCurrentBonus(0);
    }
    setFeedback(correct ? "correct" : "wrong");
  };

  const handleNext = async () => {
    if (!quiz) return;
    setFeedback(null);
    setCurrentBonus(0);
    if (isLast) {
      await fetch("/api/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, score, total: quiz.questions.length, bonusPoints, timeTaken: quiz.questions.length * TIME_PER_Q }),
      }).catch(() => {});
      await fetch("/api/streak", { method: "POST" }).catch(() => {});
      setFinished(true);
    } else {
      setCurrent((p) => p + 1);
      setSelected(null);
    }
  };

  const restart = () => { setCurrent(0); setSelected(null); setFeedback(null); setScore(0); setBonusPoints(0); setCurrentBonus(0); setFinished(false); setShowModeSelect(true); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!quiz) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
      <p className="text-muted-foreground text-center">Quiz not found.</p>
      <Link href="/dashboard"><Button className="rounded-full">Back to Dashboard</Button></Link>
    </div>
  );

  if (showModeSelect) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-24 gap-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-10 h-10 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-extrabold text-foreground mb-1">{quiz.title}</h1>
        <p className="text-muted-foreground text-sm capitalize">{quiz.difficulty} • {quiz.questions.length} questions</p>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-sm font-bold text-foreground">Choose your mode</motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="w-full max-w-sm space-y-3">
        <button onClick={() => { setTimedMode(false); setShowModeSelect(false); }}
          className="w-full rounded-2xl border-2 border-border hover:border-primary/40 bg-card p-5 text-left hover:-translate-y-0.5 transition-all shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Trophy className="w-6 h-6 text-primary" /></div>
            <div>
              <p className="text-sm font-extrabold text-foreground">Classic Mode</p>
              <p className="text-xs text-muted-foreground">No timer, take your time</p>
            </div>
          </div>
        </button>
        <button onClick={() => { setTimedMode(true); setShowModeSelect(false); }}
          className="w-full rounded-2xl border-2 border-orange-400/40 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 p-5 text-left hover:-translate-y-0.5 transition-all shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-400/15 flex items-center justify-center"><Timer className="w-6 h-6 text-orange-500" /></div>
            <div>
              <p className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                Timed Mode <span className="text-[10px] font-bold bg-orange-400/20 text-orange-500 px-1.5 py-0.5 rounded-full">+BONUS</span>
              </p>
              <p className="text-xs text-muted-foreground">{TIME_PER_Q}s per question · Earn speed bonuses</p>
            </div>
          </div>
        </button>
      </motion.div>
    </div>
  );

  if (finished) return (
    <>
      <ResultsScreen score={score} total={quiz.questions.length} quiz={quiz} onRestart={restart} onDash={() => router.push("/dashboard")} bonusPoints={bonusPoints} timedMode={timedMode} />
      <BottomNav />
    </>
  );

  const pct = (current / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background pb-28 overflow-hidden">
      <AnimatePresence>
        {feedback === "correct" && q && <CorrectModal key="correct" question={q} onNext={handleNext} isLast={isLast} bonus={currentBonus} />}
        {feedback === "wrong" && q && selected !== null && <WrongModal key="wrong" question={q} selected={selected} onNext={handleNext} isLast={isLast} />}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/quizzes" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-extrabold text-foreground truncate">{quiz.title}</h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-muted-foreground capitalize">{quiz.difficulty} difficulty</p>
              {timedMode && <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Timer className="w-2.5 h-2.5" /> Timed</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timedMode && <TimerRing timeLeft={timeLeft} total={TIME_PER_Q} />}
            <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-extrabold text-primary">{score}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${pct}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
          </div>
          <span className="text-xs font-bold text-muted-foreground w-16 text-right">{current + 1} / {quiz.questions.length}</span>
        </div>

        <AnimatePresence mode="wait">
          {q && (
            <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
              <div className="rounded-3xl bg-card border border-border/60 p-6 mb-4 shadow-card dark:shadow-elevated">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Question {current + 1}</p>
                <h2 className="text-base font-bold text-foreground leading-snug">{q.question}</h2>
              </div>
              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrect = i === q.correct;
                  const revealed = feedback !== null;
                  let bgClass = "bg-card border-border/60 hover:border-primary/40 hover:bg-primary/5";
                  let labelBg = "bg-muted text-muted-foreground";
                  let icon: null | ReactElement = null;
                  if (revealed && isCorrect) { bgClass = "bg-emerald-500/10 border-emerald-500"; labelBg = "bg-emerald-500 text-white"; icon = <span className="text-emerald-500 text-lg ml-auto">✓</span>; }
                  else if (revealed && isSelected && !isCorrect) { bgClass = "bg-red-500/10 border-red-500"; labelBg = "bg-red-500 text-white"; icon = <span className="text-red-500 text-lg ml-auto">✗</span>; }
                  return (
                    <motion.button key={i} onClick={() => handleSelect(i)} disabled={feedback !== null}
                      className={`w-full text-left flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all ${bgClass}`}
                      whileTap={feedback ? {} : { scale: 0.98 }} initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 transition-colors ${labelBg}`}>{LABELS[i]}</span>
                      <span className="text-sm font-semibold text-foreground leading-snug flex-1">{opt}</span>
                      {icon}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
