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
