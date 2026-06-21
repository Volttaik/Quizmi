"use client";
import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowLeft, Upload, FileText, X, ArrowRight, Loader2,
  AlertCircle, BookOpen, Heart, Users, Home, GraduationCap, Wand2, Link2,
  PenLine, Plus, Trash2, CheckCircle2, Circle,
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as pdfjsLib from "pdfjs-dist";
import type { QuizType } from "@/lib/quizTypes";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => item.str).join(" "));
  }
  return pages.join("\n").trim();
}

const SOCIAL_TYPES: {
  type: QuizType;
  icon: React.ReactNode;
  label: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    type: "love",
    icon: <Heart className="w-5 h-5" />,
    label: "Love Quiz",
    desc: "How well do they know you?",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-400/30",
  },
  {
    type: "friendship",
    icon: <Users className="w-5 h-5" />,
    label: "Friendship Quiz",
    desc: "Test your bestie!",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-400/30",
  },
  {
    type: "family",
    icon: <Home className="w-5 h-5" />,
    label: "Family Quiz",
    desc: "Know your family?",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/30",
  },
  {
    type: "classroom",
    icon: <GraduationCap className="w-5 h-5" />,
    label: "Classroom Quiz",
    desc: "Challenge your class!",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-400/30",
  },
];

type Step = "category" | "social-type" | "social-details" | "study-details";

export default function CreateQuizPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("category");
  const [quizType, setQuizType] = useState<QuizType>("study");
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [useAiPrompt, setUseAiPrompt] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [customCount, setCustomCount] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [socialMode, setSocialMode] = useState<"ai" | "manual">("ai");
  const [manualQuestions, setManualQuestions] = useState<
    { question: string; options: [string, string, string, string]; correct: number }[]
  >([{ question: "", options: ["", "", "", ""], correct: 0 }]);
  const [creating, setCreating] = useState(false);

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileContent("");
    setExtracting(true);
    try {
      let text: string;
      if (f.name.toLowerCase().endsWith(".pdf")) {
        toast.info("Reading PDF…");
        text = await extractTextFromPDF(f);
        if (!text) {
          toast.error("Could not extract text from this PDF. Try a text-based PDF.");
          setFile(null); setFileContent(""); setExtracting(false); return;
        }
      } else {
        text = await f.text();
      }
      setFileContent(text);
      toast.success(`File ready — ${text.length.toLocaleString()} characters`);
    } catch {
      toast.error("Could not read file. Try .txt, .md, or text-based PDF.");
      setFile(null); setFileContent("");
    } finally {
      setExtracting(false);
    }
  };

  const getQuestionCount = (): number => {
    if (questionCount === "custom") {
      const n = parseInt(customCount);
      return isNaN(n) || n < 1 ? 10 : Math.min(n, 200);
    }
    return parseInt(questionCount);
  };

  const handleGenerate = async () => {
    const count = getQuestionCount();
    const isSocial = quizType !== "study";

    if (isSocial) {
      if (!subjectName.trim() && !aiPrompt.trim()) {
        toast.error("Please enter a name or describe your quiz");
        return;
      }
    } else {
      if (!fileContent && !topic.trim()) {
        toast.error("Please upload a study material or enter a topic");
        return;
      }
      if (file && !fileContent) {
        toast.error("Still reading the file — please wait");
        return;
      }
    }

    setGenerating(true);
    try {
      const body: Record<string, unknown> = { questionCount: count, difficulty, quizType };

      if (isSocial) {
        body.subjectName = subjectName.trim();
        if (useAiPrompt && aiPrompt.trim()) {
          body.aiPrompt = aiPrompt.trim();
        } else if (description.trim()) {
          body.description = description.trim();
        }
      } else {
        if (fileContent) {
          body.fileContent = fileContent;
          body.fileName = file?.name ?? "Uploaded File";
          if (topic.trim()) body.topic = topic.trim();
        } else {
          body.topic = topic.trim();
        }
      }

      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate quiz");
      } else {
        toast.success("Quiz created!");
        router.push(`/quiz/${data.id}`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateManual = async () => {
    if (!subjectName.trim()) { toast.error("Please enter a name for this quiz"); return; }
    const valid = manualQuestions.every((q) => q.question.trim() && q.options.every((o) => o.trim()));
    if (!valid) { toast.error("Please fill in all questions and options"); return; }
    if (manualQuestions.length < 1) { toast.error("Add at least one question"); return; }
    const typeLabels: Record<string, string> = { love: "Love Quiz", friendship: "Friendship Quiz", family: "Family Quiz", classroom: "Quiz" };
    const title = `${subjectName.trim()}'s ${typeLabels[quizType] ?? "Quiz"}`;
    setCreating(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, topic: subjectName.trim(), quizType, subjectName: subjectName.trim(), questions: manualQuestions.map((q) => ({ question: q.question, options: q.options, correct: q.correct })) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to create quiz"); }
      else { toast.success("Quiz created!"); router.push(`/quiz/${data.id}`); }
    } catch { toast.error("Something went wrong"); }
    finally { setCreating(false); }
  };

  const updateManualQ = (i: number, field: "question", val: string) =>
    setManualQuestions((qs) => qs.map((q, idx) => idx === i ? { ...q, [field]: val } : q));
  const updateManualOption = (qi: number, oi: number, val: string) =>
    setManualQuestions((qs) => qs.map((q, idx) => idx === qi ? { ...q, options: q.options.map((o, j) => j === oi ? val : o) as [string,string,string,string] } : q));
  const addManualQ = () => setManualQuestions((qs) => [...qs, { question: "", options: ["", "", "", ""], correct: 0 }]);
  const removeManualQ = (i: number) => setManualQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const hasFile = !!file && !!fileContent;
  const fileReady = hasFile && !extracting;

  const stepTitle: Record<Step, string> = {
    category: "Choose what kind of quiz to make",
    "social-type": "Choose quiz type",
    "social-details": "Quiz details",
    "study-details": "Study quiz settings",
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-6">
          {step !== "category" ? (
            <button
              onClick={() => setStep(step === "social-details" ? "social-type" : "category")}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors shadow-card">
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Link href="/quizzes"
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors shadow-card">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-foreground">Create Quiz</h1>
            <p className="text-xs text-muted-foreground">{stepTitle[step]}</p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">

          {step === "category" && (
            <motion.div key="category"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-3">

              <button onClick={() => { setQuizType("study"); setStep("study-details"); }}
                className="w-full rounded-2xl border-2 border-border hover:border-primary/40 bg-card p-5 text-left hover:-translate-y-0.5 transition-all shadow-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-foreground">Study Quiz</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload a file or enter any topic — AI generates the questions
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </button>

              <button onClick={() => setStep("social-type")}
                className="w-full rounded-2xl border-2 border-rose-400/30 bg-gradient-to-br from-rose-500/5 via-amber-500/5 to-blue-500/5 p-5 text-left hover:-translate-y-0.5 transition-all shadow-card">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-rose-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-foreground">Social Quiz</p>
                      <span className="text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-400/20">
                        NEW
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Love, friendship, family, classroom — share with anyone
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </button>

              <div className="rounded-2xl bg-muted/40 border border-border/50 p-4 flex items-start gap-3">
                <Link2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Social quizzes automatically generate a shareable link — anyone can take it without signing up.
                </p>
              </div>
            </motion.div>
          )}

          {step === "social-type" && (
            <motion.div key="social-type"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-3">
              {SOCIAL_TYPES.map((t) => (
                <button key={t.type}
                  onClick={() => { setQuizType(t.type); setStep("social-details"); }}
                  className={`w-full rounded-2xl border-2 ${t.border} bg-card p-5 text-left hover:-translate-y-0.5 transition-all shadow-card`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${t.bg} flex items-center justify-center flex-shrink-0 ${t.color}`}>
                      {t.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-foreground">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === "social-details" && (
            <motion.div key="social-details"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4">

              {/* Name field — always shown */}
              <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
                <Label className="text-xs font-bold">
                  {quizType === "classroom" ? "Subject or class name" : "Who is this quiz about?"}
                </Label>
                <Input
                  className="mt-1.5"
                  placeholder={quizType === "classroom" ? "e.g. Mathematics 101, Biology Class" : "e.g. Sarah, John, Mom"}
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  maxLength={80}
                />
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2">
                <button onClick={() => setSocialMode("manual")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs font-bold transition-all ${socialMode === "manual" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-border/80"}`}>
                  <PenLine className="w-3.5 h-3.5" /> Write it myself
                </button>
                <button onClick={() => setSocialMode("ai")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs font-bold transition-all ${socialMode === "ai" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-border/80"}`}>
                  <Sparkles className="w-3.5 h-3.5" /> Tell AI
                </button>
              </div>

              {socialMode === "manual" ? (
                <div className="space-y-3">
                  {manualQuestions.map((q, qi) => (
                    <div key={qi} className="rounded-2xl bg-card border border-border p-4 space-y-3 shadow-card">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-black text-primary mt-2.5 w-5 flex-shrink-0">Q{qi + 1}</span>
                        <Input
                          placeholder="Enter your question"
                          value={q.question}
                          onChange={(e) => updateManualQ(qi, "question", e.target.value)}
                          className="flex-1"
                        />
                        {manualQuestions.length > 1 && (
                          <button onClick={() => removeManualQ(qi)} className="mt-2 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <button onClick={() => setManualQuestions((qs) => qs.map((qq, idx) => idx === qi ? { ...qq, correct: oi } : qq))}
                              className="flex-shrink-0">
                              {q.correct === oi
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                : <Circle className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            <Input
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              value={opt}
                              onChange={(e) => updateManualOption(qi, oi, e.target.value)}
                              className={`flex-1 text-sm ${q.correct === oi ? "border-emerald-400/50 bg-emerald-500/5" : ""}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Tap the circle to mark the correct answer</p>
                    </div>
                  ))}
                  <button onClick={addManualQ}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-border text-xs font-bold text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                  <div className="rounded-2xl bg-muted/40 border border-border/40 p-3.5 flex items-start gap-2.5">
                    <Link2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Auto shareable link</p>
                      <p className="text-[10px] text-muted-foreground">A unique link is generated automatically — no credits used.</p>
                    </div>
                  </div>
                  <Button onClick={handleCreateManual} className="w-full rounded-full gap-2 shadow-elevated" size="lg" disabled={creating}>
                    {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><PenLine className="w-4 h-4" /> Create Quiz <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-card">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setUseAiPrompt(false)}
                        className={`flex-1 rounded-xl border-2 p-3 text-center text-xs font-bold transition-all ${!useAiPrompt ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-border/80"}`}>
                        Describe the person
                      </button>
                      <button onClick={() => setUseAiPrompt(true)}
                        className={`flex-1 rounded-xl border-2 p-3 text-center text-xs font-bold transition-all ${useAiPrompt ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-border/80"}`}>
                        <span className="flex items-center justify-center gap-1.5"><Wand2 className="w-3 h-3" /> Describe what you want</span>
                      </button>
                    </div>
                    {!useAiPrompt ? (
                      <div>
                        <Label className="text-xs font-bold">Tell AI about {subjectName || "them"}</Label>
                        <textarea
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          rows={4}
                          placeholder={quizType === "love" ? `e.g. ${subjectName || "They"} loves pizza, hates horror movies, grew up in Lagos...` : quizType === "classroom" ? "e.g. Topics covered: algebra, quadratic equations, linear functions..." : `e.g. ${subjectName || "They"} loves football, is afraid of heights, has a dog named Max...`}
                          value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
                        <p className="text-[10px] text-muted-foreground mt-1">{description.length}/2000 &middot; The more detail, the better the quiz</p>
                      </div>
                    ) : (
                      <div>
                        <Label className="text-xs font-bold">Describe your quiz idea</Label>
                        <textarea
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          rows={4}
                          placeholder="e.g. Create a quiz testing how well my friends know our college memories..."
                          value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} maxLength={1500} />
                        <p className="text-[10px] text-muted-foreground mt-1">{aiPrompt.length}/1500 &middot; AI creates questions based on your description</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-bold">Questions</Label>
                        <Select value={questionCount} onValueChange={setQuestionCount}>
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["5", "10", "15", "20", "30"].map((n) => <SelectItem key={n} value={n}>{n} questions</SelectItem>)}
                            <SelectItem value="custom">Custom…</SelectItem>
                          </SelectContent>
                        </Select>
                        {questionCount === "custom" && <Input type="number" min="1" max="50" className="mt-2" placeholder="e.g. 12" value={customCount} onChange={(e) => setCustomCount(e.target.value)} />}
                      </div>
                      <div>
                        <Label className="text-xs font-bold">Difficulty</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-muted/40 border border-border/40 p-3.5 flex items-start gap-2.5">
                    <Link2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Auto shareable link</p>
                      <p className="text-[10px] text-muted-foreground">A unique link is generated — anyone can take it without signing up.</p>
                    </div>
                  </div>
                  <Button onClick={handleGenerate} className="w-full rounded-full gap-2 shadow-elevated" size="lg" disabled={generating}>
                    {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {getQuestionCount()} Questions…</> : <><Sparkles className="w-4 h-4" /> Generate Quiz <ArrowRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {step === "study-details" && (
            <motion.div key="study-details"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-4">

              <div
                onClick={() => !extracting && fileRef.current?.click()}
                className="rounded-2xl bg-card border-2 border-dashed border-border hover:border-primary/40 p-8 text-center cursor-pointer transition-all shadow-card">
                <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx,.md" className="hidden" onChange={handleFileDrop} />
                {extracting ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground">Extracting text from {file?.name}…</p>
                  </div>
                ) : file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fileReady ? "bg-primary/10" : "bg-destructive/10"}`}>
                      {fileReady
                        ? <FileText className="w-5 h-5 text-primary" />
                        : <AlertCircle className="w-5 h-5 text-destructive" />}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fileReady ? `${fileContent.length.toLocaleString()} characters extracted` : "Failed to read content"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setFileContent(""); }}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">Upload study material</p>
                    <p className="text-xs text-muted-foreground">PDF, TXT, MD — AI reads and creates questions from your content</p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-bold text-muted-foreground">
                  {fileReady ? "OPTIONAL FOCUS" : "OR ENTER A TOPIC"}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-card">
                <div>
                  <Label className="text-xs font-bold">
                    {fileReady ? "Focus area (optional)" : "Topic or subject"}
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder={
                      fileReady
                        ? "e.g. Focus on Chapter 3, or cardiovascular system only"
                        : "e.g. Photosynthesis, World War II, Calculus"
                    }
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  />
                  {fileReady && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Questions will be generated from your file. Use this to narrow the focus.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-bold">Questions</Label>
                    <Select value={questionCount} onValueChange={setQuestionCount}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["5", "10", "15", "20", "30", "50", "75", "100"].map((n) => (
                          <SelectItem key={n} value={n}>{n} questions</SelectItem>
                        ))}
                        <SelectItem value="custom">Custom…</SelectItem>
                      </SelectContent>
                    </Select>
                    {questionCount === "custom" && (
                      <Input type="number" min="1" max="200" className="mt-2" placeholder="e.g. 45"
                        value={customCount} onChange={(e) => setCustomCount(e.target.value)} />
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full rounded-full gap-2 shadow-elevated"
                size="lg"
                disabled={generating || extracting}>
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating {getQuestionCount()} Questions…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate {getQuestionCount()} Questions <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
