# SEO Focused Traffic Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add server-rendered, result-rich SEO sections to `/btc`, `/eth`, `/sol`, `/ko/btc`, and `/btc-vs-eth` while preserving the existing interactive calculators.

**Architecture:** Extract Binance daily-close fetching into a shared server utility, add a pure scenario calculation module, then render focused server components above the existing client calculators. The route files only decide whether a page is in the focused SEO set, fetch/build the snapshot, and compose server SEO content with the current calculator UI.

**Tech Stack:** Next.js 16 App Router, React Server Components, TypeScript, Vitest, `react-dom/server`, existing Binance price data and DCA calculation utilities.

---

## Pre-Flight

- [ ] Read `AGENTS.md` at repo root. It requires checking `node_modules/next/dist/docs/` before writing Next.js code because this is Next.js 16.2.1.
- [ ] Read `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`. Use `params: Promise<...>` in App Router route files and keep metadata exports in Server Components.
- [ ] Read `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`. Render JSON-LD with a native `<script type="application/ld+json">` and sanitize `JSON.stringify(...).replace(/</g, '\\u003c')`.
- [ ] Run baseline tests.

```bash
npm run test
```

Expected: `6 passed`, `71 passed`.

- [ ] Run source-scoped lint baseline.

```bash
./node_modules/.bin/eslint src __tests__ next.config.ts open-next.config.ts vitest.config.ts
```

Expected: no output and exit code `0`.

## File Structure

Create:

- `src/lib/binance-prices.ts` — shared server-side Binance daily close fetching and per-year in-memory cache.
- `src/lib/dca-scenarios.ts` — pure SEO scenario calculations plus small async builders that call the shared price utility.
- `src/components/seo/JsonLdScript.tsx` — JSON-LD script helper with `<` escaping.
- `src/components/seo/CoinSeoSnapshot.tsx` — server-rendered focused coin SEO section.
- `src/components/seo/ComparisonSeoSnapshot.tsx` — server-rendered focused comparison SEO section.
- `__tests__/lib/binance-prices.test.ts` — fetch/caching/filtering coverage for the shared price utility.
- `__tests__/lib/dca-scenarios.test.ts` — scenario math coverage with fixture prices.
- `__tests__/components/seo-snapshot-components.test.tsx` — server-rendered component coverage.

Modify:

- `src/app/api/prices/route.ts` — use `getHistoricalPrices` from `src/lib/binance-prices.ts` instead of maintaining a separate Binance implementation.
- `src/lib/seo.ts` — add focused traffic target helpers.
- `__tests__/lib/seo.test.ts` — cover focused traffic target helpers.
- `src/app/[slug]/page.tsx` — render coin SEO snapshots for `/btc`, `/eth`, `/sol`; render comparison SEO snapshot for `/btc-vs-eth`.
- `src/app/ko/[coin]/page.tsx` — render Korean coin SEO snapshot for `/ko/btc`.
- `src/components/DcaCalculator.tsx` — allow the existing calculator title to render as `h2` when an SEO `h1` is already on the page.
- `src/components/ComparisonCalculator.tsx` — add the same `headingLevel?: 'h1' | 'h2'` prop pattern used by `DcaCalculator`.
- `eslint.config.mjs` — ignore generated `.open-next/**` output so `npm run lint` checks source, not build artifacts.

## Task 1: Shared Binance Price Utility

**Files:**
- Create: `src/lib/binance-prices.ts`
- Modify: `src/app/api/prices/route.ts`
- Test: `__tests__/lib/binance-prices.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/binance-prices.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearHistoricalPriceCacheForTests, getHistoricalPrices } from '@/lib/binance-prices'

function makeKline(timestamp: string, close: string) {
  return [new Date(`${timestamp}T00:00:00Z`).getTime(), '0', '0', '0', close]
}

describe('getHistoricalPrices', () => {
  beforeEach(() => {
    clearHistoricalPriceCacheForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches yearly Binance daily closes and filters to the requested dates', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        makeKline('2024-12-31', '90'),
        makeKline('2025-01-01', '100'),
        makeKline('2025-01-02', '110'),
      ],
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getHistoricalPrices({
      binanceSymbol: 'BTCUSDT',
      from: '2025-01-01',
      to: '2025-01-02',
      now: new Date('2025-01-03T00:00:00Z'),
    })

    expect(result.dataSource).toBe('live')
    expect(result.prices).toEqual([
      { timestamp: new Date('2025-01-01T00:00:00Z').getTime(), price: 100 },
      { timestamp: new Date('2025-01-02T00:00:00Z').getTime(), price: 110 },
    ])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('symbol=BTCUSDT')
  })

  it('uses cached yearly data on the second call', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [makeKline('2025-01-01', '100')],
    })
    vi.stubGlobal('fetch', fetchMock)

    await getHistoricalPrices({
      binanceSymbol: 'ETHUSDT',
      from: '2025-01-01',
      to: '2025-01-01',
      now: new Date('2025-01-03T00:00:00Z'),
    })
    const second = await getHistoricalPrices({
      binanceSymbol: 'ETHUSDT',
      from: '2025-01-01',
      to: '2025-01-01',
      now: new Date('2025-01-03T00:00:00Z'),
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second.dataSource).toBe('cache')
    expect(second.prices[0].price).toBe(100)
  })

  it('throws when every Binance base URL fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    await expect(
      getHistoricalPrices({
        binanceSymbol: 'SOLUSDT',
        from: '2025-01-01',
        to: '2025-01-02',
        now: new Date('2025-01-03T00:00:00Z'),
      }),
    ).rejects.toThrow('Binance upstream unavailable for SOLUSDT/2025')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
npm run test -- __tests__/lib/binance-prices.test.ts
```

Expected: FAIL with `Cannot find module '@/lib/binance-prices'`.

- [ ] **Step 3: Implement `src/lib/binance-prices.ts`**

Create `src/lib/binance-prices.ts`:

```ts
import { LRUCache } from 'lru-cache'
import type { PricePoint, PricesResponse } from '@/types/prices'

const historicalPriceCache = new LRUCache<string, PricePoint[]>({
  maxSize: 50 * 1024 * 1024,
  sizeCalculation: (value) => JSON.stringify(value).length,
  ttl: 1000 * 60 * 60,
})

const BINANCE_BASE_URLS = [
  'https://data-api.binance.vision',
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
] as const

interface HistoricalPriceParams {
  binanceSymbol: string
  from: string
  to: string
  now?: Date
}

function currentYear(now: Date): number {
  return now.getUTCFullYear()
}

function cacheKey(binanceSymbol: string, year: number): string {
  return `bn:${binanceSymbol}:${year}`
}

function createUpstreamError(message: string, status = 0): Error & { status: number } {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function logPriceEvent(event: string, detail: Record<string, unknown>): void {
  console.error(JSON.stringify({ scope: 'binance_prices', event, ...detail }))
}

async function fetchYearFromBinance(binanceSymbol: string, year: number, now: Date): Promise<PricePoint[]> {
  const startTime = new Date(`${year}-01-01T00:00:00Z`).getTime()
  const endTime =
    year === currentYear(now)
      ? now.getTime()
      : new Date(`${year}-12-31T23:59:59Z`).getTime()
  const path = `/api/v3/klines?symbol=${binanceSymbol}&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=1000`

  let response: Response | null = null
  for (const baseUrl of BINANCE_BASE_URLS) {
    try {
      response = await fetch(baseUrl + path, { next: { revalidate: 0 } })
      if (response.ok) break
    } catch (error) {
      logPriceEvent('upstream_fetch_failed', {
        baseUrl,
        binanceSymbol,
        year,
        error: error instanceof Error ? error.message : 'unknown_error',
      })
    }
  }

  if (!response || !response.ok) {
    throw createUpstreamError(
      `Binance upstream unavailable for ${binanceSymbol}/${year}`,
      response?.status ?? 0,
    )
  }

  const data = (await response.json()) as [number, string, string, string, string, ...unknown[]][]
  return data.map(([openTime, , , , close]) => ({
    timestamp: openTime,
    price: parseFloat(close),
  }))
}

async function getPricesForYear(
  binanceSymbol: string,
  year: number,
  now: Date,
): Promise<{ prices: PricePoint[]; source: PricesResponse['dataSource'] }> {
  const key = cacheKey(binanceSymbol, year)
  const cached = historicalPriceCache.get(key)
  if (cached) return { prices: cached, source: 'cache' }

  const prices = await fetchYearFromBinance(binanceSymbol, year, now)
  historicalPriceCache.set(key, prices)
  return { prices, source: 'live' }
}

export async function getHistoricalPrices({
  binanceSymbol,
  from,
  to,
  now = new Date(),
}: HistoricalPriceParams): Promise<PricesResponse> {
  const fromDate = new Date(`${from}T00:00:00Z`)
  const toDate = new Date(`${to}T00:00:00Z`)
  const fromYear = fromDate.getUTCFullYear()
  const toYear = Math.min(toDate.getUTCFullYear(), currentYear(now))
  const allPrices: PricePoint[] = []
  let dataSource: PricesResponse['dataSource'] = 'cache'

  for (let year = fromYear; year <= toYear; year += 1) {
    const { prices, source } = await getPricesForYear(binanceSymbol, year, now)
    allPrices.push(...prices)
    if (source === 'live') dataSource = 'live'
    if (source === 'stale') dataSource = 'stale'
  }

  const fromTimestamp = fromDate.getTime()
  const toTimestamp = toDate.getTime()
  const prices = allPrices.filter(
    (point) => point.timestamp >= fromTimestamp && point.timestamp <= toTimestamp,
  )

  return {
    coinId: binanceSymbol,
    prices,
    dataSource,
    fromTimestamp,
    toTimestamp,
  }
}

export function clearHistoricalPriceCacheForTests(): void {
  historicalPriceCache.clear()
}
```

- [ ] **Step 4: Run the focused test and confirm it passes**

```bash
npm run test -- __tests__/lib/binance-prices.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Refactor the API route to use the shared utility**

In `src/app/api/prices/route.ts`:

1. Remove `import { LRUCache } from 'lru-cache'`.
2. Remove the `PricePoint` import from `@/types/prices`.
3. Add:

```ts
import { getHistoricalPrices } from '@/lib/binance-prices'
```

4. Delete the `lruCache`, `currentYear`, `cacheKey`, `createUpstreamError`, `fetchYearFromBinance`, and `getPricesForYear` declarations from the route file.
5. Replace the `try` block in `GET` with:

```ts
  try {
    const response = await getHistoricalPrices({
      binanceSymbol: coin.binanceSymbol,
      from: fromParam,
      to: toParam,
    })

    return NextResponse.json<PricesResponse>({
      ...response,
      coinId: coin.id,
    })
  } catch (error) {
    logApiEvent('upstream_unavailable', {
      coin: coin.slug,
      from: fromParam,
      to: toParam,
      error: error instanceof Error ? error.message : 'unknown_error',
    })
    return errorResponse(500, 'upstream_unavailable', 'Failed to fetch price data. Please try again later.')
  }
```

- [ ] **Step 6: Run affected tests**

```bash
npm run test -- __tests__/lib/binance-prices.test.ts __tests__/lib/dca.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/binance-prices.ts src/app/api/prices/route.ts __tests__/lib/binance-prices.test.ts
git commit -m "refactor(seo): share Binance price fetching"
```

## Task 2: Focused SEO Targets

**Files:**
- Modify: `src/lib/seo.ts`
- Test: `__tests__/lib/seo.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `__tests__/lib/seo.test.ts`:

```ts
import { isFocusedTrafficCoin, isFocusedTrafficComparison, isFocusedTrafficKoreanCoin } from '@/lib/seo'

describe('focused traffic targets', () => {
  it('targets the English BTC, ETH, and SOL coin pages', () => {
    expect(isFocusedTrafficCoin('btc')).toBe(true)
    expect(isFocusedTrafficCoin('eth')).toBe(true)
    expect(isFocusedTrafficCoin('sol')).toBe(true)
    expect(isFocusedTrafficCoin('xrp')).toBe(false)
  })

  it('targets only the Korean BTC coin page in this phase', () => {
    expect(isFocusedTrafficKoreanCoin('btc')).toBe(true)
    expect(isFocusedTrafficKoreanCoin('eth')).toBe(false)
  })

  it('targets only BTC vs ETH as the focused comparison page', () => {
    expect(isFocusedTrafficComparison('btc-vs-eth')).toBe(true)
    expect(isFocusedTrafficComparison('eth-vs-sol')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
npm run test -- __tests__/lib/seo.test.ts
```

Expected: FAIL with missing exports.

- [ ] **Step 3: Add focused target helpers**

Append to `src/lib/seo.ts`:

```ts
export const FOCUSED_TRAFFIC_COIN_SLUGS = ['btc', 'eth', 'sol'] as const
export const FOCUSED_TRAFFIC_KO_COIN_SLUGS = ['btc'] as const
export const FOCUSED_TRAFFIC_COMPARISON_SLUGS = ['btc-vs-eth'] as const

const FOCUSED_TRAFFIC_COIN_SET: ReadonlySet<string> = new Set(FOCUSED_TRAFFIC_COIN_SLUGS)
const FOCUSED_TRAFFIC_KO_COIN_SET: ReadonlySet<string> = new Set(FOCUSED_TRAFFIC_KO_COIN_SLUGS)
const FOCUSED_TRAFFIC_COMPARISON_SET: ReadonlySet<string> = new Set(FOCUSED_TRAFFIC_COMPARISON_SLUGS)

export function isFocusedTrafficCoin(slug: string): boolean {
  return FOCUSED_TRAFFIC_COIN_SET.has(slug)
}

export function isFocusedTrafficKoreanCoin(slug: string): boolean {
  return FOCUSED_TRAFFIC_KO_COIN_SET.has(slug)
}

export function isFocusedTrafficComparison(slug: string): boolean {
  return FOCUSED_TRAFFIC_COMPARISON_SET.has(slug)
}
```

- [ ] **Step 4: Run the test and confirm it passes**

```bash
npm run test -- __tests__/lib/seo.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo.ts __tests__/lib/seo.test.ts
git commit -m "feat(seo): mark focused traffic targets"
```

## Task 3: SEO Scenario Calculations

**Files:**
- Create: `src/lib/dca-scenarios.ts`
- Test: `__tests__/lib/dca-scenarios.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/dca-scenarios.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  calculateAssetMaxDrawdownPct,
  computeCoinSeoSnapshotFromPrices,
  computeComparisonSeoSnapshotFromPrices,
} from '@/lib/dca-scenarios'
import { getCoinBySlug } from '@/lib/coins'
import type { PricePoint } from '@/types/prices'

function point(date: string, price: number): PricePoint {
  return { timestamp: new Date(`${date}T00:00:00Z`).getTime(), price }
}

function monthlyPrices(startYear: number, endYear: number, price: number): PricePoint[] {
  const prices: PricePoint[] = []
  for (let year = startYear; year <= endYear; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      prices.push({
        timestamp: Date.UTC(year, month, 1),
        price,
      })
    }
  }
  return prices
}

describe('calculateAssetMaxDrawdownPct', () => {
  it('returns the largest peak-to-trough asset drawdown', () => {
    expect(calculateAssetMaxDrawdownPct([
      point('2025-01-01', 100),
      point('2025-02-01', 200),
      point('2025-03-01', 50),
      point('2025-04-01', 150),
    ])).toBeCloseTo(-75, 2)
  })

  it('returns 0 for a monotonically rising price series', () => {
    expect(calculateAssetMaxDrawdownPct([
      point('2025-01-01', 100),
      point('2025-02-01', 120),
      point('2025-03-01', 130),
    ])).toBe(0)
  })
})

describe('computeCoinSeoSnapshotFromPrices', () => {
  it('builds a deterministic coin SEO snapshot from fixture prices', () => {
    const coin = getCoinBySlug('btc')
    if (!coin) throw new Error('BTC fixture missing')

    const snapshot = computeCoinSeoSnapshotFromPrices({
      coin,
      lang: 'en',
      prices: monthlyPrices(2021, 2025, 100),
    })

    expect(snapshot.ok).toBe(true)
    if (!snapshot.ok) throw new Error('expected success snapshot')

    expect(snapshot.defaultScenario.result.totalInvested).toBe(6000)
    expect(snapshot.defaultScenario.result.totalCoins).toBeCloseTo(60, 6)
    expect(snapshot.defaultScenario.result.currentValue).toBeCloseTo(6000, 2)
    expect(snapshot.defaultScenario.result.roi).toBeCloseTo(0, 2)
    expect(snapshot.risk.averageBuyPrice).toBeCloseTo(100, 2)
    expect(snapshot.risk.currentPrice).toBe(100)
    expect(snapshot.scenarioMatrix).toHaveLength(12)
    expect(snapshot.dcaVsLumpSum.winner).toBe('tie')
  })

  it('returns an unavailable snapshot when price data is empty', () => {
    const coin = getCoinBySlug('eth')
    if (!coin) throw new Error('ETH fixture missing')

    const snapshot = computeCoinSeoSnapshotFromPrices({
      coin,
      lang: 'en',
      prices: [],
    })

    expect(snapshot).toEqual({
      ok: false,
      coin,
      lang: 'en',
      reason: 'price_data_unavailable',
    })
  })
})

describe('computeComparisonSeoSnapshotFromPrices', () => {
  it('builds a BTC vs ETH comparison winner from fixture prices', () => {
    const btc = getCoinBySlug('btc')
    const eth = getCoinBySlug('eth')
    if (!btc || !eth) throw new Error('coin fixtures missing')

    const snapshot = computeComparisonSeoSnapshotFromPrices({
      leftCoin: btc,
      rightCoin: eth,
      leftPrices: monthlyPrices(2021, 2025, 100),
      rightPrices: monthlyPrices(2021, 2025, 200),
    })

    expect(snapshot.ok).toBe(true)
    if (!snapshot.ok) throw new Error('expected success snapshot')

    expect(snapshot.left.defaultScenario.result.currentValue).toBeCloseTo(6000, 2)
    expect(snapshot.right.defaultScenario.result.currentValue).toBeCloseTo(6000, 2)
    expect(snapshot.verdict.winner).toBe('tie')
    expect(snapshot.scenarioRows).toHaveLength(12)
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
npm run test -- __tests__/lib/dca-scenarios.test.ts
```

Expected: FAIL with missing module.

- [ ] **Step 3: Implement `src/lib/dca-scenarios.ts`**

Create `src/lib/dca-scenarios.ts`:

```ts
import { calculateDca, type DcaResult } from '@/lib/dca'
import { getHistoricalPrices } from '@/lib/binance-prices'
import { buildComparisonVerdict, type ComparisonVerdict } from '@/lib/result-interpretation'
import type { CoinConfig } from '@/lib/coins'
import type { PricePoint, PricesResponse } from '@/types/prices'

export type SeoLang = 'en' | 'ko'
export type ScenarioWindowLabel = '1y' | '3y' | '5y'
export type SeoSnapshotUnavailableReason = 'price_data_unavailable' | 'price_fetch_failed'

export const SEO_MONTHLY_AMOUNTS = [50, 100, 250, 500] as const
export const SEO_SCENARIO_WINDOWS: readonly { label: ScenarioWindowLabel; years: number }[] = [
  { label: '1y', years: 1 },
  { label: '3y', years: 3 },
  { label: '5y', years: 5 },
]

export interface SeoScenario {
  amount: number
  label: ScenarioWindowLabel
  years: number
  startDate: string
  endDate: string
  adjustedStartDate: boolean
  result: DcaResult
}

export interface DcaVsLumpSumSnapshot {
  lumpSumValue: number
  lumpSumCoins: number
  dcaValue: number
  difference: number
  winner: 'dca' | 'lump_sum' | 'tie'
}

export interface SeoRiskMetrics {
  averageBuyPrice: number
  currentPrice: number
  purchaseCount: number
  maxDrawdownPct: number
}

export interface CoinSeoSuccessSnapshot {
  ok: true
  coin: CoinConfig
  lang: SeoLang
  dataSource: PricesResponse['dataSource'] | 'fixture'
  asOfDate: string
  defaultScenario: SeoScenario
  scenarioMatrix: SeoScenario[]
  dcaVsLumpSum: DcaVsLumpSumSnapshot
  risk: SeoRiskMetrics
}

export interface CoinSeoUnavailableSnapshot {
  ok: false
  coin: CoinConfig
  lang: SeoLang
  reason: SeoSnapshotUnavailableReason
}

export type CoinSeoSnapshot = CoinSeoSuccessSnapshot | CoinSeoUnavailableSnapshot

export interface ComparisonScenarioRow {
  amount: number
  label: ScenarioWindowLabel
  left: SeoScenario
  right: SeoScenario
}

export interface ComparisonSeoSuccessSnapshot {
  ok: true
  left: CoinSeoSuccessSnapshot
  right: CoinSeoSuccessSnapshot
  verdict: ComparisonVerdict
  scenarioRows: ComparisonScenarioRow[]
}

export interface ComparisonSeoUnavailableSnapshot {
  ok: false
  leftCoin: CoinConfig
  rightCoin: CoinConfig
  reason: SeoSnapshotUnavailableReason
}

export type ComparisonSeoSnapshot = ComparisonSeoSuccessSnapshot | ComparisonSeoUnavailableSnapshot

function toIsoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

function subtractYears(date: string, years: number): string {
  const parsed = parseDate(date)
  parsed.setUTCFullYear(parsed.getUTCFullYear() - years)
  return parsed.toISOString().slice(0, 10)
}

function maxIsoDate(...dates: string[]): string {
  return dates.reduce((latest, date) => (date > latest ? date : latest))
}

function sortedPrices(prices: PricePoint[]): PricePoint[] {
  return [...prices].sort((a, b) => a.timestamp - b.timestamp)
}

function pricesWithin(prices: PricePoint[], startDate: string, endDate: string): PricePoint[] {
  const start = parseDate(startDate).getTime()
  const end = parseDate(endDate).getTime()
  return prices.filter((point) => point.timestamp >= start && point.timestamp <= end)
}

function currentPriceFrom(prices: PricePoint[]): number {
  return prices[prices.length - 1]?.price ?? 0
}

function firstPriceOnOrAfter(prices: PricePoint[], startDate: string): PricePoint | null {
  const start = parseDate(startDate).getTime()
  return prices.find((point) => point.timestamp >= start) ?? null
}

export function calculateAssetMaxDrawdownPct(prices: PricePoint[]): number {
  if (prices.length < 2) return 0
  let peak = prices[0].price
  let maxDrawdown = 0

  for (const point of prices) {
    if (point.price > peak) peak = point.price
    if (peak <= 0) continue
    const drawdown = ((point.price - peak) / peak) * 100
    if (drawdown < maxDrawdown) maxDrawdown = drawdown
  }

  return maxDrawdown
}

function calculateDcaVsLumpSum(
  scenario: SeoScenario,
  prices: PricePoint[],
): DcaVsLumpSumSnapshot {
  const startPrice = firstPriceOnOrAfter(prices, scenario.startDate)?.price
  if (!startPrice || startPrice <= 0) {
    return {
      lumpSumValue: 0,
      lumpSumCoins: 0,
      dcaValue: scenario.result.currentValue,
      difference: scenario.result.currentValue,
      winner: 'dca',
    }
  }

  const lumpSumCoins = scenario.result.totalInvested / startPrice
  const lumpSumValue = lumpSumCoins * currentPriceFrom(prices)
  const difference = scenario.result.currentValue - lumpSumValue
  const winner =
    Math.abs(difference) < 0.01 ? 'tie' : difference > 0 ? 'dca' : 'lump_sum'

  return {
    lumpSumValue,
    lumpSumCoins,
    dcaValue: scenario.result.currentValue,
    difference,
    winner,
  }
}

function computeScenario(params: {
  coin: CoinConfig
  prices: PricePoint[]
  amount: number
  label: ScenarioWindowLabel
  years: number
  asOfDate: string
}): SeoScenario {
  const firstAvailableDate = toIsoDate(params.prices[0].timestamp)
  const requestedStartDate = subtractYears(params.asOfDate, params.years)
  const startDate = maxIsoDate(requestedStartDate, params.coin.listingDate, firstAvailableDate)
  const scenarioPrices = pricesWithin(params.prices, startDate, params.asOfDate)
  const currentPrice = currentPriceFrom(scenarioPrices)
  const result = calculateDca({
    prices: scenarioPrices,
    amountPerPeriod: params.amount,
    frequency: 'monthly',
    startDate,
    endDate: params.asOfDate,
    currentPrice,
  })

  return {
    amount: params.amount,
    label: params.label,
    years: params.years,
    startDate,
    endDate: params.asOfDate,
    adjustedStartDate: startDate !== requestedStartDate,
    result,
  }
}

function riskFromScenario(scenario: SeoScenario, prices: PricePoint[]): SeoRiskMetrics {
  const scopedPrices = pricesWithin(prices, scenario.startDate, scenario.endDate)
  return {
    averageBuyPrice:
      scenario.result.totalCoins > 0
        ? scenario.result.totalInvested / scenario.result.totalCoins
        : 0,
    currentPrice: currentPriceFrom(scopedPrices),
    purchaseCount: scenario.result.purchases.length,
    maxDrawdownPct: calculateAssetMaxDrawdownPct(scopedPrices),
  }
}

export function computeCoinSeoSnapshotFromPrices(params: {
  coin: CoinConfig
  lang: SeoLang
  prices: PricePoint[]
  dataSource?: PricesResponse['dataSource'] | 'fixture'
}): CoinSeoSnapshot {
  const prices = sortedPrices(params.prices)
  if (prices.length === 0) {
    return {
      ok: false,
      coin: params.coin,
      lang: params.lang,
      reason: 'price_data_unavailable',
    }
  }

  const asOfDate = toIsoDate(prices[prices.length - 1].timestamp)
  const scenarioMatrix = SEO_SCENARIO_WINDOWS.flatMap(({ label, years }) =>
    SEO_MONTHLY_AMOUNTS.map((amount) =>
      computeScenario({
        coin: params.coin,
        prices,
        amount,
        label,
        years,
        asOfDate,
      }),
    ),
  )
  const defaultScenario =
    scenarioMatrix.find((scenario) => scenario.amount === 100 && scenario.label === '5y') ??
    scenarioMatrix[0]

  return {
    ok: true,
    coin: params.coin,
    lang: params.lang,
    dataSource: params.dataSource ?? 'fixture',
    asOfDate,
    defaultScenario,
    scenarioMatrix,
    dcaVsLumpSum: calculateDcaVsLumpSum(defaultScenario, prices),
    risk: riskFromScenario(defaultScenario, prices),
  }
}

export async function buildCoinSeoSnapshot(params: {
  coin: CoinConfig
  lang: SeoLang
  now?: Date
}): Promise<CoinSeoSnapshot> {
  const today = (params.now ?? new Date()).toISOString().slice(0, 10)
  const from = maxIsoDate(subtractYears(today, 5), params.coin.listingDate)

  try {
    const priceResponse = await getHistoricalPrices({
      binanceSymbol: params.coin.binanceSymbol,
      from,
      to: today,
      now: params.now,
    })
    return computeCoinSeoSnapshotFromPrices({
      coin: params.coin,
      lang: params.lang,
      prices: priceResponse.prices,
      dataSource: priceResponse.dataSource,
    })
  } catch {
    return {
      ok: false,
      coin: params.coin,
      lang: params.lang,
      reason: 'price_fetch_failed',
    }
  }
}

export function computeComparisonSeoSnapshotFromPrices(params: {
  leftCoin: CoinConfig
  rightCoin: CoinConfig
  leftPrices: PricePoint[]
  rightPrices: PricePoint[]
}): ComparisonSeoSnapshot {
  const left = computeCoinSeoSnapshotFromPrices({
    coin: params.leftCoin,
    lang: 'en',
    prices: params.leftPrices,
  })
  const right = computeCoinSeoSnapshotFromPrices({
    coin: params.rightCoin,
    lang: 'en',
    prices: params.rightPrices,
  })

  if (!left.ok || !right.ok) {
    return {
      ok: false,
      leftCoin: params.leftCoin,
      rightCoin: params.rightCoin,
      reason: !left.ok ? left.reason : right.reason,
    }
  }

  const scenarioRows = left.scenarioMatrix.map((leftScenario) => {
    const rightScenario = right.scenarioMatrix.find(
      (scenario) => scenario.amount === leftScenario.amount && scenario.label === leftScenario.label,
    )
    if (!rightScenario) {
      throw new Error(`Missing right comparison scenario for ${leftScenario.amount}/${leftScenario.label}`)
    }
    return {
      amount: leftScenario.amount,
      label: leftScenario.label,
      left: leftScenario,
      right: rightScenario,
    }
  })

  return {
    ok: true,
    left,
    right,
    verdict: buildComparisonVerdict({
      left: left.defaultScenario.result,
      right: right.defaultScenario.result,
    }),
    scenarioRows,
  }
}

export async function buildComparisonSeoSnapshot(params: {
  leftCoin: CoinConfig
  rightCoin: CoinConfig
  now?: Date
}): Promise<ComparisonSeoSnapshot> {
  const [left, right] = await Promise.all([
    buildCoinSeoSnapshot({ coin: params.leftCoin, lang: 'en', now: params.now }),
    buildCoinSeoSnapshot({ coin: params.rightCoin, lang: 'en', now: params.now }),
  ])

  if (!left.ok || !right.ok) {
    return {
      ok: false,
      leftCoin: params.leftCoin,
      rightCoin: params.rightCoin,
      reason: !left.ok ? left.reason : right.reason,
    }
  }

  const scenarioRows = left.scenarioMatrix.map((leftScenario) => {
    const rightScenario = right.scenarioMatrix.find(
      (scenario) => scenario.amount === leftScenario.amount && scenario.label === leftScenario.label,
    )
    if (!rightScenario) {
      throw new Error(`Missing right comparison scenario for ${leftScenario.amount}/${leftScenario.label}`)
    }
    return {
      amount: leftScenario.amount,
      label: leftScenario.label,
      left: leftScenario,
      right: rightScenario,
    }
  })

  return {
    ok: true,
    left,
    right,
    verdict: buildComparisonVerdict({
      left: left.defaultScenario.result,
      right: right.defaultScenario.result,
    }),
    scenarioRows,
  }
}
```

- [ ] **Step 4: Run the focused test**

```bash
npm run test -- __tests__/lib/dca-scenarios.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run all lib tests**

```bash
npm run test -- __tests__/lib/dca.test.ts __tests__/lib/result-interpretation.test.ts __tests__/lib/seo.test.ts __tests__/lib/binance-prices.test.ts __tests__/lib/dca-scenarios.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/dca-scenarios.ts __tests__/lib/dca-scenarios.test.ts
git commit -m "feat(seo): compute focused DCA scenarios"
```

## Task 4: Server-Rendered SEO Components

**Files:**
- Create: `src/components/seo/JsonLdScript.tsx`
- Create: `src/components/seo/CoinSeoSnapshot.tsx`
- Create: `src/components/seo/ComparisonSeoSnapshot.tsx`
- Test: `__tests__/components/seo-snapshot-components.test.tsx`

- [ ] **Step 1: Write the failing component tests**

Create `__tests__/components/seo-snapshot-components.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CoinSeoSnapshotView from '@/components/seo/CoinSeoSnapshot'
import ComparisonSeoSnapshotView from '@/components/seo/ComparisonSeoSnapshot'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { computeCoinSeoSnapshotFromPrices, computeComparisonSeoSnapshotFromPrices } from '@/lib/dca-scenarios'
import { getCoinBySlug } from '@/lib/coins'
import type { PricePoint } from '@/types/prices'

function monthlyPrices(startYear: number, endYear: number, price: number): PricePoint[] {
  const prices: PricePoint[] = []
  for (let year = startYear; year <= endYear; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      prices.push({ timestamp: Date.UTC(year, month, 1), price })
    }
  }
  return prices
}

describe('JsonLdScript', () => {
  it('escapes less-than characters in JSON-LD payloads', () => {
    const html = renderToStaticMarkup(<JsonLdScript data={{ name: '<script>' }} />)
    expect(html).toContain('\\u003cscript>')
    expect(html).not.toContain('<script&gt;')
  })
})

describe('CoinSeoSnapshotView', () => {
  it('renders a focused English coin SEO snapshot with table and FAQ schema', () => {
    const coin = getCoinBySlug('btc')
    if (!coin) throw new Error('BTC fixture missing')
    const snapshot = computeCoinSeoSnapshotFromPrices({
      coin,
      lang: 'en',
      prices: monthlyPrices(2021, 2025, 100),
    })

    const html = renderToStaticMarkup(<CoinSeoSnapshotView snapshot={snapshot} />)

    expect(html).toContain('Bitcoin DCA Calculator')
    expect(html).toContain('$100/month')
    expect(html).toContain('Scenario table')
    expect(html).toContain('DCA vs lump sum')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('FAQPage')
  })

  it('renders Korean-native copy for the focused Korean BTC page', () => {
    const coin = getCoinBySlug('btc')
    if (!coin) throw new Error('BTC fixture missing')
    const snapshot = computeCoinSeoSnapshotFromPrices({
      coin,
      lang: 'ko',
      prices: monthlyPrices(2021, 2025, 100),
    })

    const html = renderToStaticMarkup(<CoinSeoSnapshotView snapshot={snapshot} />)

    expect(html).toContain('비트코인 적립식 투자 계산기')
    expect(html).toContain('달러 기준')
    expect(html).toContain('/ko/btc/tax')
  })
})

describe('ComparisonSeoSnapshotView', () => {
  it('renders a focused BTC vs ETH comparison SEO snapshot', () => {
    const btc = getCoinBySlug('btc')
    const eth = getCoinBySlug('eth')
    if (!btc || !eth) throw new Error('coin fixtures missing')

    const snapshot = computeComparisonSeoSnapshotFromPrices({
      leftCoin: btc,
      rightCoin: eth,
      leftPrices: monthlyPrices(2021, 2025, 100),
      rightPrices: monthlyPrices(2021, 2025, 200),
    })

    const html = renderToStaticMarkup(<ComparisonSeoSnapshotView snapshot={snapshot} />)

    expect(html).toContain('Bitcoin vs Ethereum DCA Comparison')
    expect(html).toContain('$100/month into Bitcoin vs Ethereum')
    expect(html).toContain('Side-by-side scenario table')
    expect(html).toContain('BTC calculator')
    expect(html).toContain('ETH calculator')
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
npm run test -- __tests__/components/seo-snapshot-components.test.tsx
```

Expected: FAIL with missing component modules.

- [ ] **Step 3: Create JSON-LD helper**

Create `src/components/seo/JsonLdScript.tsx`:

```tsx
interface JsonLdScriptProps {
  data: unknown
}

export default function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
```

- [ ] **Step 4: Create coin SEO component**

Create `src/components/seo/CoinSeoSnapshot.tsx`:

```tsx
import Link from 'next/link'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { formatPct, formatUsd } from '@/lib/formatters'
import type { CoinSeoSnapshot, SeoScenario } from '@/lib/dca-scenarios'

interface CoinSeoSnapshotViewProps {
  snapshot: CoinSeoSnapshot
}

function coinTitle(snapshot: Extract<CoinSeoSnapshot, { ok: true }>): string {
  if (snapshot.lang === 'ko' && snapshot.coin.slug === 'btc') {
    return '비트코인 적립식 투자 계산기'
  }
  return `${snapshot.coin.name} DCA Calculator`
}

function defaultLead(snapshot: Extract<CoinSeoSnapshot, { ok: true }>): string {
  const scenario = snapshot.defaultScenario
  if (snapshot.lang === 'ko') {
    return `월 ${formatUsd(scenario.amount)}씩 ${snapshot.coin.name}를 적립식으로 매수한 달러 기준 백테스트입니다.`
  }
  return `If you invested ${formatUsd(scenario.amount)}/month in ${snapshot.coin.name}, this is the historical DCA result using Binance daily closes.`
}

function faqItems(snapshot: Extract<CoinSeoSnapshot, { ok: true }>) {
  if (snapshot.lang === 'ko') {
    return [
      {
        question: '비트코인 적립식 투자는 어떤 방식인가요?',
        answer: '정해진 금액을 정기적으로 매수해 진입 시점 리스크를 나누는 방식입니다. 이 페이지의 기본 결과는 달러 기준 월별 매수 백테스트입니다.',
      },
      {
        question: 'DCAify의 비트코인 결과는 투자 조언인가요?',
        answer: '아닙니다. DCAify는 과거 가격 기준 계산 도구이며 금융, 투자, 세금 조언을 제공하지 않습니다.',
      },
      {
        question: '한국 세금 시나리오는 어디서 볼 수 있나요?',
        answer: '예상 세금 시나리오는 별도 세금 페이지에서 참고용으로 확인할 수 있습니다. 실제 신고 전에는 최신 공식 자료를 확인해야 합니다.',
      },
    ]
  }

  return [
    {
      question: `What does ${snapshot.coin.name} DCA mean?`,
      answer: `It means buying ${snapshot.coin.name} on a recurring schedule, such as investing $100 every month, instead of trying to pick one perfect entry price.`,
    },
    {
      question: `Is this ${snapshot.coin.name} DCA result live?`,
      answer: 'The SEO snapshot uses Binance daily close data fetched on the server. The interactive calculator below can be used to change the amount, frequency, and date range.',
    },
    {
      question: 'Is DCAify financial advice?',
      answer: 'No. DCAify is an educational calculator for historical backtests, not financial, tax, or investment advice.',
    },
  ]
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function ScenarioRow({ scenario }: { scenario: SeoScenario }) {
  return (
    <tr>
      <td className="py-2 pr-4">{scenario.label}</td>
      <td className="py-2 pr-4 tabular-nums">{formatUsd(scenario.amount)}</td>
      <td className="py-2 pr-4 tabular-nums">{formatUsd(scenario.result.totalInvested)}</td>
      <td className="py-2 pr-4 tabular-nums">{formatUsd(scenario.result.currentValue)}</td>
      <td className="py-2 tabular-nums">{formatPct(scenario.result.roi)}</td>
    </tr>
  )
}

export default function CoinSeoSnapshotView({ snapshot }: CoinSeoSnapshotViewProps) {
  if (!snapshot.ok) {
    return (
      <section className="mb-6 p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {snapshot.lang === 'ko' ? `${snapshot.coin.name} 적립식 투자 계산기` : `${snapshot.coin.name} DCA Calculator`}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {snapshot.lang === 'ko'
            ? '최근 가격 데이터를 불러오지 못했습니다. 아래 계산기에서 직접 조건을 입력해 다시 시도할 수 있습니다.'
            : 'Recent price data could not be loaded. You can still use the calculator below to run a custom backtest.'}
        </p>
      </section>
    )
  }

  const title = coinTitle(snapshot)
  const scenario = snapshot.defaultScenario
  const faqs = faqItems(snapshot)
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <section className="mb-8 space-y-6">
      <JsonLdScript data={faqJsonLd} />
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--accent)' }}>
          {snapshot.lang === 'ko' ? '달러 기준 DCA 백테스트' : 'DCA backtest from daily closes'}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          {defaultLead(snapshot)}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultCard label={snapshot.lang === 'ko' ? '총 투자금' : 'Total invested'} value={formatUsd(scenario.result.totalInvested)} />
        <ResultCard label={snapshot.lang === 'ko' ? '현재 가치' : 'Current value'} value={formatUsd(scenario.result.currentValue)} />
        <ResultCard label={snapshot.lang === 'ko' ? '수익률' : 'Return'} value={formatPct(scenario.result.roi)} />
        <ResultCard label={snapshot.lang === 'ko' ? '매수 횟수' : 'Purchases'} value={String(snapshot.risk.purchaseCount)} />
      </div>

      <div className="overflow-x-auto p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <h2 className="text-xl font-semibold mb-3">Scenario table</h2>
        <table className="w-full text-sm">
          <thead style={{ color: 'var(--text-muted)' }}>
            <tr>
              <th className="text-left py-2 pr-4">Window</th>
              <th className="text-left py-2 pr-4">Monthly</th>
              <th className="text-left py-2 pr-4">Invested</th>
              <th className="text-left py-2 pr-4">Value</th>
              <th className="text-left py-2">ROI</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.scenarioMatrix.map((item) => (
              <ScenarioRow key={`${item.label}-${item.amount}`} scenario={item} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h2 className="text-xl font-semibold mb-2">DCA vs lump sum</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            DCA value: {formatUsd(snapshot.dcaVsLumpSum.dcaValue)}. Lump-sum value: {formatUsd(snapshot.dcaVsLumpSum.lumpSumValue)}. Difference: {formatUsd(snapshot.dcaVsLumpSum.difference)}.
          </p>
        </div>
        <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h2 className="text-xl font-semibold mb-2">{snapshot.lang === 'ko' ? '리스크 지표' : 'Risk metrics'}</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Average buy price: {formatUsd(snapshot.risk.averageBuyPrice)}. Current price: {formatUsd(snapshot.risk.currentPrice)}. Asset max drawdown: {formatPct(snapshot.risk.maxDrawdownPct)}.
          </p>
        </div>
      </div>

      {snapshot.lang === 'ko' && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          세금 시나리오는 <Link href="/ko/btc/tax" style={{ color: 'var(--accent)' }}>비트코인 세금 분석</Link>에서 별도로 확인할 수 있습니다.
        </p>
      )}

      <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <h2 className="text-xl font-semibold mb-3">{snapshot.lang === 'ko' ? '자주 묻는 질문' : 'Frequently asked questions'}</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Create comparison SEO component**

Create `src/components/seo/ComparisonSeoSnapshot.tsx`:

```tsx
import Link from 'next/link'
import { formatPct, formatUsd } from '@/lib/formatters'
import type { ComparisonSeoSnapshot } from '@/lib/dca-scenarios'

interface ComparisonSeoSnapshotViewProps {
  snapshot: ComparisonSeoSnapshot
}

export default function ComparisonSeoSnapshotView({ snapshot }: ComparisonSeoSnapshotViewProps) {
  if (!snapshot.ok) {
    return (
      <section className="mb-6 p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {snapshot.leftCoin.name} vs {snapshot.rightCoin.name} DCA Comparison
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Recent comparison data could not be loaded. You can still use the calculator below to run both legs manually.
        </p>
      </section>
    )
  }

  const left = snapshot.left
  const right = snapshot.right
  const winner =
    snapshot.verdict.winner === 'tie'
      ? 'Tie'
      : snapshot.verdict.winner === 'left'
        ? left.coin.name
        : right.coin.name

  return (
    <section className="mb-8 space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--accent)' }}>
          Same plan, two assets
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Bitcoin vs Ethereum DCA Comparison
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          $100/month into Bitcoin vs Ethereum using the same historical DCA window.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Winner</p>
          <p className="text-lg font-bold">{winner}</p>
        </div>
        <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>BTC value</p>
          <p className="text-lg font-bold tabular-nums">{formatUsd(left.defaultScenario.result.currentValue)}</p>
        </div>
        <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>ETH value</p>
          <p className="text-lg font-bold tabular-nums">{formatUsd(right.defaultScenario.result.currentValue)}</p>
        </div>
      </div>

      <div className="overflow-x-auto p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <h2 className="text-xl font-semibold mb-3">Side-by-side scenario table</h2>
        <table className="w-full text-sm">
          <thead style={{ color: 'var(--text-muted)' }}>
            <tr>
              <th className="text-left py-2 pr-4">Window</th>
              <th className="text-left py-2 pr-4">Monthly</th>
              <th className="text-left py-2 pr-4">BTC ROI</th>
              <th className="text-left py-2 pr-4">ETH ROI</th>
              <th className="text-left py-2">Difference</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.scenarioRows.map((row) => (
              <tr key={`${row.label}-${row.amount}`}>
                <td className="py-2 pr-4">{row.label}</td>
                <td className="py-2 pr-4 tabular-nums">{formatUsd(row.amount)}</td>
                <td className="py-2 pr-4 tabular-nums">{formatPct(row.left.result.roi)}</td>
                <td className="py-2 pr-4 tabular-nums">{formatPct(row.right.result.roi)}</td>
                <td className="py-2 tabular-nums">{formatPct(row.left.result.roi - row.right.result.roi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <h2 className="text-xl font-semibold mb-2">When BTC wins and when ETH wins</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Bitcoin tends to be the simpler store-of-value benchmark. Ethereum adds smart-contract ecosystem exposure. This comparison keeps the DCA plan identical so the difference comes from the assets, not from different assumptions.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/btc" style={{ color: 'var(--accent)' }}>BTC calculator</Link>
        <Link href="/eth" style={{ color: 'var(--accent)' }}>ETH calculator</Link>
        <Link href="/btc/guide" style={{ color: 'var(--accent)' }}>BTC guide</Link>
        <Link href="/eth/guide" style={{ color: 'var(--accent)' }}>ETH guide</Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Run the component test**

```bash
npm run test -- __tests__/components/seo-snapshot-components.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/seo __tests__/components/seo-snapshot-components.test.tsx
git commit -m "feat(seo): add focused snapshot components"
```

## Task 5: Calculator Heading Levels

**Files:**
- Modify: `src/components/DcaCalculator.tsx`
- Modify: `src/components/ComparisonCalculator.tsx`

- [ ] **Step 1: Update `DcaCalculator` props**

In `src/components/DcaCalculator.tsx`, add `headingLevel?: 'h1' | 'h2'` to `DcaCalculatorProps` and default it to `h1`:

```ts
interface DcaCalculatorProps {
  defaultCoin?: CoinConfig
  lang?: 'en' | 'ko'
  relatedCoins?: CoinConfig[]
  analyticsContext?: string
  showTaxBanner?: boolean
  headingLevel?: 'h1' | 'h2'
}
```

Change the function signature:

```ts
export default function DcaCalculator({
  defaultCoin = SUPPORTED_COINS[0],
  lang = 'en',
  relatedCoins,
  analyticsContext = 'calculator',
  showTaxBanner = true,
  headingLevel = 'h1',
}: DcaCalculatorProps) {
```

After `const coin = defaultCoin`, add:

```ts
  const Heading = headingLevel
```

Replace the existing `<h1 ...>` opening and closing tags with:

```tsx
        <Heading className="text-2xl sm:text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          {coin.name} DCA {lang === 'ko' ? '계산기' : 'Calculator'}
        </Heading>
```

- [ ] **Step 2: Update `ComparisonCalculator` props**

In `src/components/ComparisonCalculator.tsx`, add:

```ts
interface ComparisonCalculatorProps {
  leftCoin: CoinConfig
  rightCoin: CoinConfig
  headingLevel?: 'h1' | 'h2'
}
```

Change the function signature to default `headingLevel`:

```ts
export default function ComparisonCalculator({
  leftCoin,
  rightCoin,
  headingLevel = 'h1',
}: ComparisonCalculatorProps) {
```

Near the start of the function body, add:

```ts
  const Heading = headingLevel
```

Replace the existing comparison `<h1 ...>` with:

```tsx
        <Heading className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {leftCoin.name} vs {rightCoin.name} DCA Comparison
        </Heading>
```

- [ ] **Step 3: Run component-related tests**

```bash
npm run test -- __tests__/components/review-components.test.tsx __tests__/components/seo-snapshot-components.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/DcaCalculator.tsx src/components/ComparisonCalculator.tsx
git commit -m "feat(seo): allow calculator headings below SEO sections"
```

## Task 6: Wire Focused Coin Pages

**Files:**
- Modify: `src/app/[slug]/page.tsx`
- Modify: `src/app/ko/[coin]/page.tsx`

- [ ] **Step 1: Wire English focused coin pages**

In `src/app/[slug]/page.tsx`, add imports:

```ts
import CoinSeoSnapshotView from '@/components/seo/CoinSeoSnapshot'
import ComparisonSeoSnapshotView from '@/components/seo/ComparisonSeoSnapshot'
import { buildCoinSeoSnapshot, buildComparisonSeoSnapshot } from '@/lib/dca-scenarios'
import { isFocusedTrafficCoin, isFocusedTrafficComparison, shouldIndex } from '@/lib/seo'
```

Replace the existing `shouldIndex` import with the combined import above.

Change `ComparisonPage` to be async:

```tsx
async function ComparisonPage({ slug }: { slug: string }) {
  const pair = getComparisonBySlug(slug)
  if (!pair) notFound()

  const seoSnapshot = isFocusedTrafficComparison(slug)
    ? await buildComparisonSeoSnapshot({ leftCoin: pair.coin1, rightCoin: pair.coin2 })
    : null

  return (
    <>
      <ComparisonJsonLd slug={slug} coin1={pair.coin1} coin2={pair.coin2} />
      <Nav />
      <main className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {seoSnapshot && <ComparisonSeoSnapshotView snapshot={seoSnapshot} />}
          <ComparisonCalculator
            leftCoin={pair.coin1}
            rightCoin={pair.coin2}
            headingLevel={seoSnapshot ? 'h2' : 'h1'}
          />
        </div>
      </main>
    </>
  )
}
```

Change `CoinCalculatorPage` to be async:

```tsx
async function CoinCalculatorPage({ slug }: { slug: string }) {
  const coin = getCoinBySlug(slug)
  if (!coin) notFound()

  const relatedCoins = SUPPORTED_COINS.filter((candidate) => candidate.category === coin.category && candidate.slug !== coin.slug).slice(0, 5)
  const seoSnapshot = isFocusedTrafficCoin(slug)
    ? await buildCoinSeoSnapshot({ coin, lang: 'en' })
    : null

  return (
    <>
      <CoinJsonLd coin={coin} />
      <Nav />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {seoSnapshot && <CoinSeoSnapshotView snapshot={seoSnapshot} />}
          <DcaCalculator
            defaultCoin={coin}
            relatedCoins={relatedCoins}
            headingLevel={seoSnapshot ? 'h2' : 'h1'}
          />
          <div className="mt-6 text-center space-x-4">
            <Link href={`/${coin.slug}/guide`} className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>
              Read the {coin.name} guide →
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
```

Update the comparison branch in the default export:

```tsx
    return <ComparisonPage slug={slug} />
```

No `await` is required in JSX because returning the async component is supported in a Server Component tree.

- [ ] **Step 2: Wire Korean BTC page**

In `src/app/ko/[coin]/page.tsx`, add imports:

```ts
import CoinSeoSnapshotView from '@/components/seo/CoinSeoSnapshot'
import { buildCoinSeoSnapshot } from '@/lib/dca-scenarios'
import { isFocusedTrafficKoreanCoin, shouldIndex } from '@/lib/seo'
```

Replace the existing `shouldIndex` import with the combined import above.

Inside `KoCoinPage`, after `relatedCoins`, add:

```ts
  const seoSnapshot = isFocusedTrafficKoreanCoin(slug)
    ? await buildCoinSeoSnapshot({ coin, lang: 'ko' })
    : null
```

Render it above the calculator and lower the calculator heading when present:

```tsx
        {seoSnapshot && <CoinSeoSnapshotView snapshot={seoSnapshot} />}
        <DcaCalculator
          defaultCoin={coin}
          lang="ko"
          relatedCoins={relatedCoins}
          headingLevel={seoSnapshot ? 'h2' : 'h1'}
        />
```

- [ ] **Step 3: Run TypeScript-aware tests through Vitest**

```bash
npm run test -- __tests__/components/seo-snapshot-components.test.tsx __tests__/lib/dca-scenarios.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run source-scoped lint**

```bash
./node_modules/.bin/eslint src __tests__ next.config.ts open-next.config.ts vitest.config.ts
```

Expected: no output and exit code `0`.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/[slug]/page.tsx' 'src/app/ko/[coin]/page.tsx'
git commit -m "feat(seo): render focused traffic page snapshots"
```

## Task 7: Ignore Generated OpenNext Output in ESLint

**Files:**
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Add generated output ignores**

In `eslint.config.mjs`, update `globalIgnores` to include `.open-next/**` and `.wrangler/**`:

```ts
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated deployment output:
    ".open-next/**",
    ".wrangler/**",
  ]),
```

- [ ] **Step 2: Run full lint**

```bash
npm run lint
```

Expected: no generated `.open-next` lint failures and exit code `0`. If the command exits nonzero, stop this task and resolve the reported source file errors before running this step again.

- [ ] **Step 3: Commit**

```bash
git add eslint.config.mjs
git commit -m "chore: ignore generated deployment output in lint"
```

## Task 8: Full Verification and Rendered HTML Checks

**Files:**
- No source changes unless verification exposes a defect.

- [ ] **Step 1: Run all tests**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: pass.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: Next build succeeds.

- [ ] **Step 4: Inspect source HTML through a local production server**

Run:

```bash
npm run start
```

Open a second terminal and check:

```bash
curl -s http://localhost:3000/btc | rg "Bitcoin DCA Calculator|Scenario table|DCA vs lump sum|FAQPage"
curl -s http://localhost:3000/eth | rg "Ethereum DCA Calculator|Scenario table|DCA vs lump sum"
curl -s http://localhost:3000/sol | rg "Solana DCA Calculator|Scenario table|DCA vs lump sum"
curl -s http://localhost:3000/ko/btc | rg "비트코인 적립식 투자 계산기|달러 기준|/ko/btc/tax"
curl -s http://localhost:3000/btc-vs-eth | rg "Bitcoin vs Ethereum DCA Comparison|Side-by-side scenario table|BTC calculator"
```

Expected: every command prints matching HTML lines.

- [ ] **Step 5: Stop the local server**

Stop `npm run start` with `Ctrl-C`.

- [ ] **Step 6: Confirm no uncommitted implementation changes remain**

```bash
git status --short
```

Expected: no modified or staged implementation files from Tasks 1-8. Existing unrelated untracked directories such as `.gsc-temp/` and `.wrangler/` may still appear and should remain uncommitted.

## Post-Deploy Manual Steps

After deployment:

- [ ] Request indexing in Google Search Console for:
  - `https://dcaify.com/btc`
  - `https://dcaify.com/eth`
  - `https://dcaify.com/sol`
  - `https://dcaify.com/ko/btc`
  - `https://dcaify.com/btc-vs-eth`
- [ ] Re-check each URL with `curl -s https://dcaify.com/<path>` and confirm the same HTML markers from Task 8.
- [ ] After 7-14 days, compare impressions, indexed status, and CTR for the five target URLs before expanding to additional pages.
