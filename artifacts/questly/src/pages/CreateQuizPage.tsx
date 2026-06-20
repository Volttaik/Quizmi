import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sparkles, ArrowLeft, Upload, FileText, X, ArrowRight, Loader2, Coins, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

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

export default function CreateQuizPage() {
  const [, setLocation] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [customCount, setCustomCount] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [extracting, setExtracting] = useState(false);

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
          toast.error("Could not extract text from this PDF. It may be a scanned image — try a text-based PDF.");
          setFile(null);
          setFileContent("");
          setExtracting(false);
          return;
        }
      } else {
        text = await f.text();
      }
      setFileContent(text);
      toast.success(`File ready — ${text.length.toLocaleString()} characters extracted`);
    } catch {
      toast.error("Could not read file. Please try a .txt, .md, or text-based PDF.");
      setFile(null);
      setFileContent("");
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
    if (!fileContent && !topic.trim()) {
      toast.error("Please upload a study material or enter a topic");
      return;
    }
    if (file && !fileContent) {
      toast.error("Still reading the file — please wait a moment");
      return;
    }
    if (questionCount === "custom" && (!customCount || isNaN(parseInt(customCount)))) {
      toast.error("Please enter a valid number of questions");
      return;
    }
    setGenerating(true);
    try {
      const body: Record<string, unknown> = { questionCount: count, difficulty };

      if (fileContent) {
        body.fileContent = fileContent;
        body.fileName = file?.name ?? "Uploaded File";
        if (topic.trim()) body.topic = topic.trim();
      } else {
        body.topic = topic.trim();
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
        toast.success("Quiz generated!");
        setLocation(`/quiz/${data.id}`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const hasFile = !!file && !!fileContent;
  const fileReady = hasFile && !extracting;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
          <Link to="/quizzes" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors shadow-card dark:shadow-elevated">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-foreground">Create Quiz</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <Coins className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">1 credit per quiz</span>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            onClick={() => !extracting && fileRef.current?.click()}
            className="rounded-2xl bg-card border-2 border-dashed border-border hover:border-primary/40 p-8 text-center cursor-pointer transition-all shadow-card dark:shadow-elevated"
          >
            <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx,.md" className="hidden" onChange={handleFileDrop} />
            {extracting ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Extracting text from {file?.name}…</p>
              </div>
            ) : file ? (
              <div className="flex items-center justify-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fileReady ? "bg-primary/10" : "bg-destructive/10"}`}>
                  {fileReady ? <FileText className="w-5 h-5 text-primary" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fileReady
                      ? `✓ ${fileContent.length.toLocaleString()} characters — quiz will be based on this material`
                      : "Failed to read content — try another file"}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setFileContent(""); }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground mb-1">Upload your study material</p>
                <p className="text-xs text-muted-foreground">PDF, TXT, MD — AI reads the content and creates questions from it</p>
              </>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-bold text-muted-foreground">{fileReady ? "OPTIONAL FOCUS" : "OR ENTER A TOPIC"}</span>
            <div className="flex-1 h-px bg-border" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-card dark:shadow-elevated">
            <div>
              <Label className="text-xs font-bold">
                {fileReady ? "Focus / Direction (optional)" : "Topic or Subject"}
              </Label>
              <Input
                className="mt-1.5"
                placeholder={
                  fileReady
                    ? "e.g. Focus on Chapter 3, or only cardiovascular system"
                    : "e.g. Photosynthesis, World War II, Calculus"
                }
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
              {fileReady && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  ✓ Questions will be generated from your file. Use this field to narrow the focus area.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Questions</Label>
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                    <SelectItem value="30">30 questions</SelectItem>
                    <SelectItem value="50">50 questions</SelectItem>
                    <SelectItem value="75">75 questions</SelectItem>
                    <SelectItem value="100">100 questions</SelectItem>
                    <SelectItem value="custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {questionCount === "custom" && (
                  <Input type="number" min="1" max="200" className="mt-2" placeholder="e.g. 45" value={customCount} onChange={(e) => setCustomCount(e.target.value)} />
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
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <Button
              onClick={handleGenerate}
              className="w-full rounded-full gap-2 shadow-elevated"
              size="lg"
              disabled={generating || extracting}
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating {getQuestionCount()} Questions…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate {getQuestionCount()} Questions <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground mt-2">
              Uses 1 credit · {fileReady ? `Reading ${fileContent.length.toLocaleString()} chars from your file` : "AI generates from topic"}
            </p>
          </motion.div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
