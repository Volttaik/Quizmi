import { ChevronLeft, MessageCircle, BookOpen, Zap, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import BottomNav from "@/components/dashboard/BottomNav";

const faqs = [
  {
    q: "How do credits work?",
    a: "Credits are used each time you generate a quiz, flashcard set, or AI summary. Generating a quiz costs 50 credits, flashcards cost 30, and summaries cost 20. You can buy more credits any time from the dashboard.",
  },
  {
    q: "How long does it take to generate a quiz?",
    a: "Quiz generation with Gemini AI typically takes 5–15 seconds depending on the length of your input material.",
  },
  {
    q: "Can I retake a quiz?",
    a: "Yes! You can retake any quiz from the Quizzes section. Your history tracks your best score.",
  },
  {
    q: "What formats can I paste into Quizmi?",
    a: "You can paste plain text, notes, paragraphs, or any written content. The AI will extract key concepts and turn them into questions.",
  },
  {
    q: "How do I get more credits?",
    a: "Tap 'Add Credits' on the dashboard or visit the Credits page to choose a top-up package.",
  },
];

export default function HelpSupportPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground">Help & Support</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <a
            href="mailto:support@quizmi.app"
            className="bg-card rounded-2xl border border-border/40 p-4 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Email Us</span>
            <span className="text-xs text-muted-foreground text-center">Get help via email</span>
          </a>
          <div className="bg-card rounded-2xl border border-border/40 p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Live Chat</span>
            <span className="text-xs text-muted-foreground text-center">Coming soon</span>
          </div>
        </div>

        <h2 className="text-sm font-extrabold text-foreground mb-3 px-0.5">Frequently Asked Questions</h2>
        <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border/30 last:border-0">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/50 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="flex-1 text-sm font-semibold text-foreground">{faq.q}</span>
                {open === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {open === i && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed ml-7">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
