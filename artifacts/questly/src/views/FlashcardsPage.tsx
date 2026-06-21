"use client";
import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import {
  RotateCcw, ChevronLeft, ChevronRight, Layers, ArrowLeft,
  Upload, FileText, X, Sparkles, Loader2, Plus, Share2,
  ThumbsUp, ThumbsDown, Meh, Brain, Calendar,
} from "lucide-react";
import { shareContent } from "@/lib/share";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FlashCard { front: string; back: string; }
interface FlashCardSet { id: number; title: string; topic: string; cards: FlashCard[]; count: number; createdAt: string; }
interface ReviewData { cardIndex: number; easeFactor: number; interval: number; repetitions: number; nextReview: string; }

const SET_COLORS = [
  "bg-primary/10 text-primary",
  "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]",
  "bg-[hsl(30,90%,55%)]/10 text-[hsl(30,90%,55%)]",
  "bg-[hsl(200,90%,50%)]/10 text-[hsl(200,90%,50%)]",
];

function isDue(review: ReviewData): boolean {
  return new Date(review.nextReview) <= new Date();
}

export default function FlashcardsPage() {
  const [sets, setSets] = useState<FlashCardSet[]>([]);
  const [activeView, setActiveView] = useState<"sets" | "study" | "create">("sets");
  const [activeSet, setActiveSet] = useState<FlashCardSet | null>(null);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [cardCount, setCardCount] = useState("20");
  const [generating, setGenerating] = useState(false);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [srMode, setSrMode] = useState(false);
  const [srQueue, setSrQueue] = useState<number[]>([]);
  const [srIndex, setSrIndex] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/flashcard-sets")
      .then((r) => r.json())
      .then((d) => setSets(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const loadReviews = async (setId: number) => {
    try {
      const res = await fetch(`/api/flashcard-reviews?setId=${setId}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch {}
  };

  const startStudy = (set: FlashCardSet) => {
    setActiveSet(set);
    setCurrent(0); setFlipped(false); setSrIndex(0); setRating(null);
    setActiveView("study");
    loadReviews(set.id);
  };

  const startSR = (set: FlashCardSet) => {
    setActiveSet(set);
    const due: number[] = [];
    for (let i = 0; i < set.cards.length; i++) {
      const rv = reviews.find((r) => r.cardIndex === i);
      if (!rv || isDue(rv)) due.push(i);
    }
    setSrQueue(due.length > 0 ? due : Array.from({ length: set.cards.length }, (_, i) => i));
    setSrIndex(0); setFlipped(false); setRating(null); setSrMode(true);
    setActiveView("study");
  };

  const currentCardIndex = srMode ? srQueue[srIndex] : current;
  const activeCard = activeSet?.cards[currentCardIndex] ?? null;
  const totalCards = srMode ? srQueue.length : (activeSet?.cards.length ?? 0);
  const currentPos = srMode ? srIndex : current;

  const next = () => { if (srMode) { setSrIndex((p) => Math.min(p + 1, srQueue.length - 1)); } else { setCurrent((p) => (p + 1) % (activeSet?.cards.length ?? 1)); } setFlipped(false); setRating(null); };
  const prev = () => { if (srMode) { setSrIndex((p) => Math.max(p - 1, 0)); } else { setCurrent((p) => (p - 1 + (activeSet?.cards.length ?? 1)) % (activeSet?.cards.length ?? 1)); } setFlipped(false); setRating(null); };

  const handleRate = async (r: number) => {
    if (!activeSet || currentCardIndex === undefined) return;
    setRating(r);
    try {
      await fetch("/api/flashcard-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId: activeSet.id, cardIndex: currentCardIndex, rating: r }),
      });
      await loadReviews(activeSet.id);
      toast.success(r >= 4 ? "Got it! Review in a few days 📅" : r >= 3 ? "Good! See you tomorrow" : "We'll show this again soon");
      setTimeout(() => {
        if (srMode) {
          if (srIndex < srQueue.length - 1) next();
          else toast.success("All due cards reviewed! Great work 🎉");
        } else next();
      }, 600);
    } catch { toast.error("Failed to save rating"); }
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !fileContent) { toast.error("Enter a topic or upload a study material"); return; }
    setGenerating(true);
    try {
      const body: Record<string, unknown> = { cardCount: parseInt(cardCount) };
      if (topic.trim()) body.topic = topic.trim();
      if (fileContent) { body.fileContent = fileContent; body.fileName = file?.name ?? "Uploaded File"; }
      const res = await fetch("/api/generate-flashcards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) toast.error(data.error ?? "Failed to generate flashcards");
      else {
        toast.success("Flashcards generated!");
        setSets((p) => [data, ...p]);
        startStudy(data);
      }
    } catch { toast.error("Something went wrong"); }
    finally { setGenerating(false); }
  };

  const dueCount = (set: FlashCardSet) => {
    let c = 0;
    for (let i = 0; i < set.cards.length; i++) {
      const rv = reviews.find((r) => r.cardIndex === i);
      if (!rv || isDue(rv)) c++;
    }
    return c;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          {activeView !== "sets" ? (
            <button onClick={() => { setActiveView("sets"); setSrMode(false); }} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Link href="/dashboard" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <h1 className="text-lg font-extrabold text-foreground flex-1">
            {activeView === "study" ? (srMode ? `Spaced Repetition (${srIndex + 1}/${srQueue.length})` : (activeSet?.title ?? "Study Mode")) : activeView === "create" ? "Create Flashcards" : "Flashcard Sets"}
          </h1>
          {activeView === "sets" && (
            <Button size="sm" className="gap-1.5 rounded-full text-xs font-bold" onClick={() => setActiveView("create")}>
              <Plus className="w-3.5 h-3.5" /> New Set
            </Button>
          )}
        </div>

        {activeView === "create" ? (
          <div className="space-y-4">
            <div onClick={() => fileRef.current?.click()} className="rounded-2xl bg-card border-2 border-dashed border-border hover:border-primary/40 p-8 text-center cursor-pointer transition-colors">
              <input ref={fileRef} type="file" accept=".txt,.md,.doc,.docx" className="hidden"
                onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setFile(f); try { setFileContent(await f.text()); } catch { toast.error("Could not read file"); setFile(null); setFileContent(""); } }} />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
                  <div className="text-left"><p className="text-sm font-bold text-foreground">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p></div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); setFileContent(""); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3"><Upload className="w-6 h-6 text-primary" /></div>
                  <p className="text-sm font-bold text-foreground mb-1">Upload study material</p>
                  <p className="text-xs text-muted-foreground">PDF, TXT, DOC — AI generates flashcards</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs font-bold text-muted-foreground">OR</span><div className="flex-1 h-px bg-border" /></div>
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <div><Label className="text-xs font-bold">Topic</Label><Input className="mt-1.5" placeholder="e.g. Biology, Chemistry" value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
              <div><Label className="text-xs font-bold">Number of Cards</Label>
                <Select value={cardCount} onValueChange={setCardCount}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["10","20","30","50"].map((v) => <SelectItem key={v} value={v}>{v} cards</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} className="w-full rounded-full gap-2" size="lg" disabled={generating}>
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Flashcards</>}
            </Button>
          </div>

        ) : activeView === "study" && activeSet && activeCard ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs text-muted-foreground font-medium">{currentPos + 1} / {totalCards}</span>
              {srMode && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Brain className="w-3 h-3" /> Spaced Repetition</span>}
            </div>

            <div className="w-full cursor-pointer mb-5" onClick={() => { if (!rating) setFlipped(!flipped); }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentCardIndex}-${flipped}`}
                  initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-2xl p-8 min-h-[240px] flex items-center justify-center text-center ${
                    flipped ? "bg-gradient-to-br from-[hsl(262,72%,55%)] to-[hsl(270,72%,40%)] text-white shadow-xl shadow-primary/20" : "bg-card border border-border text-foreground"
                  }`}
                >
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${flipped ? "text-white/50" : "text-muted-foreground"}`}>{flipped ? "Answer" : "Question"}</p>
                    <p className="text-base font-bold leading-relaxed">{flipped ? activeCard.back : activeCard.front}</p>
                    {!flipped && <p className={`text-[10px] mt-4 text-muted-foreground`}>Tap to flip</p>}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {srMode && flipped ? (
              <div className="w-full space-y-2">
                <p className="text-xs text-center text-muted-foreground font-medium mb-3">How well did you know this?</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleRate(1)} disabled={rating !== null}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all active:scale-95 disabled:opacity-60">
                    <ThumbsDown className="w-5 h-5 text-red-500" />
                    <span className="text-[11px] font-bold text-red-500">Forgot</span>
                    <span className="text-[10px] text-muted-foreground">Review again</span>
                  </button>
                  <button onClick={() => handleRate(3)} disabled={rating !== null}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-all active:scale-95 disabled:opacity-60">
                    <Meh className="w-5 h-5 text-yellow-500" />
                    <span className="text-[11px] font-bold text-yellow-500">Hard</span>
                    <span className="text-[10px] text-muted-foreground">Tomorrow</span>
                  </button>
                  <button onClick={() => handleRate(5)} disabled={rating !== null}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-60">
                    <ThumbsUp className="w-5 h-5 text-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-500">Easy</span>
                    <span className="text-[10px] text-muted-foreground">In a few days</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={prev}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={() => { setFlipped(false); setRating(null); }}><RotateCcw className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={next}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            )}
          </div>

        ) : (
          <div className="space-y-3">
            {sets.length === 0 ? (
              <div className="rounded-2xl bg-card border border-border p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3"><Layers className="w-5 h-5 text-muted-foreground" /></div>
                <p className="text-sm font-bold text-foreground mb-1">No flashcard sets yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create your first set with AI</p>
                <Button size="sm" className="rounded-full gap-1.5" onClick={() => setActiveView("create")}><Sparkles className="w-3.5 h-3.5" /> Create Set</Button>
              </div>
            ) : sets.map((set, i) => {
              const due = dueCount(set);
              return (
                <motion.div key={set.id} initial={{ opacity: 0 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-card">
                    <div className="flex items-center gap-3 mb-3" onClick={() => startStudy(set)} style={{ cursor: "pointer" }}>
                      <div className={`w-11 h-11 rounded-2xl ${SET_COLORS[i % SET_COLORS.length]} flex items-center justify-center flex-shrink-0`}><Layers className="w-5 h-5" strokeWidth={1.8} /></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">{set.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-medium">{set.count} cards</span>
                          {due > 0 && <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {due} due</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startStudy(set)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/15 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5" /> Study All
                      </button>
                      <button onClick={() => { loadReviews(set.id).then(() => startSR(set)); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-orange-500/10 text-orange-500 text-xs font-bold hover:bg-orange-500/15 transition-colors">
                        <Brain className="w-3.5 h-3.5" /> Smart Review
                      </button>
                      <button onClick={async () => {
                        const result = await shareContent({ title: set.title, text: `Study "${set.title}" flashcards on Quizmi!` });
                        if (result === "copied") toast.success("Link copied!"); else if (result === "shared") toast.success("Shared!");
                      }} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
