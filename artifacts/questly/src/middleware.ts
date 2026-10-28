import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/courses(.*)",
  "/quizzes(.*)",
  "/offline",
  "/manifest.json",
  "/robots.txt",
  "/api/courses(.*)",
  "/demo",
  "/api/demo(.*)",
  "/api/courses(.*)",
  "/api/payments/callback(.*)",
  "/api/payments/webhook(.*)",
  // Bot API: authenticated by its own bearer key in each route, not by a Clerk session.
  "/whatsapp/api(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { userId } = await auth();
  if (!userId) {
    // API clients need a machine-readable response; page visits go to Clerk's
    // sign-in flow instead of rendering an empty shell.
    if (req.nextUrl.pathname.startsWith("/api")) {
      // Machine-readable so clients can tell a real sign-out apart from a
      // temporary verification problem (which the routes report as 503).
      return NextResponse.json(
        { error: "Unauthorized", code: "unauthenticated" },
        { status: 401 }
      );
    }

    // Redirect pages ourselves so the behaviour does not depend on Clerk's
    // default 404 handling, and preserve where the learner was heading.
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set(
      "redirect_url",
      `${req.nextUrl.pathname}${req.nextUrl.search}`
    );
    return NextResponse.redirect(signIn);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
