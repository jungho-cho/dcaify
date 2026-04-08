import type { DcaResult } from '@/lib/dca'

export interface DcaOutcomeSummary {
  outcome: 'profit' | 'loss' | 'flat'
  absoluteChange: number
  multiple: number
}

export interface ComparisonVerdict {
  winner: 'left' | 'right' | 'tie'
  roiDelta: number
  currentValueDelta: number
  primaryMetric: 'roi' | 'currentValue'
}

export function summarizeDcaOutcome(result: DcaResult): DcaOutcomeSummary {
  const absoluteChange = result.currentValue - result.totalInvested
  const multiple = result.totalInvested > 0 ? result.currentValue / result.totalInvested : 0

  if (Math.abs(result.roi) < 0.01) {
    return { outcome: 'flat', absoluteChange, multiple }
  }

  return {
    outcome: result.roi > 0 ? 'profit' : 'loss',
    absoluteChange,
    multiple,
  }
}

export function isSameCoinComparison(leftSlug: string, rightSlug: string): boolean {
  return leftSlug.trim().toLowerCase() === rightSlug.trim().toLowerCase()
}

export function normalizeComparisonStartDate(
  requestedStartDate: string,
  ...listingDates: string[]
): { effectiveStartDate: string; normalized: boolean } {
  const effectiveStartDate = listingDates.reduce(
    (latest, listingDate) => (listingDate > latest ? listingDate : latest),
    requestedStartDate,
  )

  return {
    effectiveStartDate,
    normalized: effectiveStartDate !== requestedStartDate,
  }
}

export function buildComparisonVerdict(params: {
  left: Pick<DcaResult, 'roi' | 'currentValue'>
  right: Pick<DcaResult, 'roi' | 'currentValue'>
}): ComparisonVerdict {
  const roiDelta = params.left.roi - params.right.roi
  const currentValueDelta = params.left.currentValue - params.right.currentValue

  if (Math.abs(roiDelta) < 0.01 && Math.abs(currentValueDelta) < 0.01) {
    return { winner: 'tie', roiDelta, currentValueDelta, primaryMetric: 'roi' }
  }

  if (Math.abs(roiDelta) >= 0.01) {
    return {
      winner: roiDelta > 0 ? 'left' : 'right',
      roiDelta,
      currentValueDelta,
      primaryMetric: 'roi',
    }
  }

  return {
    winner: currentValueDelta > 0 ? 'left' : 'right',
    roiDelta,
    currentValueDelta,
    primaryMetric: 'currentValue',
  }
}
