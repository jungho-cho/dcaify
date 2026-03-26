import { PricePoint } from '@/types/prices'

export type Frequency = 'daily' | 'weekly' | 'monthly'

export interface DcaInput {
  prices: PricePoint[]       // sorted ascending by timestamp
  amountPerPeriod: number    // USD
  frequency: Frequency
  startDate: string          // YYYY-MM-DD
  endDate: string            // YYYY-MM-DD
  currentPrice: number       // latest USD price for current value calculation
}

export interface DcaResult {
  totalInvested: number
  totalCoins: number
  currentValue: number
  roi: number           // percentage e.g. 312.5
  purchases: Purchase[]
  startDate: string
  endDate: string
}

export interface Purchase {
  date: string
  price: number
  amount: number  // USD invested
  coins: number
}

export interface BreakEvenResult {
  breakEvenPrice: number
  breakEvenWithTax: number
}

// Build a date → price lookup map from sorted PricePoint array
function buildPriceMap(prices: PricePoint[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const p of prices) {
    const date = new Date(p.timestamp).toISOString().slice(0, 10)
    map.set(date, p.price)
  }
  return map
}

// Find nearest available price on or after the target date
function findNearestPrice(
  map: Map<string, number>,
  targetDate: Date,
  prices: PricePoint[]
): number | null {
  // Try exact date first
  const dateStr = targetDate.toISOString().slice(0, 10)
  if (map.has(dateStr)) return map.get(dateStr)!

  // Search forward up to 7 days (weekend / missing data gap)
  for (let i = 1; i <= 7; i++) {
    const d = new Date(targetDate)
    d.setUTCDate(d.getUTCDate() + i)
    const s = d.toISOString().slice(0, 10)
    if (map.has(s)) return map.get(s)!
  }

  // Search backward up to 7 days
  for (let i = 1; i <= 7; i++) {
    const d = new Date(targetDate)
    d.setUTCDate(d.getUTCDate() - i)
    const s = d.toISOString().slice(0, 10)
    if (map.has(s)) return map.get(s)!
  }

  return null
}

// Generate purchase dates based on frequency
function generatePurchaseDates(
  startDate: string,
  endDate: string,
  frequency: Frequency
): Date[] {
  const dates: Date[] = []
  const start = new Date(startDate + 'T00:00:00Z')
  const end = new Date(endDate + 'T00:00:00Z')

  if (start > end) return dates

  const current = new Date(start)

  while (current <= end) {
    dates.push(new Date(current))

    if (frequency === 'daily') {
      current.setUTCDate(current.getUTCDate() + 1)
    } else if (frequency === 'weekly') {
      current.setUTCDate(current.getUTCDate() + 7)
    } else {
      // monthly — same day next month, clamped to month end
      const day = start.getUTCDate()
      // Set to 1st first to prevent overflow (e.g. Jan 31 + 1 month = Mar 3)
      current.setUTCDate(1)
      current.setUTCMonth(current.getUTCMonth() + 1)
      // Clamp to month end (handles Jan 31 → Feb 28/29 correctly)
      const lastDay = new Date(
        Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0)
      ).getUTCDate()
      current.setUTCDate(Math.min(day, lastDay))
    }
  }

  return dates
}

export function calculateDca(input: DcaInput): DcaResult {
  const { prices, amountPerPeriod, frequency, startDate, endDate, currentPrice } = input

  if (amountPerPeriod <= 0) {
    throw new Error('Investment amount must be greater than 0')
  }

  if (!prices || prices.length === 0) {
    throw new Error('No price data available')
  }

  const priceMap = buildPriceMap(prices)
  const purchaseDates = generatePurchaseDates(startDate, endDate, frequency)

  const purchases: Purchase[] = []
  let totalInvested = 0
  let totalCoins = 0

  for (const date of purchaseDates) {
    const price = findNearestPrice(priceMap, date, prices)
    if (price === null || price === 0) continue // skip days with no data

    const coins = amountPerPeriod / price
    totalInvested += amountPerPeriod
    totalCoins += coins

    purchases.push({
      date: date.toISOString().slice(0, 10),
      price,
      amount: amountPerPeriod,
      coins,
    })
  }

  const currentValue = totalCoins * currentPrice
  const roi = totalInvested === 0 ? 0 : ((currentValue - totalInvested) / totalInvested) * 100

  return {
    totalInvested,
    totalCoins,
    currentValue,
    roi,
    purchases,
    startDate,
    endDate,
  }
}

// Break-even price calculation
// taxRate: 0 for no tax, 0.22 for Korean 22%
export function calculateBreakEven(
  totalInvested: number,
  totalCoins: number,
  taxRate = 0
): BreakEvenResult {
  if (totalCoins === 0) {
    throw new Error('Cannot calculate break-even: no coins accumulated')
  }

  const breakEvenPrice = totalInvested / totalCoins

  // With tax: need to net enough to cover invested amount after tax
  // net_needed = totalInvested / (1 - taxRate)
  const netNeeded = taxRate >= 1 ? Infinity : totalInvested / (1 - taxRate)
  const breakEvenWithTax = netNeeded / totalCoins

  return { breakEvenPrice, breakEvenWithTax }
}
