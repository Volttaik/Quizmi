"use client";

import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  ArrowLeft,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SummaryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic to generate a summary");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate summary");
      } else {
        setSummary(data.content);
        toast.success("Summary generated!");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSummary = (text: string) =>
    text.split("\n").map((line, i) => {
      if (line.startsWith("## "))
        return (
          <h2 key={i} className="text-sm font-extrabold mt-3 mb-1 text-foreground">
            {line.replace("## ", "")}
          </h2>
        );
      if (line.startsWith("### "))
        return (
          <h3 key={i} className="text-xs font-bold mt-2 mb-0.5 text-foreground">
            {line.replace("### ", "")}
          </h3>
        );
      if (line.startsWith("- "))
        return (
          <p key={i} className="text-xs text-muted-foreground ml-3 font-medium">
            • {line.replace("- ", "")}
          </p>
        );
      if (line.match(/^\d\./))
        return (
          <p key={i} className="text-xs text-muted-foreground ml-3 font-medium">
            {line}
          </p>
        );
      if (line.trim() === "") return <div key={i} className="h-1" />;
      return (
        <p key={i} className="text-xs text-muted-foreground font-medium">
          {line.replace(/\*\*(.*?)\*\*/g, "$1")}
        </p>
      );
    });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground flex-1">
            AI Summary
          </h1>
        </div>

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
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
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
                <p className="text-sm font-bold text-foreground mb-1">
                  Upload study material
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, TXT, DOC — AI creates the summary
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-bold text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="rounded-2xl bg-card border border-border p-5">
            <Label className="text-xs font-bold">Topic or Subject</Label>
            <Input
              className="mt-1.5"
              placeholder="e.g. Photosynthesis, World War II"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerate}
            className="w-full rounded-full gap-2"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Summary</>
            )}
          </Button>

          {summary ? (
            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">AI Summary</span>
                </div>
                <button onClick={handleCopy}>
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="space-y-1">{renderSummary(summary)}</div>
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Your AI summary will appear here
              </p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
