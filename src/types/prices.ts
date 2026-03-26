// Shared API contract — Route Handler and client both import from here
export interface PricePoint {
  timestamp: number // Unix ms
  price: number     // USD
}

export interface PricesResponse {
  coinId: string
  prices: PricePoint[]       // daily [timestamp_ms, USD price]
  dataSource: 'live' | 'cache' | 'stale'
  fromTimestamp: number
  toTimestamp: number
}
