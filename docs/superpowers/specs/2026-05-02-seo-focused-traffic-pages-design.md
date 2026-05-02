# DCAify — SEO Focused Traffic Pages Design

**Date:** 2026-05-02
**Status:** Approved design, pending implementation plan
**Owner:** junghocho

## Context

DCAify already completed the first index hygiene phase:

- `www.dcaify.com` redirects to `https://dcaify.com` with a 301.
- `robots.txt` allows crawling and points to `https://dcaify.com/sitemap.xml`.
- The sitemap emits 53 high-signal URLs.
- Top coin pages are indexable; lower-priority coin pages and tax pages are `noindex, follow`.
- Current tests pass: 71 tests across 6 files.

The remaining SEO bottleneck is page depth. The indexable calculator pages still render mostly form UI, short generic copy, and no default result. Search engines can crawl the page, but they do not get much evidence that the page answers the searcher's query before a user interacts with the calculator.

## Goal

Increase near-term organic traffic by deeply improving a small set of pages instead of spreading effort across all Top 10 coins.

Primary target pages:

- `/btc`
- `/eth`
- `/sol`
- `/ko/btc`
- `/btc-vs-eth`

Success criteria:

- Each target page contains meaningful server-rendered calculation output before the interactive calculator.
- Each page has unique data, unique copy, and internal links that match its search intent.
- The existing conservative indexation policy remains unchanged.
- Existing calculator behavior remains available and functional below the SEO content.

## Non-Goals

- Do not expand the sitemap or add new programmatic SEO URL types in this phase.
- Do not make tax pages indexable.
- Do not rebuild the full site visual system.
- Do not rewrite every coin page.
- Do not add backlink, analytics, or Search Console automation work to this implementation.

## Recommended Approach

Use a focused five-page enhancement:

1. Strengthen three English coin pages: `/btc`, `/eth`, `/sol`.
2. Strengthen the highest-leverage Korean coin page: `/ko/btc`.
3. Strengthen the highest-leverage comparison page: `/btc-vs-eth`.

This balances broad English demand, existing Korean opportunity, and comparison search intent. It also keeps the implementation small enough to review for quality.

## Page Architecture

The current interactive calculators remain in place, but they move below a server-rendered SEO summary.

For `/btc`, `/eth`, `/sol`, and `/ko/btc`, each page should render:

1. Hero result summary for the default scenario.
2. Scenario matrix for monthly investment amounts over multiple windows.
3. DCA vs lump sum comparison.
4. Risk and trust metrics.
5. Search-intent copy tailored to the coin and locale.
6. FAQ content and JSON-LD where supported by visible page content.
7. Existing interactive `DcaCalculator`.
8. Existing related links, adjusted if needed to favor indexable pages.

For `/btc-vs-eth`, the page should render:

1. Comparison hero for a shared default DCA plan.
2. Winner summary with value, ROI, and difference.
3. Side-by-side scenario matrix.
4. Explanation of when BTC tends to fit better and when ETH tends to fit better.
5. Links to both calculators and guide pages.
6. Existing interactive `ComparisonCalculator`.

## Data Model

Add a scenario module, likely `src/lib/dca-scenarios.ts`, with pure functions wherever possible.

Expected APIs:

- `computeCoinSeoSnapshot(coin, options)` returns the server-rendered data for one coin page.
- `computeComparisonSeoSnapshot(leftCoin, rightCoin, options)` returns the server-rendered data for one comparison page.

The exact function names can be adjusted during implementation, but the boundary should stay clear:

- Data fetching and calculation live outside route components.
- Route components render prepared view models.
- Formatting stays centralized through existing formatter helpers where practical.

Default coin scenario:

- Investment amount: `$100/month`.
- Window: 5 years, or the longest available period if the coin has less than 5 years of price history.
- Data basis: existing Binance daily close data.

Scenario matrix:

- Amounts: `$50`, `$100`, `$250`, `$500` monthly.
- Windows: `1y`, `3y`, `5y`.
- If a coin lacks enough history for a window, show the available-history fallback explicitly rather than pretending the full window exists.

Risk and trust metrics:

- Total invested.
- Current value.
- ROI.
- Accumulated coin amount.
- Number of purchases.
- Average buy price.
- Current or ending price.
- Maximum drawdown over the scenario window.

DCA vs lump sum:

- Use the same total capital as the default DCA scenario.
- Compare investing it all at the start date with investing monthly over the same window.
- Report value difference and which method won for the selected historical window.

## Content Plan

### `/btc`

Intent: "Bitcoin DCA calculator" and long-term Bitcoin recurring investment.

Emphasis:

- Bitcoin as the reference crypto DCA asset.
- Long-term store-of-value framing.
- Volatility smoothing through recurring buys.
- Concrete default result and scenario table above the fold.

### `/eth`

Intent: "Ethereum DCA calculator" and ETH recurring investment.

Emphasis:

- Ethereum as smart contract infrastructure.
- Different risk profile from Bitcoin.
- DCA as a way to reduce timing pressure in a volatile asset with ecosystem-driven demand.

### `/sol`

Intent: "Solana DCA calculator" and higher-volatility Layer 1 investing.

Emphasis:

- Shorter price history than BTC and ETH.
- Higher volatility and stronger need to show risk metrics.
- Clear fallback handling if a full 5-year window is not available.

### `/ko/btc`

Intent: "비트코인 적립식 투자 계산기" and Korean-language DCA search.

Emphasis:

- Korean-native phrasing, not a direct translation.
- USD data basis stated clearly.
- Long-term recurring investment, break-even framing, volatility, and practical interpretation.
- Link to `/ko/btc/tax` for tax-specific exploration while keeping the tax page `noindex`.

### `/btc-vs-eth`

Intent: compare Bitcoin and Ethereum under the same DCA plan.

Emphasis:

- "Same plan, two assets" framing.
- Winner summary for the default scenario.
- Side-by-side data table.
- Practical explanation of why a user might choose BTC, ETH, or both.

## Components

Create server-rendered components under a focused namespace, likely `src/components/seo/`:

- `CoinSeoSnapshot`
- `ScenarioMatrix`
- `DcaVsLumpSum`
- `RiskMetrics`
- `ComparisonSeoSnapshot`
- `SeoFaq`

Names may change during implementation, but components should remain small and single-purpose. Avoid putting all SEO rendering into one large route file.

## Structured Data

Structured data must match visible page content.

Use:

- Existing `WebApplication` schema on calculator pages.
- `FAQPage` schema only for visible FAQ content.
- A dataset-like JSON-LD object may be added for scenario tables if it can accurately represent visible data without overstating claims.

Avoid:

- Claiming investment advice.
- Adding schema for results that are not visible on the page.
- Adding inaccurate tax or financial guarantee claims.

## Error Handling

If price data is unavailable:

- Do not fail the route render if a graceful fallback is possible.
- Hide result-dependent JSON-LD.
- Render a short explanation that recent price data could not be loaded.
- Keep the existing interactive calculator and evergreen explanatory content visible.

If a requested history window is not available:

- Use the longest available window.
- Label the adjusted window clearly in the UI.
- Keep the calculation honest rather than backfilling missing history.

## Testing

Add focused coverage:

- Unit tests for the scenario calculation module using fixture price series.
- Tests for scenario matrix values, ROI, average buy price, drawdown, and lump-sum comparison.
- Tests for comparison winner and difference calculations.
- Render or snapshot-level tests confirming `/btc` output includes default result content, scenario table markers, and FAQ/schema content.

Verification commands:

- `npm run test`
- Source-scoped lint command if generated `.open-next` output still causes `npm run lint` to fail.

Current note:

- `npm run lint` scans generated `.open-next` files and fails on generated output.
- Source-scoped ESLint currently passes when run against `src`, `__tests__`, and config files.
- A separate cleanup can add `.open-next` to ESLint ignores; it is useful but not required for the SEO page implementation.

## Rollout

Implementation should ship in one focused batch:

1. Add scenario calculation and tests.
2. Add reusable SEO components.
3. Enhance `/btc`, `/eth`, `/sol`, and `/ko/btc`.
4. Enhance `/btc-vs-eth`.
5. Verify tests and rendered HTML.
6. Deploy.
7. Request indexing in Search Console for the five target URLs after deployment.

After one to two weeks, compare impressions and indexed status for these five URLs before expanding to more pages.

## Risks

- Pages can become formulaic if copy differs only by coin name. Mitigation: tailor each page's explanatory sections to the asset and search intent.
- Price data fetches can make builds or SSR fragile. Mitigation: keep calculation logic isolated and provide explicit fallbacks.
- Adding too much content above the calculator can hurt usability. Mitigation: keep the hero result and scenario table compact, then provide the interactive calculator immediately after the SEO summary.
- Structured data can become misleading if it diverges from visible content. Mitigation: generate JSON-LD from the same snapshot data used for visible sections.
