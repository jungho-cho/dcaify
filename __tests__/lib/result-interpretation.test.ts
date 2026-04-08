import { describe, expect, it } from 'vitest'
import { buildComparisonVerdict, normalizeComparisonStartDate, summarizeDcaOutcome } from '@/lib/result-interpretation'

describe('result interpretation helpers', () => {
  it('normalizes comparison start date to the latest listing date', () => {
    expect(normalizeComparisonStartDate('2020-01-01', '2019-01-01', '2021-05-01')).toEqual({
      effectiveStartDate: '2021-05-01',
      normalized: true,
    })
  })

  it('keeps requested start date when both coins already existed', () => {
    expect(normalizeComparisonStartDate('2022-01-01', '2019-01-01', '2020-03-01')).toEqual({
      effectiveStartDate: '2022-01-01',
      normalized: false,
    })
  })

  it('builds a left-wins verdict from ROI first', () => {
    const verdict = buildComparisonVerdict({
      left: { roi: 110, currentValue: 2100 },
      right: { roi: 80, currentValue: 1800 },
    })

    expect(verdict.winner).toBe('left')
    expect(verdict.primaryMetric).toBe('roi')
    expect(verdict.roiDelta).toBe(30)
  })

  it('falls back to ending value when ROI is tied', () => {
    const verdict = buildComparisonVerdict({
      left: { roi: 50, currentValue: 1550 },
      right: { roi: 50, currentValue: 1540 },
    })

    expect(verdict.winner).toBe('left')
    expect(verdict.primaryMetric).toBe('currentValue')
  })

  it('summarizes flat results cleanly', () => {
    const summary = summarizeDcaOutcome({
      totalInvested: 1000,
      totalCoins: 0.5,
      currentValue: 1000.0001,
      roi: 0.00001,
      purchases: [],
      startDate: '2022-01-01',
      endDate: '2022-12-31',
    })

    expect(summary.outcome).toBe('flat')
  })
})
