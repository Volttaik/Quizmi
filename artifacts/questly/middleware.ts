import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/payment/callback(.*)",
  "/api/paystack/verify(.*)",
]);

const AUTH_HOST = "auth.quizmi.online";
const APP_HOST = "app.quizmi.online";

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const host = req.headers.get("host") ?? "";
  const url = req.nextUrl.clone();

  if (host === AUTH_HOST) {
    if (!url.pathname.startsWith("/sign-in") && !url.pathname.startsWith("/sign-up")) {
      url.pathname = "/sign-in";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (host === APP_HOST) {
    if (url.pathname === "/") {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
