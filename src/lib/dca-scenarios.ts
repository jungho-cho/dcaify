import { getHistoricalPrices } from '@/lib/binance-prices'
import type { CoinConfig } from '@/lib/coins'
import { calculateDca, type DcaResult } from '@/lib/dca'
import { buildComparisonVerdict, type ComparisonVerdict } from '@/lib/result-interpretation'
import type { PricePoint, PricesResponse } from '@/types/prices'

export type SeoLang = 'en' | 'ko'
export type ScenarioWindowLabel = '1y' | '3y' | '5y'
export type SeoSnapshotUnavailableReason = 'price_data_unavailable' | 'price_fetch_failed'

export interface SeoScenario {
  amount: number
  label: ScenarioWindowLabel
  years: number
  startDate: string
  endDate: string
  adjustedStartDate: string
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
  asOfDate: string
  dataSource: PricesResponse['dataSource'] | 'fixture'
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

export const SEO_MONTHLY_AMOUNTS = [50, 100, 250, 500] as const
export const SEO_SCENARIO_WINDOWS = [
  { label: '1y', months: 12, years: 1, minPurchases: 11 },
  { label: '3y', months: 36, years: 3, minPurchases: 33 },
  { label: '5y', months: 60, years: 5, minPurchases: 55 },
] as const satisfies readonly { label: ScenarioWindowLabel; months: number; years: number; minPurchases: number }[]

function sortPrices(prices: PricePoint[]): PricePoint[] {
  return [...prices].sort((a, b) => a.timestamp - b.timestamp)
}

function toDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function addUtcMonths(date: Date, months: number): Date {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  target.setUTCMonth(target.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(date.getUTCDate(), lastDay))
  return target
}

function getScenarioStartDate(endTimestamp: number, windowMonths: number): string {
  return toDateString(addUtcMonths(new Date(endTimestamp), -(windowMonths - 1)).getTime())
}

function getCurrentPrice(prices: PricePoint[]): number {
  return prices[prices.length - 1].price
}

function findNearestPrice(prices: PricePoint[], targetDate: string): PricePoint {
  const targetTimestamp = new Date(`${targetDate}T00:00:00Z`).getTime()
  return prices.reduce((nearest, price) => (
    Math.abs(price.timestamp - targetTimestamp) < Math.abs(nearest.timestamp - targetTimestamp) ? price : nearest
  ))
}

function buildScenario(params: {
  prices: PricePoint[]
  amount: number
  window: (typeof SEO_SCENARIO_WINDOWS)[number]
}): SeoScenario {
  const { prices, amount, window } = params
  const endDate = toDateString(prices[prices.length - 1].timestamp)
  const startDate = getScenarioStartDate(prices[prices.length - 1].timestamp, window.months)
  const firstAvailableDate = toDateString(prices[0].timestamp)
  const adjustedStartDate = startDate > firstAvailableDate ? startDate : firstAvailableDate
  const result = calculateDca({
    prices,
    amountPerPeriod: amount,
    frequency: 'monthly',
    startDate: adjustedStartDate,
    endDate,
    currentPrice: getCurrentPrice(prices),
  })

  return {
    amount,
    label: window.label,
    years: window.years,
    startDate,
    endDate,
    adjustedStartDate,
    result,
  }
}

function buildScenarioMatrix(prices: PricePoint[]): SeoScenario[] {
  return SEO_MONTHLY_AMOUNTS.flatMap((amount) =>
    SEO_SCENARIO_WINDOWS.flatMap((window) => {
      const scenario = buildScenario({
        prices,
        amount,
        window,
      })

      return scenario.result.purchases.length > 0 ? [scenario] : []
    }),
  )
}

function buildDcaVsLumpSum(prices: PricePoint[], scenario: SeoScenario): DcaVsLumpSumSnapshot {
  const lumpSumStartPrice = findNearestPrice(prices, scenario.adjustedStartDate).price
  const lumpSumCoins = scenario.result.totalInvested / lumpSumStartPrice
  const lumpSumValue = lumpSumCoins * getCurrentPrice(prices)
  const difference = scenario.result.currentValue - lumpSumValue

  let winner: DcaVsLumpSumSnapshot['winner'] = 'tie'
  if (Math.abs(difference) >= 0.01) {
    winner = difference > 0 ? 'dca' : 'lump_sum'
  }

  return {
    lumpSumValue,
    lumpSumCoins,
    dcaValue: scenario.result.currentValue,
    difference,
    winner,
  }
}

function buildRiskMetrics(prices: PricePoint[], scenario: SeoScenario): SeoRiskMetrics {
  return {
    averageBuyPrice: scenario.result.totalCoins === 0 ? 0 : scenario.result.totalInvested / scenario.result.totalCoins,
    currentPrice: getCurrentPrice(prices),
    purchaseCount: scenario.result.purchases.length,
    maxDrawdownPct: calculateAssetMaxDrawdownPct(prices),
  }
}

function getDefaultScenario(scenarios: SeoScenario[]): SeoScenario | undefined {
  const defaultAmountScenarios = [...scenarios]
    .filter((scenario) => scenario.amount === 100)
    .sort((a, b) => b.years - a.years)

  return defaultAmountScenarios.find((scenario) => {
    const window = SEO_SCENARIO_WINDOWS.find((candidate) => candidate.label === scenario.label)
    return window ? scenario.result.purchases.length >= window.minPurchases : false
  }) ?? scenarios[0]
}

function hasAdequateCoverage(scenario: SeoScenario): boolean {
  const window = SEO_SCENARIO_WINDOWS.find((candidate) => candidate.label === scenario.label)
  return Boolean(window && scenario.result.purchases.length >= window.minPurchases)
}

function scenarioKey(scenario: Pick<SeoScenario, 'amount' | 'label'>): string {
  return `${scenario.amount}:${scenario.label}`
}

function unavailableComparisonSnapshot(
  leftCoin: CoinConfig,
  rightCoin: CoinConfig,
): ComparisonSeoUnavailableSnapshot {
  return {
    ok: false,
    leftCoin,
    rightCoin,
    reason: 'price_data_unavailable',
  }
}

function getFiveYearFromDate(now: Date): string {
  return toDateString(addUtcMonths(now, -59).getTime())
}

function getTodayDate(now: Date): string {
  return toDateString(now.getTime())
}

export function calculateAssetMaxDrawdownPct(prices: PricePoint[]): number {
  if (prices.length === 0) return 0

  let peak = sortPrices(prices)[0].price
  let maxDrawdown = 0

  for (const { price } of sortPrices(prices)) {
    if (price > peak) {
      peak = price
      continue
    }

    if (peak <= 0) continue

    const drawdown = ((price - peak) / peak) * 100
    maxDrawdown = Math.min(maxDrawdown, drawdown)
  }

  return maxDrawdown
}

export function computeCoinSeoSnapshotFromPrices({
  coin,
  lang,
  prices,
  dataSource,
}: {
  coin: CoinConfig
  lang: SeoLang
  prices: PricePoint[]
  dataSource?: PricesResponse['dataSource'] | 'fixture'
}): CoinSeoSnapshot {
  if (prices.length === 0) {
    return {
      ok: false,
      coin,
      lang,
      reason: 'price_data_unavailable',
    }
  }

  const sortedPrices = sortPrices(prices)
  const scenarioMatrix = buildScenarioMatrix(sortedPrices)
  const defaultScenario = getDefaultScenario(scenarioMatrix)

  if (!defaultScenario || !hasAdequateCoverage(defaultScenario)) {
    return {
      ok: false,
      coin,
      lang,
      reason: 'price_data_unavailable',
    }
  }

  return {
    ok: true,
    coin,
    lang,
    asOfDate: toDateString(sortedPrices[sortedPrices.length - 1].timestamp),
    dataSource: dataSource ?? 'fixture',
    defaultScenario,
    scenarioMatrix,
    dcaVsLumpSum: buildDcaVsLumpSum(sortedPrices, defaultScenario),
    risk: buildRiskMetrics(sortedPrices, defaultScenario),
  }
}

function getOverlappingPrices(leftPrices: PricePoint[], rightPrices: PricePoint[]): {
  left: PricePoint[]
  right: PricePoint[]
} | null {
  if (leftPrices.length === 0 || rightPrices.length === 0) return null

  const sortedLeft = sortPrices(leftPrices)
  const sortedRight = sortPrices(rightPrices)
  const sharedStart = Math.max(sortedLeft[0].timestamp, sortedRight[0].timestamp)
  const sharedEnd = Math.min(
    sortedLeft[sortedLeft.length - 1].timestamp,
    sortedRight[sortedRight.length - 1].timestamp,
  )

  if (sharedStart > sharedEnd) return null

  return {
    left: sortedLeft.filter((price) => price.timestamp >= sharedStart && price.timestamp <= sharedEnd),
    right: sortedRight.filter((price) => price.timestamp >= sharedStart && price.timestamp <= sharedEnd),
  }
}

export async function buildCoinSeoSnapshot({
  coin,
  lang,
  now = new Date(),
}: {
  coin: CoinConfig
  lang: SeoLang
  now?: Date
}): Promise<CoinSeoSnapshot> {
  try {
    const from = coin.listingDate > getFiveYearFromDate(now) ? coin.listingDate : getFiveYearFromDate(now)
    const response = await getHistoricalPrices({
      binanceSymbol: coin.binanceSymbol,
      from,
      to: getTodayDate(now),
      now,
    })

    return computeCoinSeoSnapshotFromPrices({
      coin,
      lang,
      prices: response.prices,
      dataSource: response.dataSource,
    })
  } catch {
    return {
      ok: false,
      coin,
      lang,
      reason: 'price_fetch_failed',
    }
  }
}

export function computeComparisonSeoSnapshotFromPrices({
  leftCoin,
  rightCoin,
  leftPrices,
  rightPrices,
}: {
  leftCoin: CoinConfig
  rightCoin: CoinConfig
  leftPrices: PricePoint[]
  rightPrices: PricePoint[]
}): ComparisonSeoSnapshot {
  const overlappingPrices = getOverlappingPrices(leftPrices, rightPrices)
  if (!overlappingPrices) {
    return unavailableComparisonSnapshot(leftCoin, rightCoin)
  }

  const left = computeCoinSeoSnapshotFromPrices({
    coin: leftCoin,
    lang: 'en',
    prices: overlappingPrices.left,
  })
  const right = computeCoinSeoSnapshotFromPrices({
    coin: rightCoin,
    lang: 'en',
    prices: overlappingPrices.right,
  })

  if (!left.ok || !right.ok) {
    return unavailableComparisonSnapshot(leftCoin, rightCoin)
  }

  const expectedScenarioRowCount = SEO_MONTHLY_AMOUNTS.length * SEO_SCENARIO_WINDOWS.length
  const rightScenarios = new Map(right.scenarioMatrix.map((scenario) => [scenarioKey(scenario), scenario]))
  const scenarioRows = left.scenarioMatrix.flatMap((leftScenario) => {
    const rightScenario = rightScenarios.get(scenarioKey(leftScenario))
    if (
      !rightScenario ||
      leftScenario.startDate !== rightScenario.startDate ||
      leftScenario.endDate !== rightScenario.endDate ||
      leftScenario.adjustedStartDate !== rightScenario.adjustedStartDate
    ) {
      return []
    }

    return {
      amount: leftScenario.amount,
      label: leftScenario.label,
      left: leftScenario,
      right: rightScenario,
    }
  })

  const hasMismatchedScenarioRow = scenarioRows.some((row) =>
    row.left.startDate !== row.right.startDate ||
    row.left.endDate !== row.right.endDate ||
    row.left.adjustedStartDate !== row.right.adjustedStartDate ||
    row.amount !== row.left.amount ||
    row.amount !== row.right.amount ||
    row.label !== row.left.label ||
    row.label !== row.right.label,
  )

  if (scenarioRows.length !== expectedScenarioRowCount || hasMismatchedScenarioRow) {
    return unavailableComparisonSnapshot(leftCoin, rightCoin)
  }

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

export async function buildComparisonSeoSnapshot({
  leftCoin,
  rightCoin,
  now = new Date(),
}: {
  leftCoin: CoinConfig
  rightCoin: CoinConfig
  now?: Date
}): Promise<ComparisonSeoSnapshot> {
  try {
    const from = [leftCoin.listingDate, rightCoin.listingDate, getFiveYearFromDate(now)].reduce((latest, date) =>
      date > latest ? date : latest,
    )
    const to = getTodayDate(now)
    const [leftResponse, rightResponse] = await Promise.all([
      getHistoricalPrices({
        binanceSymbol: leftCoin.binanceSymbol,
        from,
        to,
        now,
      }),
      getHistoricalPrices({
        binanceSymbol: rightCoin.binanceSymbol,
        from,
        to,
        now,
      }),
    ])

    const snapshot = computeComparisonSeoSnapshotFromPrices({
      leftCoin,
      rightCoin,
      leftPrices: leftResponse.prices,
      rightPrices: rightResponse.prices,
    })

    if (!snapshot.ok) return snapshot

    return {
      ...snapshot,
      left: {
        ...snapshot.left,
        dataSource: leftResponse.dataSource,
      },
      right: {
        ...snapshot.right,
        dataSource: rightResponse.dataSource,
      },
    }
  } catch {
    return {
      ok: false,
      leftCoin,
      rightCoin,
      reason: 'price_fetch_failed',
    }
  }
}
