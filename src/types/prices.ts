export interface PricePoint {
  timestamp: number
  price: number
}

export interface PricesResponse {
  coinId: string
  prices: PricePoint[]
  dataSource: 'live' | 'cache' | 'stale'
  fromTimestamp: number
  toTimestamp: number
}

export type PriceApiErrorCode =
  | 'missing_params'
  | 'unsupported_coin'
  | 'invalid_date'
  | 'invalid_range'
  | 'max_range'
  | 'before_listing'
  | 'rate_limited'
  | 'upstream_unavailable'

export interface PriceApiErrorResponse {
  error: string
  code: PriceApiErrorCode
}
