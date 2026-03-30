---
description: Code quality and conventions
globs: src/**
---

# Code Conventions

- Use Korean for user-facing `/ko` pages, English for root pages
- Numbers: Geist Mono with tabular-nums. Currency: 2 decimals. Percentage: sign prefix + 2 decimals.
- SEO: each page needs proper meta, OG tags, and structured data
- Tests: colocate in `__tests__/`, use Vitest
- No `any` types — use proper TypeScript types from `src/types/`
