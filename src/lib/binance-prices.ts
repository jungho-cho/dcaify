import { LRUCache } from 'lru-cache'
import type { PricePoint, PricesResponse } from '@/types/prices'

type HistoricalPricesResponse = Omit<PricesResponse, 'coinId'>

interface GetHistoricalPricesParams {
  binanceSymbol: string
  from: string
  to: string
  now?: Date
}

const lruCache = new LRUCache<string, PricePoint[]>({
  maxSize: 50 * 1024 * 1024,
  sizeCalculation: (value) => JSON.stringify(value).length,
  ttl: 1000 * 60 * 60,
})

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

function logApiEvent(event: string, detail: Record<string, unknown>): void {
  console.error(JSON.stringify({ scope: 'prices_api', event, ...detail }))
}

async function fetchYearFromBinance(binanceSymbol: string, year: number, now: Date): Promise<PricePoint[]> {
  const startTime = new Date(`${year}-01-01T00:00:00Z`).getTime()
  const endTime = year === currentYear(now) ? now.getTime() : new Date(`${year}-12-31T23:59:59Z`).getTime()

  const baseUrls = [
    'https://data-api.binance.vision',
    'https://api.binance.com',
    'https://api1.binance.com',
    'https://api2.binance.com',
    'https://api3.binance.com',
  ]

  const path = `/api/v3/klines?symbol=${binanceSymbol}&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=1000`

  let response: Response | null = null
  for (const baseUrl of baseUrls) {
    try {
      response = await fetch(baseUrl + path, { next: { revalidate: 0 } })
      if (response.ok) break
    } catch (error) {
      logApiEvent('upstream_fetch_failed', { baseUrl, binanceSymbol, year, error: error instanceof Error ? error.message : 'unknown_error' })
      continue
    }
  }

  if (!response || !response.ok) {
    throw createUpstreamError(`Binance upstream unavailable for ${binanceSymbol}/${year}`, response?.status ?? 0)
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

  const lruHit = lruCache.get(key)
  if (lruHit) return { prices: lruHit, source: 'cache' }

  const prices = await fetchYearFromBinance(binanceSymbol, year, now)
  lruCache.set(key, prices)
  return { prices, source: 'live' }
}

export async function getHistoricalPrices({
  binanceSymbol,
  from,
  to,
  now = new Date(),
}: GetHistoricalPricesParams): Promise<HistoricalPricesResponse> {
  const fromDate = new Date(`${from}T00:00:00Z`)
  const toDate = new Date(`${to}T00:00:00Z`)
  const fromYear = fromDate.getUTCFullYear()
  const toYear = Math.min(toDate.getUTCFullYear(), currentYear(now))
  const allPrices: PricePoint[] = []
  let overallSource: PricesResponse['dataSource'] = 'cache'

  for (let year = fromYear; year <= toYear; year += 1) {
    const { prices, source } = await getPricesForYear(binanceSymbol, year, now)
    allPrices.push(...prices)
    if (source === 'live') overallSource = 'live'
    if (source === 'stale') overallSource = 'stale'
  }

  const fromTimestamp = fromDate.getTime()
  const toTimestamp = toDate.getTime()
  const filtered = allPrices.filter((point) => point.timestamp >= fromTimestamp && point.timestamp <= toTimestamp)

  return {
    prices: filtered,
    dataSource: overallSource,
    fromTimestamp,
    toTimestamp,
  }
}

export function clearHistoricalPriceCacheForTests(): void {
  lruCache.clear()
}
