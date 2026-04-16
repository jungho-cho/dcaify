# DCAify — SEO Indexation Recovery Design

**Date:** 2026-04-16
**Status:** Draft → pending user review
**Owner:** junghocho

## Problem

Google Search Console (last 3 months, as of 2026-04-16):

- **3 indexed / 337 not indexed** (1% indexation rate)
- **1 click, 201 impressions** across the whole site
- First search impression: 2026-03-28 (domain is 3 weeks old in Google's eyes)
- `dcaify.com` and `www.dcaify.com` appear as **separate hosts** (e.g. `/` shows 29 impr at pos 60 on one, 21 impr at pos 25 on the other; `/doge/guide` shows 4 on one, 5 on the other)
- `/btc-vs-eth` is the top impression page (95 impr, pos 17). `/eth/guide` is pos 13 for "dca ethereum" (68 impr). `/ko/btc` got the only click (pos 6, 20% CTR).

**Root cause:** coin pages render near-empty server-side. `src/app/[slug]/page.tsx` SSR output for `/btc` is `<Nav/> + <DcaCalculator/> (client shell, no default result) + one link`. Google's crawler does not simulate form input → sees a form and no substantive content. Combined with the www split and ~190 thin comparison URLs in the sitemap, Google has decided the site is low value: "Crawled — currently not indexed."

## Constraints

- Backlink outreach is not available.
- Work is executed by AI agents; engineering capacity is effectively unbounded, but taste/review is the bottleneck.
- Current data sources (Binance daily closes, existing `src/lib/dca.ts` and `src/lib/prices-client.ts`) are sufficient — no new external dependencies required.

## Goals

| Metric | Current | 4 weeks | 8 weeks |
|---|---|---|---|
| Indexed / discovered | 3 / 340 (0.9%) | 20 / 50 (40%) | 30 / 50 (60%) |
| Impressions (monthly) | ~200 | ~1,000 | ~3,000 |
| Clicks (monthly) | 1 | 20 | 100 |

Non-goal: ranking for broad head-term keywords like "dca calculator" in the first 8 weeks. Focus is indexation recovery first, then long-tail capture.

## Strategy

Hybrid: fix the foundation first so Google re-evaluates the site as high quality, then expand only after indexation recovers.

1. **Phase 1 (W1):** reduce indexable URL count from 340 to ~50, unify host, clean sitemap. Defensive only — no new content.
2. **Phase 2 (W2–3):** rebuild the top 10 coin pages with substantial pre-rendered content. Drive Google to re-evaluate.
3. **Phase 3 (W4+, conditional):** programmatic expansion into intent-specific long-tail pages, gated on Phase 2 indexation recovery.
4. **Phase 4 (ongoing):** weekly measurement, rollback triggers.

---

## Phase 1 — Index Hygiene (Week 1)

### 1.1 www → non-www canonicalization

- Add 301 redirect in Cloudflare: `www.dcaify.com/*` → `https://dcaify.com/$1`
- Canonical host: `https://dcaify.com` (matches existing `metadataBase` and sitemap)
- Implementation: Cloudflare Worker route or Page Rule on the `www` subdomain. Prefer Worker for testability.

### 1.2 Indexation policy by page type

| Page type | Count | Policy | Rationale |
|---|---|---|---|
| Home (`/`, `/ko`) | 2 | index | Brand pages |
| Top 10 coin pages (EN+KO) | 20 | index | Phase 2 will deepen content |
| Top 10 guide pages (EN+KO) | 20 | index | Secondary ranking surface |
| Coins ranked 11–30 (EN+KO) | 40 | **noindex, follow** | Too thin to compete now |
| Comparison pages | 190 | **noindex, follow** — except top 5 pairs | Thinnest pages; flagship 5 stay indexable |
| Top 5 comparison pairs | 5 | index | btc-vs-eth, btc-vs-sol, eth-vs-sol, btc-vs-doge, eth-vs-doge |
| KO tax pages (`/ko/[coin]/tax`) | 30 | **noindex** | Repeated legal copy — duplicate risk |
| Blog / about / privacy | ~7 | index | |
| **Total indexable** | **~54** | | |

**Top 10 coin selection (Q2 hybrid):**
- From GSC current impressions: ETH, BTC, DOGE
- From market cap: SOL, XRP, ADA, BNB, AVAX, DOT, LINK
- Combined Top 10: **ETH, BTC, SOL, XRP, ADA, DOGE, BNB, AVAX, DOT, LINK**

**Top 5 comparison pairs:** btc-vs-eth, btc-vs-sol, eth-vs-sol, btc-vs-doge, eth-vs-doge (chosen for highest search demand among Top 10 coins).

### 1.3 Implementation points

- Add `robots` metadata per-page in `generateMetadata` or at the page level:
  - Coin pages: check if slug ∈ Top 10 → index, else noindex
  - Guide pages: same rule
  - Comparison pages: check if pair slug ∈ Top 5 → index, else noindex
  - KO tax pages: noindex unconditionally
- Extract the Top 10 / Top 5 lists into `src/lib/seo.ts` (new file) so both metadata and sitemap read the same source of truth.

### 1.4 Sitemap cleanup

- `src/app/sitemap.ts`: emit only indexable URLs (the ~54 above).
- Never list a noindex URL in the sitemap. Google treats that as a trust-negative signal.

### 1.5 Search Console action

- Re-register the site in GSC as a **Domain property** (`dcaify.com`) instead of URL-prefix property. A Domain property covers `www`, non-`www`, http, https in one property and consolidates the signal.
- Resubmit cleaned sitemap.
- Skip manual URL Inspection / Request Indexing in Phase 1 — the content of indexed pages has not changed yet; there is nothing new for Google to re-evaluate. Phase 2 earns that action.

### 1.6 Tests

- Unit: `src/lib/seo.ts` helpers (`isTopCoin`, `isTopComparison`, `shouldIndex(pageType, slug)`).
- Integration: render `/btc` and `/dot` (assuming DOT is Top 10, an 11+ rank coin has noindex), assert `<meta name="robots">` differs.
- Build test: `npm run build` then grep `.open-next` output for noindex tags to confirm they emit in SSR HTML.

---

## Phase 2 — Flagship Page Depth (Weeks 2–3)

### 2.1 Tier plan

- **Tier 1 (priority, 6 coins):** ETH, BTC, DOGE (proven demand in GSC) + SOL, XRP, ADA (market-cap leaders)
- **Tier 2 (following week, 4 coins):** BNB, AVAX, DOT, LINK

Each tier ships end-to-end (EN + KO + structured data + tests) before moving on.

### 2.2 New page structure (`src/app/[slug]/page.tsx` for Top 10)

Above-the-fold (server-rendered HTML, no JS required):

1. **Hero result card** — example: "If you invested $100/month in Bitcoin for 5 years, you'd have invested $6,000 and your portfolio would now be worth $X (+Y%)." Numbers are live, computed at build/ISR time from Binance data.
2. **SVG DCA growth chart** — server-rendered `<svg>` showing portfolio value over 5 years for the default scenario. No Recharts; generate path strings from data points directly to keep the output in HTML.
3. **Scenario grid** — table of results for $50/$100/$200/$500 monthly across 1y / 3y / 5y = 12 cells. All numbers pre-computed.
4. **DCA vs lump sum** — "If you had instead invested $6,000 as a lump sum on the start date, you'd have $Z. DCA outperformed by W%." One paragraph + one chart.
5. **Risk stats** — max drawdown during the window, volatility (stdev of daily returns), average buy price vs current price.
6. **Interactive calculator** — existing `<DcaCalculator>`, moved below the fold as a secondary action.
7. **FAQ** — expand existing FAQ schema (currently 2 Q on guide page) to 6–8 Q covering "Is DCA better than lump sum for [coin]?", "What's the best interval?", "How did [coin] DCA perform in [recent bear market]?"
8. **Related coins** — existing, retained.

Target: **1,500–2,000 unique words + 12+ pre-computed data points per page**, entirely in SSR HTML.

### 2.3 Data pipeline

- Binance daily closes already fetched via `src/lib/prices-client.ts`. Reuse.
- Add `src/lib/dca-scenarios.ts` exporting `computeScenarioMatrix(coin, asOfDate)` that returns the 12-cell scenario grid + DCA-vs-lump-sum result + risk stats.
- **Rendering mode:** ISR with `revalidate = 86400` (daily). Coin pages regenerate once per day with the latest Binance close. `generateStaticParams` emits all 10 Top 10 slugs.
- **Charts:** write `src/components/DcaChart.tsx` as an RSC that takes data points and outputs `<svg>` with a single `<path d="...">`. No client JS. Bundle size unaffected.

### 2.4 Korean versions

- `/ko/[coin]` for the same Top 10. Copy strings through `src/lib/strings.ts`.
- KO copy is not a machine translation of EN — short KO-native phrasing per the DESIGN.md voice ("calm, trustworthy financial tool"). AI-generated, then light edit.
- `/ko/btc` already ranks at position 6 with 20% CTR; this is the highest-leverage locale.

### 2.5 Top 5 comparison pages

- Apply the same depth treatment to `/btc-vs-eth`, `/btc-vs-sol`, `/eth-vs-sol`, `/btc-vs-doge`, `/eth-vs-doge`.
- Hero: "$100/month into Bitcoin vs Ethereum for 5 years — who won?" with real pre-computed result.
- Side-by-side scenario tables.
- Interactive `<ComparisonCalculator>` below the fold.

### 2.6 Structured data

- `WebApplication` schema already exists — retain.
- Add `FAQPage` (expanded) to each Top 10 coin page.
- Add `Dataset` schema for the scenario table (helps AI search / rich results).
- `Article` schema on guide pages (already structured as articles).

### 2.7 Phase 2 completion action

- After deploy, use **GSC URL Inspection → Request Indexing** for the 10 Top coin pages + 10 KO versions + 5 comparison pages. Split across 2–3 days to respect the ~10/day quota.
- Wait 7 days, then measure indexation recovery (Phase 3 gate).

### 2.8 Tests

- Unit: `computeScenarioMatrix` against a known fixture (BTC from 2020-01-01, $100/month, verify returned numbers).
- Snapshot: SSR render of `/btc` contains "$100/month", a chart `<svg>` element, and 12 scenario rows.
- Build-output grep: after `npm run build`, the generated HTML for `/btc` must contain at least one dollar-value string and one `<svg>` tag — confirms Google crawler sees rendered content without JS. (No Playwright dependency; project uses Vitest only.)

---

## Phase 3 — Programmatic Expansion (Week 4+, conditional)

### 3.1 Gate

Phase 3 only proceeds if **indexed ≥ 20** in GSC one week after Phase 2 deploy. If below threshold, loop back to Phase 2 — strengthen content rather than expand.

### 3.2 Expansion targets

**3.2.1 Amount-specific landing pages (~20 pages)**
- Pattern: `/[amount]-[coin]-dca` → `/100-dollar-bitcoin-dca`, `/500-dollar-ethereum-dca`
- Amounts: $50, $100, $200, $500 × 5 top coins = 20 pages
- Captures "how much bitcoin can i get for $100 a month" long-tail

**3.2.2 Strategy comparison (~10 pages)**
- `/[coin]-dca-vs-lump-sum` for Top 10 coins
- Real backtested data over 5y window, not boilerplate

**3.2.3 Year-in-review (~5 pages)**
- `/bitcoin-dca-2024-results`, `/bitcoin-dca-2025-results`, etc.
- Auto-generate the next year's page each January
- Core data: what $100/month DCA yielded for that specific year

**3.2.4 Korean-native intent (~10 pages)**
- `/ko/bitcoin-적립식-100달러` type slugs (slug in ASCII, title in Korean)
- Strategy comparisons in Korean
- Highest ROI per page — Korean crypto DCA content is thin on the web

### 3.3 AI slop prevention

- Each page must include **unique computed numbers and a unique chart**. No pure-prose pages.
- Batch size: 5–10 pages per deploy. Wait 2 weeks. Measure. Only then next batch.
- Any page type with <20% indexation rate after 2 weeks → flip to noindex, do not expand that type further.

---

## Phase 4 — Measurement and Rollout

### 4.1 Weekly checkpoint (every Monday)

- Pull GSC: indexed / discovered ratio, impressions by page, top queries
- Primary KPI: **indexed / discovered ratio**
- Secondary KPIs: impressions, avg position on Top 10 coin pages

### 4.2 Rollback triggers

- Indexed count *decreases* for 2 consecutive weeks after a deploy → roll back the most recent batch
- New page type indexation rate < 20% at 2-week mark → flip the type to noindex, do not expand
- CTR on indexed pages < 0.5% after reaching page 1 → revisit titles/descriptions before adding more pages

### 4.3 Timeline

| Week | Work | Check |
|---|---|---|
| W1 | Phase 1: www redirect, noindex policy, sitemap cleanup, GSC Domain property | Indexation unchanged expected; monitor Coverage report |
| W2 | Phase 2 Tier 1: ETH, BTC, DOGE, SOL, XRP, ADA (EN+KO) deep-content rebuild | Deploy, Request Indexing |
| W3 | Phase 2 Tier 2: BNB, AVAX, DOT, LINK (EN+KO) + Top 5 comparison rebuild | Deploy, Request Indexing |
| W4 | Measurement week. GO/NO-GO on Phase 3. | Indexed ≥ 20 → GO |
| W5–8 | Phase 3 (if GO): batch expansion with per-batch measurement | Weekly |

---

## Files touched (summary)

- `wrangler.jsonc` or new Cloudflare Worker file — www → non-www redirect
- `src/lib/seo.ts` *(new)* — Top 10 coin / Top 5 pair constants + `shouldIndex(type, slug)`
- `src/lib/dca-scenarios.ts` *(new)* — `computeScenarioMatrix` + risk stats
- `src/components/DcaChart.tsx` *(new)* — RSC SVG chart
- `src/app/[slug]/page.tsx` — deep-content rebuild for Top 10, per-page robots metadata
- `src/app/[slug]/guide/page.tsx` — per-page robots metadata, expanded FAQ
- `src/app/ko/[coin]/page.tsx` — same treatment, KO strings
- `src/app/ko/[coin]/tax/page.tsx` — add `noindex`
- `src/app/sitemap.ts` — emit only the ~54 indexable URLs
- `__tests__/seo.test.ts` *(new)* — indexation policy
- `__tests__/dca-scenarios.test.ts` *(new)* — matrix math

## Risks

- **Korean tax pages currently rank (one click from `/ko/btc`, not from `/ko/btc/tax`, but tax pages provide some internal linking).** Applying noindex is safe — they still pass link equity with `follow`.
- **Removing 190 comparison pages from index loses the top-impression page (`/btc-vs-eth`, 95 impr).** Accepted trade: pos 17 with 0 clicks is worth less than cleaner quality signal. We rebuild it in Phase 2 as one of the Top 5 indexable pairs.
- **Pre-rendering 10 coins × scenario matrix at build time increases build duration.** Acceptable (Binance data fetch is cheap). If a single coin fetch fails, the build should fall back to cached data, not fail — add a 7-day stale-while-error window in `dca-scenarios.ts`.
- **Cloudflare Pages + OpenNext ISR:** verify `revalidate` works on this adapter. If not, daily rebuild via GitHub Action cron.
