import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CoinSeoSnapshotView from '@/components/seo/CoinSeoSnapshot'
import ComparisonSeoSnapshotView from '@/components/seo/ComparisonSeoSnapshot'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { computeCoinSeoSnapshotFromPrices, computeComparisonSeoSnapshotFromPrices } from '@/lib/dca-scenarios'
import { getCoinBySlug } from '@/lib/coins'
import type { PricePoint } from '@/types/prices'

function monthlyPrices(startYear: number, endYear: number, price: number): PricePoint[] {
  const prices: PricePoint[] = []
  for (let year = startYear; year <= endYear; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      prices.push({ timestamp: Date.UTC(year, month, 1), price })
    }
  }
  return prices
}

describe('JsonLdScript', () => {
  it('escapes less-than characters in JSON-LD payloads', () => {
    const html = renderToStaticMarkup(<JsonLdScript data={{ name: '<script>' }} />)

    expect(html).toContain('\\u003cscript>')
    expect(html).not.toContain('<script&gt;')
  })
})

describe('CoinSeoSnapshotView', () => {
  it('renders a focused English coin SEO snapshot with table and FAQ schema', () => {
    const coin = getCoinBySlug('btc')
    if (!coin) throw new Error('BTC fixture missing')
    const snapshot = computeCoinSeoSnapshotFromPrices({
      coin,
      lang: 'en',
      prices: monthlyPrices(2021, 2025, 100),
    })

    const html = renderToStaticMarkup(<CoinSeoSnapshotView snapshot={snapshot} />)

    expect(html).toContain('Bitcoin DCA Calculator')
    expect(html).toContain('$100/month')
    expect(html).toContain('Scenario table')
    expect(html).toContain('DCA vs lump sum')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('FAQPage')
  })

  it('renders Korean-native copy for the focused Korean BTC page', () => {
    const coin = getCoinBySlug('btc')
    if (!coin) throw new Error('BTC fixture missing')
    const snapshot = computeCoinSeoSnapshotFromPrices({
      coin,
      lang: 'ko',
      prices: monthlyPrices(2021, 2025, 100),
    })

    const html = renderToStaticMarkup(<CoinSeoSnapshotView snapshot={snapshot} />)

    expect(html).toContain('비트코인 적립식 투자 계산기')
    expect(html).toContain('달러 기준')
    expect(html).toContain('/ko/btc/tax')
  })
})

describe('ComparisonSeoSnapshotView', () => {
  it('renders a focused BTC vs ETH comparison SEO snapshot', () => {
    const btc = getCoinBySlug('btc')
    const eth = getCoinBySlug('eth')
    if (!btc || !eth) throw new Error('coin fixtures missing')

    const snapshot = computeComparisonSeoSnapshotFromPrices({
      leftCoin: btc,
      rightCoin: eth,
      leftPrices: monthlyPrices(2021, 2025, 100),
      rightPrices: monthlyPrices(2021, 2025, 200),
    })

    const html = renderToStaticMarkup(<ComparisonSeoSnapshotView snapshot={snapshot} />)

    expect(html).toContain('Bitcoin vs Ethereum DCA Comparison')
    expect(html).toContain('$100/month into Bitcoin vs Ethereum')
    expect(html).toContain('Side-by-side scenario table')
    expect(html).toContain('BTC calculator')
    expect(html).toContain('ETH calculator')
  })
})
