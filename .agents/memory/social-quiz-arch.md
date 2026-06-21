---
name: Social Quiz Architecture
description: How the 5 quiz types (study, love, friendship, family, classroom) are structured and themed
---

The single source of truth is `src/lib/quizTypes.ts`. It exports:
- `QUIZ_TYPE_CONFIG` — per-type theme (gradient, accent color, badge classes, icon name)
- `getResultMessage(type, subjectName, pct)` — smart result banner text
- `generateShareSlug(title)` — slug generation utility

**Why:** Components should never hardcode type-specific colors or messages inline. Centralizing in quizTypes.ts means adding a new type only requires editing one file.

**How to apply:** When rendering type-aware UI, import QUIZ_TYPE_CONFIG and use cfg.theme.* classes. Never use emoji — use QuizTypeIcon component that maps type → Lucide icon.

DB columns added to quizzesTable: `quiz_type`, `subject_name`, `share_slug`, `description`, `is_public`, `banner_url`.

Public quiz route: `/q/[slug]` — no auth required. API: `/api/quizzes/slug/[slug]` — also public (in middleware).
