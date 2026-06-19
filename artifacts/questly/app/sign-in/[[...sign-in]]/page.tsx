import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import { GraduationCap, Layers, ScrollText, ArrowRight } from "lucide-react";

const highlights = [
  { icon: GraduationCap, label: "AI-generated quizzes", desc: "From any notes in seconds" },
  { icon: Layers, label: "Smart flashcards", desc: "Spaced repetition built-in" },
  { icon: ScrollText, label: "Instant summaries", desc: "Key concepts extracted for you" },
];

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* LEFT — branding panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-between p-12">
        {/* Mesh background */}
        <div className="absolute inset-0 bg-[hsl(222,47%,5%)]" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[160px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[hsl(280,72%,50%)]/15 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-[hsl(200,90%,50%)]/8 rounded-full blur-[90px] -translate-x-1/2 -translate-y-1/2" />

        {/* Dot grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Content */}
        <div className="relative z-10">
          <QuizmiWordmark variant="dark" size={40} />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-16">
          <h2 className="text-4xl font-black text-white mb-3 leading-tight">
            Study smarter,<br />
            <span className="bg-gradient-to-r from-[hsl(262,72%,65%)] to-[hsl(280,80%,70%)] bg-clip-text text-transparent">
              ace every exam.
            </span>
          </h2>
          <p className="text-white/40 text-sm mb-10 max-w-xs leading-relaxed">
            Turn your notes into quizzes, flashcards, and summaries with AI.
          </p>

          <div className="space-y-4">
            {highlights.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-white/40">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors font-medium"
          >
            Learn more about Quizmi <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* RIGHT — sign-in form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background relative overflow-hidden">
        {/* Subtle bg */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[hsl(280,72%,50%)]/4 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md relative">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <QuizmiWordmark />
          </div>

          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none p-0 bg-transparent w-full",
                headerTitle: "text-2xl font-extrabold text-foreground",
                headerSubtitle: "text-muted-foreground text-sm",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 rounded-full w-full font-semibold shadow-lg shadow-primary/25",
                footerActionLink: "text-primary font-bold",
                socialButtonsBlockButton: "rounded-xl border-border",
                formFieldInput: "rounded-xl border-border",
              },
            }}
          />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link href="/sign-up" className="text-primary font-bold hover:underline">
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
