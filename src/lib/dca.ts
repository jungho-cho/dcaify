import type { PricePoint } from '@/types/prices'

export type Frequency = 'daily' | 'weekly' | 'monthly'

export interface DcaInput {
  prices: PricePoint[]
  amountPerPeriod: number
  frequency: Frequency
  startDate: string
  endDate: string
  currentPrice: number
}

export interface DcaResult {
  totalInvested: number
  totalCoins: number
  currentValue: number
  roi: number
  purchases: Purchase[]
  startDate: string
  endDate: string
}

export interface Purchase {
  date: string
  price: number
  amount: number
  coins: number
}

export interface BreakEvenResult {
  breakEvenPrice: number
  breakEvenWithTax: number
}

function buildPriceMap(prices: PricePoint[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const point of prices) {
    const date = new Date(point.timestamp).toISOString().slice(0, 10)
    map.set(date, point.price)
  }
  return map
}

function findNearestPrice(map: Map<string, number>, targetDate: Date): number | null {
  const dateStr = targetDate.toISOString().slice(0, 10)
  if (map.has(dateStr)) return map.get(dateStr)!

  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDate = new Date(targetDate)
    nextDate.setUTCDate(nextDate.getUTCDate() + offset)
    const nextStr = nextDate.toISOString().slice(0, 10)
    if (map.has(nextStr)) return map.get(nextStr)!
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const previousDate = new Date(targetDate)
    previousDate.setUTCDate(previousDate.getUTCDate() - offset)
    const previousStr = previousDate.toISOString().slice(0, 10)
    if (map.has(previousStr)) return map.get(previousStr)!
  }

  return null
}

function generatePurchaseDates(startDate: string, endDate: string, frequency: Frequency): Date[] {
  const dates: Date[] = []
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  if (start > end) return dates

  const current = new Date(start)
  while (current <= end) {
    dates.push(new Date(current))

    if (frequency === 'daily') {
      current.setUTCDate(current.getUTCDate() + 1)
      continue
    }

    if (frequency === 'weekly') {
      current.setUTCDate(current.getUTCDate() + 7)
      continue
    }

    const day = start.getUTCDate()
    current.setUTCDate(1)
    current.setUTCMonth(current.getUTCMonth() + 1)
    const lastDay = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0)).getUTCDate()
    current.setUTCDate(Math.min(day, lastDay))
  }

  return dates
}

export function calculateDca(input: DcaInput): DcaResult {
  const { prices, amountPerPeriod, frequency, startDate, endDate, currentPrice } = input

  if (amountPerPeriod <= 0) throw new Error('Investment amount must be greater than 0')
  if (!prices.length) throw new Error('No price data available')

  const priceMap = buildPriceMap(prices)
  const purchaseDates = generatePurchaseDates(startDate, endDate, frequency)
  const purchases: Purchase[] = []
  let totalInvested = 0
  let totalCoins = 0

  for (const purchaseDate of purchaseDates) {
    const price = findNearestPrice(priceMap, purchaseDate)
    if (price === null || price === 0) continue

    const coins = amountPerPeriod / price
    totalInvested += amountPerPeriod
    totalCoins += coins

    purchases.push({
      date: purchaseDate.toISOString().slice(0, 10),
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

export function calculateBreakEven(totalInvested: number, totalCoins: number, taxRate = 0): BreakEvenResult {
  if (totalCoins === 0) throw new Error('Cannot calculate break-even: no coins accumulated')

  const breakEvenPrice = totalInvested / totalCoins
  const netNeeded = taxRate >= 1 ? Infinity : totalInvested / (1 - taxRate)
  const breakEvenWithTax = netNeeded / totalCoins

  return { breakEvenPrice, breakEvenWithTax }
}
