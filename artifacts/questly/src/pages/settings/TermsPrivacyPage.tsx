import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import BottomNav from "@/components/dashboard/BottomNav";

export default function TermsPrivacyPage() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground">Terms & Privacy</h1>
        </div>

        <div className="space-y-4">
          <Section title="Terms of Service">
            <p>By using Quizmi, you agree to use the platform for lawful educational purposes only. You are responsible for the content you submit for AI generation.</p>
            <p>Quizmi reserves the right to suspend accounts that violate these terms. Credits are non-refundable except where required by law.</p>
          </Section>

          <Section title="Privacy Policy">
            <p>Quizmi collects your email address and name for authentication purposes only via Clerk. We do not sell or share your personal data with any third parties.</p>
            <p>Study content you paste into the AI generator is processed by Groq AI. We do not store your raw input content beyond your session.</p>
          </Section>

          <Section title="Data & Cookies">
            <p>We use session cookies for authentication and localStorage for your theme preference. No advertising cookies are used.</p>
            <p>Your quiz history and credit transactions are stored in our secure database and are only accessible to you.</p>
          </Section>

          <Section title="AI-Generated Content">
            <p>Quizmi uses Groq AI to generate quizzes, flashcards, and summaries. AI-generated content may contain errors. Always verify important information independently.</p>
          </Section>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Last updated: June 2025 · Version 1.0
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border/40 p-5">
      <h2 className="text-sm font-extrabold text-foreground mb-3">{title}</h2>
      <div className="space-y-2">
        {Array.isArray(children) ? children.map((child, i) => (
          <div key={i} className="text-sm text-muted-foreground leading-relaxed">{child}</div>
        )) : (
          <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
        )}
      </div>
    </div>
  );
}
