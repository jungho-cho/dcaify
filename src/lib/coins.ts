export interface CoinConfig {
  id: string            // CoinGecko id (for reference)
  binanceSymbol: string // Binance trading pair e.g. BTCUSDT
  symbol: string        // e.g. BTC
  name: string          // e.g. Bitcoin
  slug: string          // URL slug e.g. btc
  listingDate: string   // YYYY-MM-DD — earliest date with Binance data
}

export const SUPPORTED_COINS: CoinConfig[] = [
  {
    id: 'bitcoin',
    binanceSymbol: 'BTCUSDT',
    symbol: 'BTC',
    name: 'Bitcoin',
    slug: 'btc',
    listingDate: '2017-08-17', // Binance BTCUSDT listing date
  },
  {
    id: 'ethereum',
    binanceSymbol: 'ETHUSDT',
    symbol: 'ETH',
    name: 'Ethereum',
    slug: 'eth',
    listingDate: '2017-08-17', // Binance ETHUSDT listing date
  },
  {
    id: 'solana',
    binanceSymbol: 'SOLUSDT',
    symbol: 'SOL',
    name: 'Solana',
    slug: 'sol',
    listingDate: '2020-08-11', // Binance SOLUSDT listing date
  },
]

export function getCoinBySlug(slug: string): CoinConfig | undefined {
  return SUPPORTED_COINS.find((c) => c.slug === slug)
}

export function getCoinById(id: string): CoinConfig | undefined {
  return SUPPORTED_COINS.find((c) => c.id === id)
}
