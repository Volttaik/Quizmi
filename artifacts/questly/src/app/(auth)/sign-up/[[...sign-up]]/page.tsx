import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";

/** Same-origin destinations only, so a shared link cannot become an open redirect. */
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
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/dashboard" />
    </AuthShell>
  );
}
