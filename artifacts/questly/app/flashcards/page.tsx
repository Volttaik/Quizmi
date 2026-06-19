"use client";

import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from "react";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowLeft,
  Upload,
  FileText,
  X,
  Sparkles,
  Loader2,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FlashCard {
  front: string;
  back: string;
}

interface FlashCardSet {
  id: number;
  title: string;
  topic: string;
  cards: FlashCard[];
  count: number;
  createdAt: string;
}

const SET_COLORS = [
  "bg-primary/10 text-primary",
  "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]",
  "bg-[hsl(30,90%,55%)]/10 text-[hsl(30,90%,55%)]",
  "bg-[hsl(200,90%,50%)]/10 text-[hsl(200,90%,50%)]",
];

export default function FlashcardsPage() {
  const [sets, setSets] = useState<FlashCardSet[]>([]);
  const [activeView, setActiveView] = useState<"sets" | "study" | "create">("sets");
  const [activeSet, setActiveSet] = useState<FlashCardSet | null>(null);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [cardCount, setCardCount] = useState("20");
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/flashcard-sets")
      .then((r) => r.json())
      .then((d) => setSets(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const next = () => {
    setCurrent((prev) => (prev + 1) % (activeSet?.cards.length ?? 1));
    setFlipped(false);
  };
  const prev = () => {
    setCurrent(
      (prev) =>
        (prev - 1 + (activeSet?.cards.length ?? 1)) %
        (activeSet?.cards.length ?? 1)
    );
    setFlipped(false);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic to generate flashcards");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, cardCount: parseInt(cardCount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate flashcards");
      } else {
        toast.success("Flashcards generated!");
        setSets((prev) => [data, ...prev]);
        setActiveSet(data);
        setCurrent(0);
        setFlipped(false);
        setActiveView("study");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          {activeView !== "sets" ? (
            <button
              onClick={() => setActiveView("sets")}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <h1 className="text-lg font-extrabold text-foreground flex-1">
            {activeView === "study"
              ? activeSet?.title ?? "Study Mode"
              : activeView === "create"
              ? "Create Flashcards"
              : "Flashcard Sets"}
          </h1>
          {activeView === "sets" && (
            <Button
              size="sm"
              className="gap-1.5 rounded-full text-xs font-bold"
              onClick={() => setActiveView("create")}
            >
              <Plus className="w-3.5 h-3.5" /> New Set
            </Button>
          )}
        </div>

        {activeView === "create" ? (
          <div className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl bg-card border-2 border-dashed border-border hover:border-primary/40 p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={handleFileDrop}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1">Upload study material</p>
                  <p className="text-xs text-muted-foreground">PDF, TXT, DOC — AI generates flashcards</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-bold text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
              <div>
                <Label className="text-xs font-bold">Topic</Label>
                <Input className="mt-1.5" placeholder="e.g. Biology, Chemistry" value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-bold">Number of Cards</Label>
                <Select value={cardCount} onValueChange={setCardCount}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 cards</SelectItem>
                    <SelectItem value="20">20 cards</SelectItem>
                    <SelectItem value="30">30 cards</SelectItem>
                    <SelectItem value="50">50 cards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleGenerate} className="w-full rounded-full gap-2" size="lg" disabled={generating}>
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Flashcards</>
              )}
            </Button>
          </div>
        ) : activeView === "study" && activeSet ? (
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground font-medium mb-4">
              {current + 1} / {activeSet.cards.length}
            </span>
            <div className="w-full cursor-pointer mb-6" onClick={() => setFlipped(!flipped)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${current}-${flipped}`}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-2xl p-8 min-h-[240px] flex items-center justify-center text-center ${
                    flipped
                      ? "bg-gradient-to-br from-[hsl(262,72%,55%)] to-[hsl(270,72%,40%)] text-white shadow-xl shadow-primary/20"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${flipped ? "text-white/50" : "text-muted-foreground"}`}>
                      {flipped ? "Answer" : "Question"}
                    </p>
                    <p className="text-base font-bold leading-relaxed">
                      {flipped ? activeSet.cards[current].back : activeSet.cards[current].front}
                    </p>
                    <p className={`text-[10px] mt-4 ${flipped ? "text-white/30" : "text-muted-foreground"}`}>
                      Tap to flip
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={prev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={() => setFlipped(false)}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10" onClick={next}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sets.length === 0 ? (
              <div className="rounded-2xl bg-card border border-border p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground mb-1">No flashcard sets yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create your first set with AI</p>
                <Button size="sm" className="rounded-full gap-1.5" onClick={() => setActiveView("create")}>
                  <Sparkles className="w-3.5 h-3.5" /> Create Set
                </Button>
              </div>
            ) : (
              sets.map((set, i) => (
                <button
                  key={set.id}
                  onClick={() => {
                    setActiveSet(set);
                    setCurrent(0);
                    setFlipped(false);
                    setActiveView("study");
                  }}
                  className="w-full rounded-2xl bg-card border border-border p-4 text-left hover:border-primary/20 transition-colors flex items-center gap-3"
                >
                  <div className={`w-11 h-11 rounded-2xl ${SET_COLORS[i % SET_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                    <Layers className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">{set.title}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{set.count} cards</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
