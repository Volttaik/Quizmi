---
name: Quizmi Clerk Setup
description: How Clerk auth is configured for this project and what works/doesn't in dev vs prod.
---

# Quizmi Clerk Setup

Clerk is Replit-managed. Provisioned via `setupClerkWhitelabelAuth()` in code_execution sandbox.

**Keys set:** `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

**Why:** The app uses Clerk for auth. Replit-managed Clerk sets test keys automatically.

**How to apply:**
- `clerkMiddleware()` from `@clerk/express` is enough for the dev server (no `publishableKeyFromHost` needed)
- `publishableKeyFromHost` from `@clerk/shared/keys` does NOT work with the installed version — causes build error
- Proxy middleware (`clerkProxyMiddleware`) is mounted but only activates in production (NODE_ENV=production)
- Frontend uses `publishableKeyFromHost` from `@clerk/react/internal` — this works fine on the client side
