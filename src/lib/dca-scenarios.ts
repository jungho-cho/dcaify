import { getHistoricalPrices } from '@/lib/binance-prices'
import type { CoinConfig } from '@/lib/coins'
import { calculateDca, type DcaResult } from '@/lib/dca'
import { buildComparisonVerdict, type ComparisonVerdict } from '@/lib/result-interpretation'
import type { PricePoint, PricesResponse } from '@/types/prices'

export type SeoLang = 'en' | 'ko'
export type ScenarioWindowLabel = '1y' | '3y' | '5y'
export type SeoSnapshotUnavailableReason = 'price_data_unavailable' | 'price_fetch_failed'

export interface SeoScenario {
  amountPerMonth: number
  window: ScenarioWindowLabel
  startDate: string
  endDate: string
  result: DcaResult
}

export interface DcaVsLumpSumSnapshot {
  winner: 'dca' | 'lump_sum' | 'tie'
  dcaCurrentValue: number
  lumpSumCurrentValue: number
  currentValueDelta: number
  lumpSumCoins: number
  lumpSumStartPrice: number
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
  dataSource?: PricesResponse['dataSource']
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
  amountPerMonth: number
  window: ScenarioWindowLabel
  left: SeoScenario
  right: SeoScenario
  verdict: ComparisonVerdict
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
  { label: '1y', months: 12 },
  { label: '3y', months: 36 },
  { label: '5y', months: 60 },
] as const satisfies readonly { label: ScenarioWindowLabel; months: number }[]

function sortPrices(prices: PricePoint[]): PricePoint[] {
  return [...prices].sort((a, b) => a.timestamp - b.timestamp)
}

function toDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function addUtcMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()))
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
  amountPerMonth: number
  window: ScenarioWindowLabel
  windowMonths: number
}): SeoScenario {
  const { prices, amountPerMonth, window, windowMonths } = params
  const endDate = toDateString(prices[prices.length - 1].timestamp)
  const startDate = getScenarioStartDate(prices[prices.length - 1].timestamp, windowMonths)
  const result = calculateDca({
    prices,
    amountPerPeriod: amountPerMonth,
    frequency: 'monthly',
    startDate,
    endDate,
    currentPrice: getCurrentPrice(prices),
  })

  return {
    amountPerMonth,
    window,
    startDate,
    endDate,
    result,
  }
}

function buildScenarioMatrix(prices: PricePoint[]): SeoScenario[] {
  return SEO_MONTHLY_AMOUNTS.flatMap((amountPerMonth) =>
    SEO_SCENARIO_WINDOWS.map((window) =>
      buildScenario({
        prices,
        amountPerMonth,
        window: window.label,
        windowMonths: window.months,
      }),
    ),
  )
}

function buildDcaVsLumpSum(prices: PricePoint[], scenario: SeoScenario): DcaVsLumpSumSnapshot {
  const lumpSumStartPrice = findNearestPrice(prices, scenario.startDate).price
  const lumpSumCoins = scenario.result.totalInvested / lumpSumStartPrice
  const lumpSumCurrentValue = lumpSumCoins * getCurrentPrice(prices)
  const currentValueDelta = scenario.result.currentValue - lumpSumCurrentValue

  let winner: DcaVsLumpSumSnapshot['winner'] = 'tie'
  if (Math.abs(currentValueDelta) >= 0.01) {
    winner = currentValueDelta > 0 ? 'dca' : 'lump_sum'
  }

  return {
    winner,
    dcaCurrentValue: scenario.result.currentValue,
    lumpSumCurrentValue,
    currentValueDelta,
    lumpSumCoins,
    lumpSumStartPrice,
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

function getDefaultScenario(scenarios: SeoScenario[]): SeoScenario {
  return scenarios.find((scenario) => scenario.amountPerMonth === 100 && scenario.window === '5y') ?? scenarios[0]
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
  dataSource?: PricesResponse['dataSource']
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

  return {
    ok: true,
    coin,
    lang,
    dataSource,
    defaultScenario,
    scenarioMatrix,
    dcaVsLumpSum: buildDcaVsLumpSum(sortedPrices, defaultScenario),
    risk: buildRiskMetrics(sortedPrices, defaultScenario),
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
  const left = computeCoinSeoSnapshotFromPrices({
    coin: leftCoin,
    lang: 'en',
    prices: leftPrices,
  })
  const right = computeCoinSeoSnapshotFromPrices({
    coin: rightCoin,
    lang: 'en',
    prices: rightPrices,
  })

  if (!left.ok || !right.ok) {
    return {
      ok: false,
      leftCoin,
      rightCoin,
      reason: 'price_data_unavailable',
    }
  }

  const scenarioRows = left.scenarioMatrix.map((leftScenario, index) => {
    const rightScenario = right.scenarioMatrix[index]
    return {
      amountPerMonth: leftScenario.amountPerMonth,
      window: leftScenario.window,
      left: leftScenario,
      right: rightScenario,
      verdict: buildComparisonVerdict({
        left: leftScenario.result,
        right: rightScenario.result,
      }),
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
