import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import QuestlyLogo, { QuestlyWordmark } from "@/components/QuestlyLogo";

function BgPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.03]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="login-dots"
          x="0"
          y="0"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="currentColor" />
        </pattern>
        <pattern
          id="login-grid"
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <rect width="80" height="80" fill="url(#login-dots)" />
          <rect
            x="0"
            y="0"
            width="80"
            height="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#login-grid)" />
    </svg>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-[hsl(222,47%,6%)] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04] text-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="left-hex"
              x="0"
              y="0"
              width="60"
              height="52"
              patternUnits="userSpaceOnUse"
            >
              <polygon
                points="30,2 55,15 55,37 30,50 5,37 5,15"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#left-hex)" />
        </svg>
        <div className="relative text-center">
          <QuestlyLogo size={64} variant="dark" className="mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Welcome back
          </h2>
          <p className="text-white/50 max-w-xs">
            Continue your study journey. Your quizzes and flashcards are
            waiting.
          </p>
          <img
            src="https://images.fillout.com/650815/btixbdasfc/generated-images/tmLUuQ9SX77nACcj4fgCYF/img_dqYtnghiShyYiaUx.jpg"
            alt="Study"
            className="mt-8 w-64 mx-auto rounded-2xl border border-white/10"
          />
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        <BgPattern />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-md relative flex flex-col items-center">
          <Link href="/" className="mb-8 self-start">
            <QuestlyWordmark variant="light" />
          </Link>
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none p-0 bg-transparent w-full",
                headerTitle: "text-2xl font-extrabold text-foreground",
                headerSubtitle: "text-muted-foreground text-sm font-medium",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 rounded-full w-full font-semibold",
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
