import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'
import { SUPPORTED_COINS } from '@/lib/coins'
import type { PriceApiErrorCode, PriceApiErrorResponse, PricePoint, PricesResponse } from '@/types/prices'

const lruCache = new LRUCache<string, PricePoint[]>({
  maxSize: 50 * 1024 * 1024,
  sizeCalculation: (value) => JSON.stringify(value).length,
  ttl: 1000 * 60 * 60,
})

const rateLimitCache = new LRUCache<string, { count: number; resetAt: number }>({
  max: 10_000,
  ttl: 60_000,
})

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitCache.get(ip)

  if (!entry || entry.resetAt < now) {
    rateLimitCache.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (entry.count >= 20) return false
  entry.count += 1
  return true
}

function currentYear(): number {
  return new Date().getFullYear()
}

function kvTtl(year: number): number {
  return year < currentYear() ? 60 * 60 * 24 * 30 : 60 * 60 * 2
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

async function fetchYearFromBinance(binanceSymbol: string, year: number): Promise<PricePoint[]> {
  const startTime = new Date(`${year}-01-01T00:00:00Z`).getTime()
  const endTime = year === currentYear() ? Date.now() : new Date(`${year}-12-31T23:59:59Z`).getTime()

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

async function kvGet(key: string): Promise<PricePoint[] | null> {
  try {
    const { kv } = await import('@vercel/kv')
    const data = await kv.get<PricePoint[]>(key)
    return data ?? null
  } catch {
    return null
  }
}

async function kvSet(key: string, value: PricePoint[], ttl: number): Promise<void> {
  try {
    const { kv } = await import('@vercel/kv')
    await kv.set(key, value, { ex: ttl })
  } catch {
    // optional cache layer, ignore when unavailable
  }
}

async function getPricesForYear(binanceSymbol: string, year: number): Promise<{ prices: PricePoint[]; source: 'live' | 'cache' | 'stale' }> {
  const key = cacheKey(binanceSymbol, year)

  const lruHit = lruCache.get(key)
  if (lruHit) return { prices: lruHit, source: 'cache' }

  const kvHit = await kvGet(key)
  if (kvHit) {
    lruCache.set(key, kvHit)
    return { prices: kvHit, source: 'cache' }
  }

  const prices = await fetchYearFromBinance(binanceSymbol, year)
  lruCache.set(key, prices)
  await kvSet(key, prices, kvTtl(year))
  return { prices, source: 'live' }
}

function errorResponse(status: number, code: PriceApiErrorCode, error: string) {
  return NextResponse.json<PriceApiErrorResponse>({ error, code }, { status })
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'

  if (!checkRateLimit(ip)) {
    logApiEvent('rate_limited', { ip })
    return errorResponse(429, 'rate_limited', 'Too many requests. Please try again later.')
  }

  const { searchParams } = new URL(request.url)
  const coinSlug = searchParams.get('coinId')
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  if (!coinSlug || !fromParam || !toParam) {
    return errorResponse(400, 'missing_params', 'Missing required parameters: coinId, from, to')
  }

  const coin = SUPPORTED_COINS.find((candidate) => candidate.slug === coinSlug || candidate.id === coinSlug)
  if (!coin) {
    return errorResponse(400, 'unsupported_coin', 'Unsupported coin')
  }

  const fromDate = new Date(`${fromParam}T00:00:00Z`)
  const toDate = new Date(`${toParam}T00:00:00Z`)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return errorResponse(400, 'invalid_date', 'Invalid date format')
  }

  if (fromDate > toDate) {
    return errorResponse(400, 'invalid_range', 'from date must be before to date')
  }

  const fromYear = fromDate.getUTCFullYear()
  const toYear = Math.min(toDate.getUTCFullYear(), currentYear())
  if (toYear - fromYear > 10) {
    return errorResponse(400, 'max_range', 'Maximum date range is 10 years')
  }

  if (fromDate.getTime() < new Date(`${coin.listingDate}T00:00:00Z`).getTime()) {
    return errorResponse(400, 'before_listing', `Data available from ${coin.listingDate}`)
  }

  try {
    const allPrices: PricePoint[] = []
    let overallSource: 'live' | 'cache' | 'stale' = 'cache'

    for (let year = fromYear; year <= toYear; year += 1) {
      const { prices, source } = await getPricesForYear(coin.binanceSymbol, year)
      allPrices.push(...prices)
      if (source === 'live') overallSource = 'live'
      if (source === 'stale') overallSource = 'stale'
    }

    const fromTimestamp = fromDate.getTime()
    const toTimestamp = toDate.getTime()
    const filtered = allPrices.filter((point) => point.timestamp >= fromTimestamp && point.timestamp <= toTimestamp)

    const response: PricesResponse = {
      coinId: coin.id,
      prices: filtered,
      dataSource: overallSource,
      fromTimestamp,
      toTimestamp,
    }

    return NextResponse.json(response)
  } catch (error) {
    logApiEvent('upstream_unavailable', {
      coin: coin.slug,
      from: fromParam,
      to: toParam,
      error: error instanceof Error ? error.message : 'unknown_error',
    })
    return errorResponse(500, 'upstream_unavailable', 'Failed to fetch price data. Please try again later.')
  }
}
