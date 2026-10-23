"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton mt-6 h-40 rounded-2xl" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  return <>{children}</>;
}
