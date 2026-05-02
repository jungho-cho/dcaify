import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearHistoricalPriceCacheForTests, getHistoricalPrices } from '@/lib/binance-prices'

function makeKline(timestamp: string, close: string) {
  return [new Date(`${timestamp}T00:00:00Z`).getTime(), '0', '0', '0', close]
}

describe('getHistoricalPrices', () => {
  beforeEach(() => {
    clearHistoricalPriceCacheForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches yearly Binance daily closes and filters to the requested dates', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        makeKline('2024-12-31', '90'),
        makeKline('2025-01-01', '100'),
        makeKline('2025-01-02', '110'),
      ],
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getHistoricalPrices({
      binanceSymbol: 'BTCUSDT',
      from: '2025-01-01',
      to: '2025-01-02',
      now: new Date('2025-01-03T00:00:00Z'),
    })

    expect(result.dataSource).toBe('live')
    expect(result.prices).toEqual([
      { timestamp: new Date('2025-01-01T00:00:00Z').getTime(), price: 100 },
      { timestamp: new Date('2025-01-02T00:00:00Z').getTime(), price: 110 },
    ])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('symbol=BTCUSDT')
  })

  it('uses cached yearly data on the second call', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [makeKline('2025-01-01', '100')],
    })
    vi.stubGlobal('fetch', fetchMock)

    await getHistoricalPrices({
      binanceSymbol: 'ETHUSDT',
      from: '2025-01-01',
      to: '2025-01-01',
      now: new Date('2025-01-03T00:00:00Z'),
    })
    const second = await getHistoricalPrices({
      binanceSymbol: 'ETHUSDT',
      from: '2025-01-01',
      to: '2025-01-01',
      now: new Date('2025-01-03T00:00:00Z'),
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second.dataSource).toBe('cache')
    expect(second.prices[0].price).toBe(100)
  })

  it('throws when every Binance base URL fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    await expect(
      getHistoricalPrices({
        binanceSymbol: 'SOLUSDT',
        from: '2025-01-01',
        to: '2025-01-02',
        now: new Date('2025-01-03T00:00:00Z'),
      }),
    ).rejects.toThrow('Binance upstream unavailable for SOLUSDT/2025')
  })
})
