import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import QuizmiLogo, { QuizmiWordmark } from "@/components/QuizmiLogo";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-[hsl(222,47%,6%)] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] text-white" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="left-hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
              <polygon points="30,2 55,15 55,37 30,50 5,37 5,15" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#left-hex)" />
        </svg>
        <div className="relative text-center">
          <QuizmiLogo size={64} className="mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-white mb-3">Welcome back</h2>
          <p className="text-white/50 max-w-xs mb-8">
            Continue your study journey. Your quizzes and flashcards are waiting.
          </p>
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            <Image
              src="/dashboard-preview.png"
              alt="Quizmi Dashboard"
              width={280}
              height={420}
              className="mx-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,6%)]/40 to-transparent" />
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-md relative flex flex-col items-center">
          <Link href="/" className="mb-8 self-start">
            <QuizmiWordmark variant="light" />
          </Link>
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none p-0 bg-transparent w-full",
                headerTitle: "text-2xl font-extrabold text-foreground",
                headerSubtitle: "text-muted-foreground text-sm font-medium",
                formButtonPrimary: "bg-primary hover:bg-primary/90 rounded-full w-full font-semibold",
                footerActionLink: "text-primary font-bold",
                identityPreviewEditButton: "text-primary",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
