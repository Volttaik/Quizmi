"use client";
import { useState, useEffect, useRef, type ReactElement } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, BookOpen, Trophy, Share2, Timer, Zap, ArrowRight,
  CheckCircle2, XCircle, Check, X as XIcon, Heart, Users, Home,
  GraduationCap, RotateCcw, Link2, Brain, HelpCircle, Lock, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUIZ_TYPE_CONFIG, getResultMessage, type QuizType } from "@/lib/quizTypes";
import { toast } from "sonner";
import ShareModal from "@/components/ShareModal";

interface Question { question: string; options: string[]; correct: number; explanation?: string; imageUrl?: string; }
interface Quiz {
  id: number; title: string; difficulty: string; questions: Question[];
  quizType?: QuizType; subjectName?: string; shareSlug?: string; topic?: string;
  questionCount?: number; isLocked?: boolean;
}

const LABELS = ["A", "B", "C", "D"];
const TIME_PER_Q = 30;

function QuizTypeIcon({ type, className }: { type: QuizType; className?: string }) {
  const icons: Record<QuizType, ReactElement> = {
    study: <BookOpen className={className} />,
    love: <Heart className={className} />,
    friendship: <Users className={className} />,
    family: <Home className={className} />,
    classroom: <GraduationCap className={className} />,
    personality: <Brain className={className} />,
    knowme: <HelpCircle className={className} />,
  };
  return icons[type] ?? <BookOpen className={className} />;
}

function TimerRing({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = timeLeft / total;
  const r = 22; const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct);
  const color = pct > 0.5 ? "#10b981" : pct > 0.25 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-white/20" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circ} strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }} strokeLinecap="round" />
      </svg>
      <span className="text-base font-extrabold" style={{ color }}>{timeLeft}</span>
    </div>
  );
}

export default function PublicQuizPage() {
  const { slug } = useParams() as { slug: string };
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [phase, setPhase] = useState<"locked" | "landing" | "playing" | "done">("landing");
  const [passKeyInput, setPassKeyInput] = useState("");
  const [passKeyError, setPassKeyError] = useState("");
  const [passKeyChecking, setPassKeyChecking] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/quizzes/slug/${slug}`)
      .then((r) => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then((d) => {
        if (d) {
          setQuiz(d);
          if (d.isLocked) setPhase("locked");
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  const handlePassKeySubmit = async () => {
    if (!passKeyInput.trim()) { setPassKeyError("Please enter the passkey"); return; }
    setPassKeyChecking(true);
    setPassKeyError("");
    try {
      const r = await fetch(`/api/quizzes/slug/${slug}?key=${encodeURIComponent(passKeyInput.trim())}`);
      if (r.status === 401) { setPassKeyError("Incorrect passkey. Ask the quiz creator for the right one."); setPassKeyChecking(false); return; }
      if (!r.ok) { setPassKeyError("Something went wrong. Try again."); setPassKeyChecking(false); return; }
      const d = await r.json();
      setQuiz(d);
      setPhase("landing");
    } catch {
      setPassKeyError("Something went wrong. Try again.");
    } finally {
      setPassKeyChecking(false);
    }
  };

  useEffect(() => {
    if (!timedMode || feedback !== null || phase !== "playing") return;
    setTimeLeft(TIME_PER_Q);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); setFeedback("wrong"); setSelected(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current, timedMode, feedback, phase]);

  const type: QuizType = (quiz?.quizType as QuizType) || "study";
  const cfg = QUIZ_TYPE_CONFIG[type];
  const q = quiz?.questions[current];
  const isLast = quiz ? current + 1 >= quiz.questions.length : false;
  const pct = quiz ? Math.round((score / quiz.questions.length) * 100) : 0;

  const handleSelect = (idx: number) => {
    if (feedback || selected !== null || !q) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(idx);
    const correct = idx === q.correct;
    if (correct) {
      setScore((p) => p + 1);
      if (timedMode) setBonusPoints((p) => p + Math.round(timeLeft * 2));
    }
    setFeedback(correct ? "correct" : "wrong");
  };

  const handleNext = () => {
    setFeedback(null);
    if (isLast) {
      setPhase("done");
    } else {
      setCurrent((p) => p + 1);
      setSelected(null);
    }
  };

  const restart = () => {
    setCurrent(0); setSelected(null); setFeedback(null); setScore(0);
    setBonusPoints(0); setPhase("landing");
  };

  const handleCopyLink = async () => {
    const link = window.location.href;
    try { await navigator.clipboard.writeText(link); toast.success("Link copied!"); }
    catch { toast.info(link); }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (notFound || !quiz) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-2">
        <XIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-extrabold text-foreground">Quiz not found</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        This quiz link may be invalid or the quiz was removed.
      </p>
      <a href="/" className="mt-2">
        <Button className="rounded-full">Go to Quizmi</Button>
      </a>
    </div>
  );

  if (phase === "locked") {
    const lockedType: QuizType = (quiz?.quizType as QuizType) || "study";
    const lockedCfg = QUIZ_TYPE_CONFIG[lockedType];
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm flex flex-col items-center text-center gap-5">

          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${lockedCfg.theme.gradient} flex items-center justify-center shadow-xl relative`}>
            <QuizTypeIcon type={lockedType} className="w-11 h-11 text-white/40" />
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg border-2 border-background">
              <Lock className="w-4 h-4 text-white" />
            </div>
          </div>

          <div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-400/30 mb-3 inline-block">
              Private Quiz
            </span>
            <h1 className="text-2xl font-extrabold text-foreground mt-2 mb-2">
              {quiz?.title ?? "Private Quiz"}
            </h1>
            <p className="text-sm text-muted-foreground">
              The creator made this quiz private.{"\n"}Enter the passkey to unlock it.
            </p>
          </div>

          <div className="w-full space-y-3">
            <div className="relative">
              <input
                type="text"
                value={passKeyInput}
                onChange={(e) => { setPassKeyInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setPassKeyError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handlePassKeySubmit()}
                placeholder="Enter passkey (e.g. R3K7PQ)"
                maxLength={6}
                className="w-full rounded-2xl border-2 border-border bg-card px-4 py-4 text-center text-2xl font-black tracking-[0.3em] text-foreground placeholder:text-muted-foreground/50 placeholder:text-base placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:border-violet-400 transition-all"
                autoFocus
              />
            </div>

            {passKeyError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive font-semibold text-center">
                {passKeyError}
              </motion.p>
            )}

            <Button
              onClick={handlePassKeySubmit}
              disabled={passKeyChecking || passKeyInput.length < 1}
              className="w-full rounded-full gap-2"
              size="lg">
              {passKeyChecking
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
                : <><Lock className="w-4 h-4" /> Unlock Quiz</>}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Don't have the passkey? Ask the person who shared this quiz with you.
          </p>
        </motion.div>
      </div>
    );
  }

  if (phase === "done") {
    const subjectName = quiz.subjectName || quiz.topic || "this";
    const banner = getResultMessage(type, subjectName, pct);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          className={`w-full max-w-sm rounded-3xl bg-gradient-to-br ${cfg.theme.resultGradient} p-7 mb-5 flex flex-col items-center text-center shadow-2xl`}
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}>
          <motion.div
            className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-4"
            initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}>
            <QuizTypeIcon type={type} className="w-10 h-10 text-white" />
          </motion.div>
          <motion.div className="text-5xl font-extrabold text-white mb-1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            {pct}%
          </motion.div>
          <motion.p className="text-sm text-white/75 mb-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {score} of {quiz.questions.length} correct
            {timedMode && bonusPoints > 0 && <> &middot; <span className="font-bold">+{bonusPoints} bonus</span></>}
          </motion.p>
          <motion.div className="h-1 w-full rounded-full bg-white/20 overflow-hidden mb-4">
            <motion.div className="h-full rounded-full bg-white"
              initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.5, duration: 0.8 }} />
          </motion.div>
          <motion.p className="text-base font-extrabold text-white"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            {banner}
          </motion.p>
        </motion.div>

        <motion.div className="bg-card border border-border rounded-3xl p-5 w-full max-w-sm mb-4 shadow-card"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Correct", value: score, color: "text-emerald-500" },
              { label: "Wrong", value: quiz.questions.length - score, color: "text-red-500" },
              { label: "Total", value: quiz.questions.length, color: "text-primary" },
            ].map((s) => (
              <div key={s.label}>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="flex gap-3 w-full max-w-sm mb-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
          <Button variant="outline" onClick={restart} className="flex-1 rounded-full gap-2">
            <RotateCcw className="w-4 h-4" /> Try Again
          </Button>
          <a href="/" className="flex-1">
            <Button className="w-full rounded-full">Create Your Own</Button>
          </a>
        </motion.div>

        <motion.div className="w-full max-w-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
          <Button onClick={() => setShareOpen(true)} className="w-full rounded-full gap-2 shadow-elevated" size="lg">
            <Share2 className="w-4 h-4" /> Share My Result
          </Button>
        </motion.div>

        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          quizType={type}
          quizTitle={quiz.title}
          subjectName={quiz.subjectName || quiz.topic || "this"}
          pct={pct}
          banner={banner}
          shareUrl={typeof window !== "undefined" ? window.location.href : ""}
        />
      </div>
    );
  }

  if (phase === "landing") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 pb-12 gap-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${cfg.theme.gradient} flex items-center justify-center mx-auto mb-5 shadow-xl`}>
          <QuizTypeIcon type={type} className="w-11 h-11 text-white" />
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cfg.theme.badge} mb-3 inline-block`}>
          {cfg.label}
        </span>
        <h1 className="text-2xl font-extrabold text-foreground mt-3 mb-2">{quiz.title}</h1>
        {quiz.subjectName && (
          <p className="text-sm text-muted-foreground mb-1">
            About <span className="font-semibold text-foreground">{quiz.subjectName}</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground capitalize">
          {quiz.difficulty} &middot; {quiz.questions.length} questions
        </p>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="text-sm font-bold text-foreground">Choose your mode</motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="w-full max-w-sm space-y-3">
        <button onClick={() => { setTimedMode(false); setPhase("playing"); }}
          className="w-full rounded-2xl border-2 border-border hover:border-primary/40 bg-card p-5 text-left hover:-translate-y-0.5 transition-all shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground">Classic Mode</p>
              <p className="text-xs text-muted-foreground">No timer, take your time</p>
            </div>
          </div>
        </button>
        <button onClick={() => { setTimedMode(true); setPhase("playing"); }}
          className="w-full rounded-2xl border-2 border-orange-400/40 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 p-5 text-left hover:-translate-y-0.5 transition-all shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-400/15 flex items-center justify-center">
              <Timer className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                Timed Mode
                <span className="text-[10px] font-bold bg-orange-400/20 text-orange-500 px-1.5 py-0.5 rounded-full">+BONUS</span>
              </p>
              <p className="text-xs text-muted-foreground">{TIME_PER_Q}s per question &middot; Earn speed bonuses</p>
            </div>
          </div>
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="rounded-2xl bg-muted/40 border border-border/40 p-3.5 flex items-center gap-2.5 w-full max-w-sm">
        <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Made with <span className="font-semibold text-foreground">Quizmi</span> &mdash;{" "}
          <a href="https://quizmi.space/sign-up" target="_blank" rel="noreferrer"
            className="font-semibold text-primary underline underline-offset-2">
            Create your own quiz free
          </a>
        </p>
      </motion.div>
    </div>
  );

  const progressPct = (current / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background pb-16 overflow-hidden">
      <AnimatePresence>
        {feedback === "correct" && q && (
          <motion.div key="correct" className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
            style={{ background: "rgba(16,185,129,0.97)" }}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
            <motion.div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center mb-6"
              initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.05 }}>
              <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={1.5} />
            </motion.div>
            <motion.h2 className="text-3xl font-extrabold text-white mb-1 text-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              Correct!
            </motion.h2>
            {q.explanation && (
              <motion.p className="text-sm text-white/80 text-center max-w-sm mb-6 leading-relaxed"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                {q.explanation}
              </motion.p>
            )}
            <Button onClick={handleNext} className="rounded-full px-10 py-3 text-base font-bold bg-white text-emerald-600 hover:bg-white/90 shadow-xl" size="lg">
              {isLast ? "See Results" : "Next"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
        {feedback === "wrong" && q && selected !== null && (
          <motion.div key="wrong" className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
            style={{ background: "rgba(220,38,38,0.97)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center mb-4"
              initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 0.9, 1.05, 1], x: [0, -8, 8, -5, 5, 0] }} transition={{ duration: 0.5 }}>
              <XCircle className="w-14 h-14 text-white" strokeWidth={1.5} />
            </motion.div>
            <motion.h2 className="text-3xl font-extrabold text-white mb-1 text-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>Not quite!</motion.h2>
            <motion.div className="bg-white/15 rounded-2xl p-4 max-w-sm w-full mb-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <p className="text-xs font-bold text-white/60 uppercase tracking-wide mb-1.5">Correct Answer</p>
              <p className="text-sm font-bold text-white">{LABELS[q.correct]}. {q.options[q.correct]}</p>
            </motion.div>
            {q.explanation && (
              <motion.div className="bg-white/15 rounded-2xl p-4 max-w-sm w-full mb-5"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                <p className="text-xs font-bold text-white/60 uppercase tracking-wide mb-1.5">Explanation</p>
                <p className="text-sm text-white/90 leading-relaxed">{q.explanation}</p>
              </motion.div>
            )}
            <Button onClick={handleNext} className="rounded-full px-10 py-3 text-base font-bold bg-white text-red-600 hover:bg-white/90 shadow-xl" size="lg">
              {isLast ? "See Results" : "Next"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={restart}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-extrabold text-foreground truncate">{quiz.title}</h1>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.theme.badge}`}>
                {cfg.shortLabel}
              </span>
              {timedMode && (
                <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Timer className="w-2.5 h-2.5" /> Timed
                </span>
              )}
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
            <motion.div className={`h-full rounded-full bg-gradient-to-r ${cfg.theme.gradient}`}
              animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
          </div>
          <span className="text-xs font-bold text-muted-foreground w-16 text-right">
            {current + 1} / {quiz.questions.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {q && (
            <motion.div key={current}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}>
              <div className="rounded-3xl bg-card border border-border/60 p-6 mb-4 shadow-card">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: cfg.theme.accent }}>
                  Question {current + 1}
                </p>
                {q.imageUrl && (
                  <div className="rounded-2xl overflow-hidden mb-4 -mx-1 bg-muted/20">
                    <img
                      src={q.imageUrl}
                      alt="Question"
                      className="w-full max-h-52 object-cover"
                      style={{ display: "block" }}
                    />
                  </div>
                )}
                <h2 className="text-base font-bold text-foreground leading-snug">{q.question}</h2>
              </div>
              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrect = i === q.correct;
                  const revealed = feedback !== null;
                  let bgClass = "bg-card border-border/60 hover:border-primary/40 hover:bg-primary/5";
                  let labelBg = "bg-muted text-muted-foreground";
                  let icon: ReactElement | null = null;
                  if (revealed && isCorrect) {
                    bgClass = "bg-emerald-500/10 border-emerald-500";
                    labelBg = "bg-emerald-500 text-white";
                    icon = <Check className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />;
                  } else if (revealed && isSelected && !isCorrect) {
                    bgClass = "bg-red-500/10 border-red-500";
                    labelBg = "bg-red-500 text-white";
                    icon = <XIcon className="w-4 h-4 text-red-500 ml-auto flex-shrink-0" />;
                  }
                  return (
                    <motion.button key={i} onClick={() => handleSelect(i)} disabled={feedback !== null}
                      className={`w-full text-left flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all ${bgClass}`}
                      whileTap={feedback ? {} : { scale: 0.98 }}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 transition-colors ${labelBg}`}>
                        {LABELS[i]}
                      </span>
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
    </div>
  );
}
