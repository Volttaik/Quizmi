import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ArrowRight, RotateCcw, ArrowLeft, Loader2 } from "lucide-react";
import { useLocation, useParams, Link } from "wouter";

interface Question { question: string; options: string[]; correct: number; }
interface Quiz { id: number; title: string; questions: Question[]; }

export default function QuizPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch(`/api/quizzes/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setQuiz(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const q = quiz?.questions[current];

  const handleSelect = (idx: number) => {
    if (answered || !q) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct) setScore((p) => p + 1);
  };

  const handleNext = async () => {
    if (!quiz) return;
    if (current + 1 >= quiz.questions.length) {
      await fetch("/api/quiz-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, score, total: quiz.questions.length }),
      }).catch(() => {});
      setFinished(true);
    } else {
      setCurrent((p) => p + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const restart = () => { setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false); };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!quiz) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Quiz not found.</p>
      <Link to="/dashboard"><Button className="rounded-full">Back to Dashboard</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-bold text-foreground flex-1">{quiz.title}</h1>
        </div>

        {finished ? (
          <div className="rounded-2xl bg-card border border-border p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Quiz Complete!</h2>
            <p className="text-3xl font-bold text-primary mb-1">{Math.round((score / quiz.questions.length) * 100)}%</p>
            <p className="text-sm text-muted-foreground mb-6">{score} out of {quiz.questions.length} correct</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={restart} className="rounded-full gap-2 text-sm"><RotateCcw className="w-3.5 h-3.5" /> Retry</Button>
              <Button onClick={() => setLocation("/dashboard")} className="rounded-full gap-2 text-sm">Dashboard <ArrowRight className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ) : q && (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">Question {current + 1} of {quiz.questions.length}</span>
              <span className="text-xs font-bold text-foreground">Score: {score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted mb-6">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} />
            </div>
            <div className="rounded-2xl bg-card border border-border p-6">
              <h2 className="text-base font-bold text-foreground mb-6">{q.question}</h2>
              <div className="space-y-2.5">
                {q.options.map((opt, i) => {
                  let cls = "border-border hover:border-primary/30";
                  if (answered && i === q.correct) cls = "border-primary bg-primary/5";
                  if (answered && i === selected && i !== q.correct) cls = "border-destructive bg-destructive/5";
                  return (
                    <button key={i} onClick={() => handleSelect(i)} className={`w-full text-left p-3.5 rounded-xl border ${cls} flex items-center gap-3 transition-colors`}>
                      <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">{String.fromCharCode(65 + i)}</span>
                      <span className="text-sm font-medium text-foreground">{opt}</span>
                      {answered && i === q.correct && <CheckCircle className="w-4 h-4 text-primary ml-auto" />}
                      {answered && i === selected && i !== q.correct && <XCircle className="w-4 h-4 text-destructive ml-auto" />}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <Button onClick={handleNext} className="w-full mt-5 rounded-full text-sm">
                  {current + 1 >= quiz.questions.length ? "See Results" : "Next Question"} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
