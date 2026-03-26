import { describe, it, expect } from 'vitest'
import { calculateDca, calculateBreakEven } from '@/lib/dca'
import { PricePoint } from '@/types/prices'

// Helper: build PricePoint array from date→price map
function makePrices(entries: Record<string, number>): PricePoint[] {
  return Object.entries(entries)
    .map(([date, price]) => ({
      timestamp: new Date(date + 'T00:00:00Z').getTime(),
      price,
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
}

// Helper: daily prices for a range at a fixed price
function dailyPrices(start: string, end: string, price: number): PricePoint[] {
  const result: PricePoint[] = []
  const cur = new Date(start + 'T00:00:00Z')
  const endDate = new Date(end + 'T00:00:00Z')
  while (cur <= endDate) {
    result.push({ timestamp: cur.getTime(), price })
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return result
}

// ---------------------------------------------------------------------------
// 1. Happy path
// ---------------------------------------------------------------------------
describe('calculateDca — happy path', () => {
  it('monthly DCA: 12 purchases, correct totals', () => {
    const prices = dailyPrices('2022-01-01', '2022-12-31', 20000)
    const result = calculateDca({
      prices,
      amountPerPeriod: 100,
      frequency: 'monthly',
      startDate: '2022-01-01',
      endDate: '2022-12-01',
      currentPrice: 20000,
    })

    expect(result.purchases).toHaveLength(12)
    expect(result.totalInvested).toBeCloseTo(1200, 2)
    expect(result.totalCoins).toBeCloseTo(1200 / 20000, 6)
    expect(result.currentValue).toBeCloseTo(result.totalInvested, 2) // price unchanged → ROI 0
    expect(result.roi).toBeCloseTo(0, 2)
  })

  it('weekly DCA: ~26 purchases over 6 months', () => {
    const prices = dailyPrices('2022-01-01', '2022-06-30', 1500)
    const result = calculateDca({
      prices,
      amountPerPeriod: 50,
      frequency: 'weekly',
      startDate: '2022-01-01',
      endDate: '2022-06-30',
      currentPrice: 1500,
    })

    expect(result.purchases.length).toBeGreaterThanOrEqual(25)
    expect(result.purchases.length).toBeLessThanOrEqual(27)
    expect(result.totalInvested).toBeCloseTo(result.purchases.length * 50, 2)
  })

  it('daily DCA: 90 purchases', () => {
    const prices = dailyPrices('2022-01-01', '2022-03-31', 100)
    const result = calculateDca({
      prices,
      amountPerPeriod: 10,
      frequency: 'daily',
      startDate: '2022-01-01',
      endDate: '2022-03-31',
      currentPrice: 100,
    })

    expect(result.purchases).toHaveLength(90)
    expect(result.totalInvested).toBeCloseTo(900, 2)
  })

  it('single purchase: start = end date', () => {
    const prices = makePrices({ '2022-06-01': 30000 })
    const result = calculateDca({
      prices,
      amountPerPeriod: 1000,
      frequency: 'monthly',
      startDate: '2022-06-01',
      endDate: '2022-06-01',
      currentPrice: 30000,
    })

    expect(result.purchases).toHaveLength(1)
    expect(result.totalInvested).toBeCloseTo(1000, 2)
    expect(result.totalCoins).toBeCloseTo(1000 / 30000, 8)
  })

  it('ROI reflects price change correctly', () => {
    // Buy at 10000, current price 20000 → 100% ROI
    const prices = dailyPrices('2022-01-01', '2022-01-31', 10000)
    const result = calculateDca({
      prices,
      amountPerPeriod: 100,
      frequency: 'monthly',
      startDate: '2022-01-01',
      endDate: '2022-01-01',
      currentPrice: 20000,
    })

    expect(result.roi).toBeCloseTo(100, 1)
    expect(result.currentValue).toBeCloseTo(200, 2)
  })
})

// ---------------------------------------------------------------------------
// 2. Edge cases
// ---------------------------------------------------------------------------
describe('calculateDca — edge cases', () => {
  it('leap year: Feb 29 included correctly', () => {
    // 2024 is a leap year
    const prices = dailyPrices('2024-02-28', '2024-03-01', 50000)
    const result = calculateDca({
      prices,
      amountPerPeriod: 100,
      frequency: 'daily',
      startDate: '2024-02-28',
      endDate: '2024-03-01',
      currentPrice: 50000,
    })

    // Should have: Feb 28, Feb 29, Mar 1 = 3 purchases
    expect(result.purchases).toHaveLength(3)
    const dates = result.purchases.map((p) => p.date)
    expect(dates).toContain('2024-02-29')
  })

  it('monthly: Jan 31 → Feb 28 (not Feb 31)', () => {
    const prices = dailyPrices('2022-01-01', '2022-04-30', 40000)
    const result = calculateDca({
      prices,
      amountPerPeriod: 100,
      frequency: 'monthly',
      startDate: '2022-01-31',
      endDate: '2022-04-30',
      currentPrice: 40000,
    })

    const dates = result.purchases.map((p) => p.date)
    expect(dates).toContain('2022-01-31')
    expect(dates).toContain('2022-02-28') // Feb clamps to 28
    expect(dates).toContain('2022-03-31')
    expect(dates).toContain('2022-04-30')
  })

  it('missing price data: skips days with no data, does not crash', () => {
    // Only 3 data points in a 30-day daily range
    const prices = makePrices({
      '2022-01-01': 45000,
      '2022-01-15': 46000,
      '2022-01-30': 47000,
    })
    const result = calculateDca({
      prices,
      amountPerPeriod: 100,
      frequency: 'daily',
      startDate: '2022-01-01',
      endDate: '2022-01-30',
      currentPrice: 47000,
    })

    // All 30 days covered via nearest-neighbor fallback (7-day window)
    expect(result.purchases.length).toBeGreaterThan(0)
    expect(result.totalInvested).toBeGreaterThan(0)
  })

  it('zero price days: skips and does not divide by zero', () => {
    const prices = makePrices({
      '2022-01-01': 0,
      '2022-01-02': 100,
      '2022-01-03': 100,
    })
    const result = calculateDca({
      prices,
      amountPerPeriod: 50,
      frequency: 'daily',
      startDate: '2022-01-01',
      endDate: '2022-01-03',
      currentPrice: 100,
    })

    // Jan 1 price is 0 → skipped. Jan 2, 3 executed.
    const zeroPurchases = result.purchases.filter((p) => p.price === 0)
    expect(zeroPurchases).toHaveLength(0)
  })

  it('investment amount $0 throws error', () => {
    const prices = dailyPrices('2022-01-01', '2022-01-31', 30000)
    expect(() =>
      calculateDca({
        prices,
        amountPerPeriod: 0,
        frequency: 'monthly',
        startDate: '2022-01-01',
        endDate: '2022-01-31',
        currentPrice: 30000,
      })
    ).toThrow()
  })

  it('very large amount: no floating point overflow', () => {
    const prices = dailyPrices('2022-01-01', '2022-12-31', 20000)
    const result = calculateDca({
      prices,
      amountPerPeriod: 1_000_000,
      frequency: 'monthly',
      startDate: '2022-01-01',
      endDate: '2022-12-01',
      currentPrice: 20000,
    })

    expect(isFinite(result.totalInvested)).toBe(true)
    expect(isFinite(result.totalCoins)).toBe(true)
    expect(isFinite(result.currentValue)).toBe(true)
    expect(result.totalInvested).toBeCloseTo(12_000_000, 0)
  })

  it('empty price array throws error', () => {
    expect(() =>
      calculateDca({
        prices: [],
        amountPerPeriod: 100,
        frequency: 'monthly',
        startDate: '2022-01-01',
        endDate: '2022-12-01',
        currentPrice: 20000,
      })
    ).toThrow()
  })

  it('start date after end date returns 0 purchases', () => {
    const prices = dailyPrices('2022-01-01', '2022-12-31', 20000)
    const result = calculateDca({
      prices,
      amountPerPeriod: 100,
      frequency: 'monthly',
      startDate: '2022-12-01',
      endDate: '2022-01-01',
      currentPrice: 20000,
    })

    expect(result.purchases).toHaveLength(0)
    expect(result.totalInvested).toBe(0)
    expect(result.totalCoins).toBe(0)
    expect(result.roi).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 3. Break-even calculator
// ---------------------------------------------------------------------------
describe('calculateBreakEven', () => {
  it('basic break-even: 1000 invested, 0.05 coins → 20000', () => {
    const { breakEvenPrice } = calculateBreakEven(1000, 0.05)
    expect(breakEvenPrice).toBeCloseTo(20000, 2)
  })

  it('with Korean 22% tax: break-even higher', () => {
    const { breakEvenPrice, breakEvenWithTax } = calculateBreakEven(1000, 0.05, 0.22)
    expect(breakEvenPrice).toBeCloseTo(20000, 2)
    // net_needed = 1000 / (1 - 0.22) ≈ 1282.05 → 1282.05 / 0.05 ≈ 25641
    expect(breakEvenWithTax).toBeCloseTo(25641, 0)
  })

  it('zero coins throws error', () => {
    expect(() => calculateBreakEven(1000, 0)).toThrow()
  })

  it('no tax: breakEvenWithTax equals breakEvenPrice', () => {
    const { breakEvenPrice, breakEvenWithTax } = calculateBreakEven(500, 0.025, 0)
    expect(breakEvenPrice).toBeCloseTo(breakEvenWithTax, 6)
  })
})
