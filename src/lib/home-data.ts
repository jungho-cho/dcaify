import { getHistoricalPrices } from '@/lib/binance-prices'
import { SUPPORTED_COINS, type CoinConfig } from '@/lib/coins'
import { calculateBreakEven, calculateDca, type DcaResult, type Frequency } from '@/lib/dca'
import type { PricePoint } from '@/types/prices'

export interface HeroChartPoint {
  date: string
  value: number
  invested: number
}

export interface CoinTableRow {
  symbol: string
  name: string
  slug: string
  category: string
  listingDate: string
  oneY: number | null
  threeY: number | null
  fiveY: number | null
  sparkValues: number[]
  available: boolean
}

export interface HomeBtcResult {
  coin: CoinConfig
  amount: number
  frequency: Frequency
  startDate: string
  endDate: string
  effectiveStartDate: string
  result: DcaResult
  currentPrice: number
  breakEvenPrice: number
  series: HeroChartPoint[]
  cagrPct: number | null
  yearsCovered: number
}

export interface HomeData {
  btc: HomeBtcResult | null
  rows: CoinTableRow[]
  failure?: string
}

export interface HomeQuery {
  amount?: string | null
  frequency?: string | null
  from?: string | null
  to?: string | null
  coin?: string | null
}

const DEFAULT_AMOUNT = 100
const DEFAULT_FREQUENCY: Frequency = 'monthly'
const DEFAULT_FROM = '2020-01-01'
const SPARK_POINTS = 14

function downsample(values: number[], n: number): number[] {
  if (!values.length) return []
  if (values.length <= n) return values.slice()
  const step = (values.length - 1) / (n - 1)
  const out: number[] = []
  for (let i = 0; i < n; i += 1) out.push(values[Math.round(i * step)])
  return out
}

function buildSeries(result: DcaResult, currentPrice: number): HeroChartPoint[] {
  let cumCoins = 0
  let cumInvested = 0
  return result.purchases.map((p) => {
    cumCoins += p.coins
    cumInvested += p.amount
    return {
      date: p.date,
      value: Number((cumCoins * currentPrice).toFixed(2)),
      invested: Number(cumInvested.toFixed(2)),
    }
  })
}

function clampDate(date: string, lowerBound: string): string {
  return date < lowerBound ? lowerBound : date
}

function yearsBetween(from: string, to: string): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / (365.25 * 24 * 3600 * 1000)
}

function dateNYearsAgo(referenceIso: string, years: number): string {
  const ref = new Date(referenceIso)
  ref.setUTCFullYear(ref.getUTCFullYear() - years)
  return ref.toISOString().slice(0, 10)
}

function parseAmount(input: string | null | undefined): number {
  if (!input) return DEFAULT_AMOUNT
  const parsed = parseFloat(input)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_AMOUNT
  return parsed
}

function parseFrequency(input: string | null | undefined): Frequency {
  if (input === 'daily' || input === 'weekly' || input === 'monthly') return input
  return DEFAULT_FREQUENCY
}

function parseDate(input: string | null | undefined, fallback: string): string {
  if (!input) return fallback
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return fallback
  return input
}

function calcRoi(prices: PricePoint[], startDate: string, endDate: string, amount: number, currentPrice: number, freq: Frequency): number | null {
  try {
    const result = calculateDca({ prices, amountPerPeriod: amount, frequency: freq, startDate, endDate, currentPrice })
    if (result.totalInvested <= 0) return null
    return result.roi
  } catch {
    return null
  }
}

async function buildBtc(query: HomeQuery, today: string): Promise<HomeBtcResult | null> {
  const requestedSlug = query.coin ?? 'btc'
  const coin = SUPPORTED_COINS.find((c) => c.slug === requestedSlug) ?? SUPPORTED_COINS[0]
  const amount = parseAmount(query.amount)
  const frequency = parseFrequency(query.frequency)
  const requestedStart = parseDate(query.from, DEFAULT_FROM)
  const endDate = parseDate(query.to, today)
  const effectiveStart = clampDate(requestedStart, coin.listingDate)

  try {
    const { prices } = await getHistoricalPrices({
      binanceSymbol: coin.binanceSymbol,
      from: effectiveStart,
      to: endDate,
    })
    if (!prices.length) return null
    const currentPrice = prices[prices.length - 1].price
    const result = calculateDca({
      prices,
      amountPerPeriod: amount,
      frequency,
      startDate: effectiveStart,
      endDate,
      currentPrice,
    })
    if (result.totalInvested <= 0) return null

    const breakEven = calculateBreakEven(result.totalInvested, result.totalCoins, 0)
    const series = buildSeries(result, currentPrice)
    const years = yearsBetween(effectiveStart, endDate)
    const cagrPct = years > 0 && result.totalInvested > 0
      ? (((result.currentValue / result.totalInvested) ** (1 / years)) - 1) * 100
      : null

    return {
      coin,
      amount,
      frequency,
      startDate: requestedStart,
      endDate,
      effectiveStartDate: effectiveStart,
      result,
      currentPrice,
      breakEvenPrice: breakEven.breakEvenPrice,
      series,
      cagrPct,
      yearsCovered: years,
    }
  } catch {
    return null
  }
}

async function buildCoinRow(coin: CoinConfig, today: string): Promise<CoinTableRow> {
  const fiveYearStart = clampDate(dateNYearsAgo(today, 5), coin.listingDate)
  const threeYearStart = clampDate(dateNYearsAgo(today, 3), coin.listingDate)
  const oneYearStart = clampDate(dateNYearsAgo(today, 1), coin.listingDate)

  try {
    const { prices } = await getHistoricalPrices({
      binanceSymbol: coin.binanceSymbol,
      from: fiveYearStart,
      to: today,
    })
    if (!prices.length) {
      return {
        symbol: coin.symbol, name: coin.name, slug: coin.slug, category: coin.category, listingDate: coin.listingDate,
        oneY: null, threeY: null, fiveY: null, sparkValues: [], available: false,
      }
    }
    const currentPrice = prices[prices.length - 1].price
    const oneY = calcRoi(prices, oneYearStart, today, 100, currentPrice, 'monthly')
    const threeY = calcRoi(prices, threeYearStart, today, 100, currentPrice, 'monthly')
    const fiveY = calcRoi(prices, fiveYearStart, today, 100, currentPrice, 'monthly')
    const sparkValues = downsample(prices.map((p) => p.price), SPARK_POINTS)

    return {
      symbol: coin.symbol, name: coin.name, slug: coin.slug, category: coin.category, listingDate: coin.listingDate,
      oneY, threeY, fiveY, sparkValues, available: true,
    }
  } catch {
    return {
      symbol: coin.symbol, name: coin.name, slug: coin.slug, category: coin.category, listingDate: coin.listingDate,
      oneY: null, threeY: null, fiveY: null, sparkValues: [], available: false,
    }
  }
}

export async function getHomeData(query: HomeQuery = {}): Promise<HomeData> {
  const today = new Date().toISOString().slice(0, 10)
  const [btc, rowResults] = await Promise.all([
    buildBtc(query, today),
    Promise.all(SUPPORTED_COINS.map((coin) => buildCoinRow(coin, today))),
  ])
  const rows = rowResults.filter((row) => row.available)
  return { btc, rows }
}
