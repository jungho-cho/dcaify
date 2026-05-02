import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/binance-prices', () => ({
  getHistoricalPrices: vi.fn(),
}))

import {
  buildCoinSeoSnapshot,
  calculateAssetMaxDrawdownPct,
  computeCoinSeoSnapshotFromPrices,
  computeComparisonSeoSnapshotFromPrices,
} from '@/lib/dca-scenarios'
import { getCoinBySlug } from '@/lib/coins'
import { getHistoricalPrices } from '@/lib/binance-prices'
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

    expect(snapshot.asOfDate).toBe('2025-12-01')
    expect(snapshot.dataSource).toBe('fixture')
    expect(snapshot.defaultScenario.amount).toBe(100)
    expect(snapshot.defaultScenario.label).toBe('5y')
    expect(snapshot.defaultScenario.years).toBe(5)
    expect(snapshot.defaultScenario.adjustedStartDate).toBe('2021-01-01')
    expect(snapshot.defaultScenario.result.totalInvested).toBe(6000)
    expect(snapshot.defaultScenario.result.totalCoins).toBeCloseTo(60, 6)
    expect(snapshot.defaultScenario.result.currentValue).toBeCloseTo(6000, 2)
    expect(snapshot.defaultScenario.result.roi).toBeCloseTo(0, 2)
    expect(snapshot.risk.averageBuyPrice).toBeCloseTo(100, 2)
    expect(snapshot.risk.currentPrice).toBe(100)
    expect(snapshot.scenarioMatrix).toHaveLength(12)
    expect(snapshot.dcaVsLumpSum.winner).toBe('tie')
    expect(snapshot.dcaVsLumpSum.dcaValue).toBeCloseTo(6000, 2)
    expect(snapshot.dcaVsLumpSum.lumpSumValue).toBeCloseTo(6000, 2)
    expect(snapshot.dcaVsLumpSum.difference).toBeCloseTo(0, 2)
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

  it('returns an unavailable snapshot when prices cannot support plausible monthly coverage', () => {
    const coin = getCoinBySlug('btc')
    if (!coin) throw new Error('BTC fixture missing')

    const snapshot = computeCoinSeoSnapshotFromPrices({
      coin,
      lang: 'en',
      prices: [point('2025-01-01', 100)],
    })

    expect(snapshot).toEqual({
      ok: false,
      coin,
      lang: 'en',
      reason: 'price_data_unavailable',
    })
  })

  it('returns a fetch-failed snapshot when the async builder cannot fetch prices', async () => {
    const coin = getCoinBySlug('btc')
    if (!coin) throw new Error('BTC fixture missing')

    vi.mocked(getHistoricalPrices).mockRejectedValueOnce(new Error('upstream unavailable'))

    await expect(buildCoinSeoSnapshot({
      coin,
      lang: 'en',
      now: new Date('2025-12-15T00:00:00Z'),
    })).resolves.toEqual({
      ok: false,
      coin,
      lang: 'en',
      reason: 'price_fetch_failed',
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
    expect(snapshot.scenarioRows[0]).toMatchObject({
      amount: 50,
      label: '1y',
    })
  })

  it('normalizes mismatched comparison ranges to shared overlapping dates', () => {
    const btc = getCoinBySlug('btc')
    const eth = getCoinBySlug('eth')
    if (!btc || !eth) throw new Error('coin fixtures missing')

    const snapshot = computeComparisonSeoSnapshotFromPrices({
      leftCoin: btc,
      rightCoin: eth,
      leftPrices: monthlyPrices(2021, 2025, 100),
      rightPrices: monthlyPrices(2022, 2025, 200),
    })

    expect(snapshot.ok).toBe(true)
    if (!snapshot.ok) throw new Error('expected success snapshot')

    for (const row of snapshot.scenarioRows) {
      expect(row.left.startDate).toBe(row.right.startDate)
      expect(row.left.endDate).toBe(row.right.endDate)
      expect(row.left.amount).toBe(row.right.amount)
      expect(row.left.label).toBe(row.right.label)
    }

    expect(snapshot.left.asOfDate).toBe('2025-12-01')
    expect(snapshot.right.asOfDate).toBe('2025-12-01')
    expect(snapshot.left.defaultScenario.label).toBe('3y')
    expect(snapshot.right.defaultScenario.label).toBe('3y')
    expect(snapshot.left.defaultScenario.startDate).toBe(snapshot.right.defaultScenario.startDate)
    expect(snapshot.left.defaultScenario.endDate).toBe(snapshot.right.defaultScenario.endDate)
  })
})
