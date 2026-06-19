import { SignUp } from "@clerk/nextjs";
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
          id="reg-crosses"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <line x1="18" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1" />
          <line x1="20" y1="18" x2="20" y2="22" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#reg-crosses)" />
    </svg>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 bg-[hsl(222,47%,6%)] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04] text-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="reg-tri"
              x="0"
              y="0"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <polygon
                points="24,4 44,40 4,40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#reg-tri)" />
        </svg>
        <div className="relative text-center">
          <QuestlyLogo size={64} variant="dark" className="mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Start learning smarter
          </h2>
          <p className="text-white/50 max-w-xs">
            Create quizzes, flashcards, and AI summaries in seconds.
          </p>
          <img
            src="https://images.fillout.com/650815/btixbdasfc/generated-images/xkzA1SRvNgD8QaYwByN6GN/img_2cUhhnHQbxBenxv2.jpg"
            alt="Study"
            className="mt-8 w-64 mx-auto rounded-2xl border border-white/10"
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        <BgPattern />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-md relative flex flex-col items-center">
          <Link href="/" className="mb-8 self-start">
            <QuestlyWordmark variant="light" />
          </Link>
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none p-0 bg-transparent w-full",
                headerTitle: "text-2xl font-extrabold text-foreground",
                headerSubtitle: "text-muted-foreground text-sm font-medium",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 rounded-full w-full font-semibold",
                footerActionLink: "text-primary font-bold",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
