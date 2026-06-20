---
name: Quizmi Next.js Migration
description: Pitfalls discovered migrating Quizmi from Vite/Express to Next.js 15 App Router
---

## Rules

1. **Never name a component source dir `src/pages/`** — Next.js treats it as the Pages Router and tries to SSR-prerender everything in it. Use `src/views/` instead.

2. **Replace `@clerk/react` with `@clerk/nextjs`** — `@clerk/nextjs` re-exports everything; `@clerk/react` is removed from deps.

3. **`import.meta.env` is Vite-only** — use `process.env.NEXT_PUBLIC_*` for public vars; for `BASE_URL` just use `""`.

4. **`window.location.search` in render = prerender crash** — use `useSearchParams()` from `next/navigation` instead, wrapped in `<Suspense>`.

5. **`Link` prop is `href=` not `to=`** — the old wouter/react-router `to=` prop breaks TypeScript with next/link.

6. **`let x = null` type is inferred as `null`** — assigning JSX to it later fails in strict mode; annotate as `let x: ReactElement | null = null`.

7. **pdfjs-dist uses `DOMMatrix`** (browser-only) — as long as the importing component has `"use client"` and isn't in `src/pages/`, Next.js won't SSR it.

**Why:** Each of these caused a build failure during the Vite→Next.js migration.

**How to apply:** Check for all these patterns whenever modifying existing Quizmi components or adding new ones.
