import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { QuizmiWordmark } from "@/components/QuizmiLogo";
import { ArrowRight, Sparkles } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* LEFT — branding panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-[hsl(222,47%,5%)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[hsl(280,72%,50%)]/20 rounded-full blur-[150px] translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-primary/15 rounded-full blur-[140px] -translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/2 right-1/3 w-[200px] h-[200px] bg-[hsl(45,95%,55%)]/6 rounded-full blur-[80px]" />

        {/* Diagonal line pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diag" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag)" />
        </svg>

        <div className="relative z-10">
          <QuizmiWordmark variant="dark" size={40} />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/20 text-primary text-xs font-semibold mb-6 w-fit">
            <Sparkles className="w-3 h-3" /> Free to start
          </div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Join students<br />
            <span className="bg-gradient-to-r from-[hsl(262,72%,65%)] to-[hsl(280,80%,70%)] bg-clip-text text-transparent">
              studying smarter.
            </span>
          </h2>
          <p className="text-white/40 text-sm max-w-xs leading-relaxed">
            Create quizzes, flashcards, and AI summaries in seconds. No credit card required.
          </p>
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

      {/* RIGHT — sign-up form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-background relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md relative">
          <div className="lg:hidden mb-8">
            <QuizmiWordmark />
          </div>

          <SignUp
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
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
