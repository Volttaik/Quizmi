import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";

/**
 * A signed-in learner who lands here (for example after a transient session
 * check failed mid-quiz) must go back where they were heading, not to the
 * dashboard. Only same-origin paths are honoured.
 */
function safeDestination(value: string | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { userId } = await auth();
  if (userId) {
    const target = safeDestination((await searchParams)?.redirect_url);
    redirect(target ?? "/dashboard");
  }

  return (
    <AuthShell>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
    </AuthShell>
  );
}
