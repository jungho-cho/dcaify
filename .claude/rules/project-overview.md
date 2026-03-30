---
description: Project tech stack and commands
globs: **
---

# DCAify — Crypto DCA Calculator

## Stack
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase, Recharts, Vitest

## Commands
```bash
npm run dev        # Dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Vitest
```

## Structure
- `src/app/` — Pages & API routes (i18n: `/ko`, `/[slug]`)
- `src/components/` — UI components
- `src/lib/` — Core logic (dca.ts, coins.ts, strings.ts, supabase.ts)
- `src/types/` — TypeScript types
- `__tests__/` — Test files
