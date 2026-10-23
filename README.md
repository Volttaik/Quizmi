# QUIZMI

Course-based computer-based testing platform.

## Local development

```bash
pnpm --filter @workspace/questly run dev
```

## Demo course

Seed a free 20-question demo course into Turso with:

```bash
pnpm --filter @workspace/scripts run demo-course
```

Then visit `/demo` for the unauthenticated demo landing page and `POST /api/demo/start`
to start a demo attempt without signing in.
