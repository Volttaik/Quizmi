import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,6%)] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-purple-800/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.quizmi.online"}/dashboard`}
        />
      </div>
    </div>
  );
}
