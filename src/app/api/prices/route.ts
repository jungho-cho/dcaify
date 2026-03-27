import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'
import { PricePoint, PricesResponse } from '@/types/prices'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'

// ---------------------------------------------------------------------------
// L1: In-memory LRU cache (per server process, lost on cold start)
// ---------------------------------------------------------------------------
const lruCache = new LRUCache<string, PricePoint[]>({
  maxSize: 50 * 1024 * 1024, // 50MB
  sizeCalculation: (value) => JSON.stringify(value).length,
  ttl: 1000 * 60 * 60, // 1h default TTL
})

// ---------------------------------------------------------------------------
// Rate limiting: 20 requests/minute per IP (LRU to prevent memory leak)
// ---------------------------------------------------------------------------
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
  entry.count++
  return true
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function currentYear(): number {
  return new Date().getFullYear()
}

function kvTtl(year: number): number {
  return year < currentYear() ? 60 * 60 * 24 * 30 : 60 * 60 * 2
}

function cacheKey(binanceSymbol: string, year: number): string {
  return `bn:${binanceSymbol}:${year}`
}

// ---------------------------------------------------------------------------
// Binance klines fetch — daily candles, up to 1000 per request (~2.7 years)
// Binance format: [openTime, open, high, low, close, volume, closeTime, ...]
// We use closeTime as timestamp and close as price.
// ---------------------------------------------------------------------------
async function fetchYearFromBinance(
  binanceSymbol: string,
  year: number
): Promise<PricePoint[]> {
  const startTime = new Date(`${year}-01-01T00:00:00Z`).getTime()
  const isCurrentYear = year === currentYear()
  const endTime = isCurrentYear
    ? Date.now()
    : new Date(`${year}-12-31T23:59:59Z`).getTime()

  // Binance daily klines, limit 1000 (365 days fits comfortably)
  const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=1000`

  const res = await fetch(url, { next: { revalidate: 0 } })

  if (!res.ok) {
    const err = new Error(`Binance ${res.status}`)
    ;(err as any).status = res.status
    throw err
  }

  const data: [number, string, string, string, string, ...unknown[]][] = await res.json()

  return data.map(([openTime, , , , close]) => ({
    timestamp: openTime,
    price: parseFloat(close),
  }))
}

// ---------------------------------------------------------------------------
// KV helpers (gracefully degrade if KV not configured)
// ---------------------------------------------------------------------------
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
    // KV not configured — silently skip
  }
}

// ---------------------------------------------------------------------------
// Core: get prices for one year (LRU → KV → Binance)
// ---------------------------------------------------------------------------
async function getPricesForYear(
  binanceSymbol: string,
  year: number
): Promise<{ prices: PricePoint[]; source: 'live' | 'cache' | 'stale' }> {
  const key = cacheKey(binanceSymbol, year)

  // L1: LRU
  const lruHit = lruCache.get(key)
  if (lruHit) return { prices: lruHit, source: 'cache' }

  // L2: KV
  const kvHit = await kvGet(key)
  if (kvHit) {
    lruCache.set(key, kvHit)
    return { prices: kvHit, source: 'cache' }
  }

  // L3: Binance
  try {
    const prices = await fetchYearFromBinance(binanceSymbol, year)
    lruCache.set(key, prices)
    await kvSet(key, prices, kvTtl(year))
    return { prices, source: 'live' }
  } catch (err: any) {
    console.error(`Binance fetch failed for ${binanceSymbol}/${year}:`, err.message)
    throw err
  }
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const coinSlug = searchParams.get('coinId') // accepts slug (btc) or coin id (bitcoin)
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  if (!coinSlug || !fromParam || !toParam) {
    return NextResponse.json(
      { error: 'Missing required parameters: coinId, from, to' },
      { status: 400 }
    )
  }

  // Resolve coin — accept both slug (btc) and id (bitcoin)
  const coin =
    SUPPORTED_COINS.find((c) => c.slug === coinSlug) ||
    SUPPORTED_COINS.find((c) => c.id === coinSlug)

  if (!coin) {
    return NextResponse.json({ error: 'Unsupported coin' }, { status: 400 })
  }

  const fromDate = new Date(fromParam + 'T00:00:00Z')
  const toDate = new Date(toParam + 'T00:00:00Z')

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  if (fromDate > toDate) {
    return NextResponse.json(
      { error: 'from date must be before to date' },
      { status: 400 }
    )
  }

  const fromYear = fromDate.getUTCFullYear()
  const toYear = Math.min(toDate.getUTCFullYear(), currentYear())

  if (toYear - fromYear > 10) {
    return NextResponse.json(
      { error: 'Maximum date range is 10 years' },
      { status: 400 }
    )
  }

  // Server-side listingDate validation — avoid wasting Binance calls
  const listingMs = new Date(coin.listingDate + 'T00:00:00Z').getTime()
  if (fromDate.getTime() < listingMs) {
    return NextResponse.json(
      { error: `Data available from ${coin.listingDate}` },
      { status: 400 }
    )
  }

  try {
    const allPrices: PricePoint[] = []
    let overallSource: 'live' | 'cache' | 'stale' = 'cache'

    for (let year = fromYear; year <= toYear; year++) {
      const { prices, source } = await getPricesForYear(coin.binanceSymbol, year)
      allPrices.push(...prices)
      if (source === 'live') overallSource = 'live'
      if (source === 'stale') overallSource = 'stale'
    }

    // Filter to requested range
    const fromMs = fromDate.getTime()
    const toMs = toDate.getTime()
    const filtered = allPrices.filter(
      (p) => p.timestamp >= fromMs && p.timestamp <= toMs
    )

    const response: PricesResponse = {
      coinId: coin.id,
      prices: filtered,
      dataSource: overallSource,
      fromTimestamp: fromMs,
      toTimestamp: toMs,
    }

    return NextResponse.json(response)
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch price data. Please try again later.' },
      { status: 500 }
    )
  }
}
