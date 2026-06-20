import { useState, useEffect, useRef } from "react";
import { Sparkles, ArrowLeft, Plus, Trash2, MessageSquare, Loader2, ArrowUp, FileText, Image, Mic, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import BottomNav from "@/components/dashboard/BottomNav";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface ChatSession {
  id: number;
  title: string;
  last_message: string | null;
  updated_at: string;
}

function renderMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h2 key={i} className="text-sm font-extrabold mt-3 mb-1 text-foreground">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="text-xs font-bold mt-2 mb-0.5 text-foreground">{line.slice(4)}</h3>;
    if (line.startsWith("# ")) return <h1 key={i} className="text-base font-extrabold mt-3 mb-1 text-foreground">{line.slice(2)}</h1>;
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return <p key={i} className="text-sm leading-relaxed ml-3">• {line.replace(/^[-•]\s/, "").replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
    }
    if (line.match(/^\d+\./)) return <p key={i} className="text-sm leading-relaxed ml-3">{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
    if (line.trim() === "") return <div key={i} className="h-1.5" />;
    const withBold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: withBold }} />;
  });
}

export default function SummaryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [view, setView] = useState<"sessions" | "chat">("sessions");
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch { }
    finally { setLoadingSessions(false); }
  };

  const openSession = async (sessionId: number) => {
    setActiveSession(sessionId);
    setView("chat");
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch { toast.error("Failed to load chat"); }
    finally { setLoadingMessages(false); }
  };

  const startNewChat = () => {
    setActiveSession(null);
    setMessages([]);
    setInput("");
    setView("chat");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: activeSession ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to get response");
        setMessages(prev => prev.slice(0, -1));
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
        if (!activeSession) {
          setActiveSession(data.sessionId);
          loadSessions();
        } else {
          loadSessions();
        }
      }
    } catch {
      toast.error("Something went wrong");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const deleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/${sessionId}`, { method: "DELETE" });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSession === sessionId) {
        setActiveSession(null);
        setMessages([]);
        setView("sessions");
      }
    } catch { toast.error("Failed to delete chat"); }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString();
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image") => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAttachMenuOpen(false);
    toast.info(`Attached: ${f.name}`);
    const fileLabel = type === "image" ? `[Image: ${f.name}]` : `[File: ${f.name}]`;
    setInput(prev => prev ? `${prev}\n${fileLabel}` : fileLabel);
    e.target.value = "";
  };

  const handleAudioRecord = () => {
    setAttachMenuOpen(false);
    toast.info("Audio recording coming soon!");
  };

  const attachOptions = [
    { icon: FileText, label: "Upload File", action: () => { setAttachMenuOpen(false); fileInputRef.current?.click(); } },
    { icon: Image, label: "Upload Image", action: () => { setAttachMenuOpen(false); imageInputRef.current?.click(); } },
    { icon: Mic, label: "Record Audio", action: handleAudioRecord },
  ];

  return (
    <div className="min-h-screen bg-background pb-28 flex flex-col">
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx,.md" className="hidden" onChange={(e) => handleFileAttach(e, "file")} />
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileAttach(e, "image")} />

      <div className="max-w-lg mx-auto w-full px-4 pt-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          {view === "chat" ? (
            <button onClick={() => setView("sessions")} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Link to="/dashboard" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-foreground">AI Chat</h1>
            <p className="text-[10px] text-muted-foreground font-medium">Free · Powered by Quizmi AI</p>
          </div>
          {view === "sessions" && (
            <Button onClick={startNewChat} size="sm" className="rounded-full gap-1.5 text-xs px-4">
              <Plus className="w-3.5 h-3.5" /> New Chat
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {view === "sessions" ? (
            <motion.div key="sessions" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="flex-1">
              {loadingSessions ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1">No chats yet</p>
                  <p className="text-xs text-muted-foreground mb-6 max-w-[200px]">Start a conversation with your AI study assistant</p>
                  <Button onClick={startNewChat} className="rounded-full gap-2">
                    <Sparkles className="w-4 h-4" /> Start Chatting
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => openSession(s.id)}
                      className="w-full flex items-center gap-3 bg-card rounded-2xl border border-border/40 p-4 text-left hover:border-primary/30 transition-colors shadow-sm group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{s.title}</p>
                        {s.last_message && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{s.last_message}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground">{formatTime(s.updated_at)}</span>
                        <button
                          onClick={(e) => deleteSession(s.id, e)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-destructive transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-[300px]">
                {loadingMessages ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">Ask me anything</p>
                    <p className="text-xs text-muted-foreground max-w-[220px]">Explain a concept, summarize a topic, create a study plan — I'm here to help</p>
                    <div className="mt-5 flex flex-col gap-2 w-full max-w-xs">
                      {["Summarize the water cycle", "Explain Newton's 3 laws", "Create a study plan for calculus"].map(s => (
                        <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
                          className="text-left px-4 py-2.5 rounded-xl border border-border/60 bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border/40 text-foreground rounded-tl-sm"
                      }`}>
                        {msg.role === "user" ? (
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        ) : (
                          <div className="prose-sm">{renderMarkdown(msg.content)}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {sending && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-card border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="relative">
                <AnimatePresence>
                  {attachMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 mb-2 bg-card border border-border/60 rounded-2xl shadow-elevated overflow-hidden z-10 min-w-[160px]"
                    >
                      {attachOptions.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={opt.action}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <opt.icon className="w-4 h-4 text-primary flex-shrink-0" />
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {attachMenuOpen && (
                  <div className="fixed inset-0 z-0" onClick={() => setAttachMenuOpen(false)} />
                )}

                <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden mt-2 relative z-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask anything… (Enter to send)"
                    rows={2}
                    className="w-full px-4 pt-3 pb-1 text-sm bg-transparent resize-none outline-none placeholder:text-muted-foreground/60"
                  />
                  <div className="flex items-center justify-between px-3 pb-3 gap-2">
                    <button
                      onClick={() => setAttachMenuOpen(prev => !prev)}
                      className="w-8 h-8 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex-shrink-0"
                    >
                      {attachMenuOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || sending}
                      className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}
