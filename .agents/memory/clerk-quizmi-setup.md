---
name: Clerk auth setup for Quizmi (questly artifact)
description: How Clerk was provisioned and wired into the questly react-vite app + api-server
---

Clerk is set up and working. Key decisions:

**Why:** User explicitly asked for Clerk auth. Status was `not_configured` so ran `setupClerkWhitelabelAuth()`.

**How to apply:**
- Frontend: `@clerk/react` + `@clerk/themes` installed. App.tsx uses `ClerkProvider` wrapping wouter Router. Sign-in/sign-up are Clerk `<SignIn>` / `<SignUp>` components with `routing="path"`.
- index.css MUST have `@layer theme, base, clerk, components, utilities;` BEFORE `@import "tailwindcss"` (Tailwind v4 Clerk layer ordering).
- vite.config.ts MUST use `tailwindcss({ optimize: false })` (prevents prod build breakage with nested @layer from @clerk/themes).
- API server: `@clerk/express` + `http-proxy-middleware` installed. `clerkProxyMiddleware` mounted BEFORE cors/body parsers. `clerkMiddleware` uses `publishableKeyFromHost`.
- Routes: `/sign-in/*?` and `/sign-up/*?` exact patterns required (the `/*?` wildcard for OAuth sub-paths).
- `publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` — NEVER pass hostname with port.
- Appearance theme: `shadcn` from `@clerk/themes` (not a string), with `cssLayerName: "clerk"`.
- Home route: `<Show when="signed-in"><Redirect to="/demo" /></Show>` — never redirect unauthenticated users away from home.
- "Clerk loaded with development keys" console message is expected in dev — NOT a bug.
