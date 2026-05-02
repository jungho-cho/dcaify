import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'
import { getHistoricalPrices } from '@/lib/binance-prices'
import { SUPPORTED_COINS } from '@/lib/coins'
import type { PriceApiErrorCode, PriceApiErrorResponse, PricesResponse } from '@/types/prices'

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

function logApiEvent(event: string, detail: Record<string, unknown>): void {
  console.error(JSON.stringify({ scope: 'prices_api', event, ...detail }))
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
    const response = await getHistoricalPrices({ binanceSymbol: coin.binanceSymbol, from: fromParam, to: toParam })

    return NextResponse.json<PricesResponse>({ ...response, coinId: coin.id })
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
