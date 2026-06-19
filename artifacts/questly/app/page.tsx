import { redirect } from "next/navigation";

// Middleware handles the real redirect logic (auth → /dashboard, guest → /sign-in).
// This is a safety fallback only.
export default function RootPage() {
  redirect("/sign-in");
}
