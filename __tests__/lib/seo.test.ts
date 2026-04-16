import { describe, expect, it } from 'vitest'
import { isTopCoin, isTopComparison, shouldIndex } from '@/lib/seo'

describe('isTopCoin', () => {
  it.each(['btc', 'eth', 'sol', 'xrp', 'ada', 'doge', 'bnb', 'avax', 'dot', 'link'])(
    'returns true for Top 10 slug: %s',
    (slug) => {
      expect(isTopCoin(slug)).toBe(true)
    },
  )

  it.each(['matic', 'trx', 'uni', 'ltc', 'shib', 'pepe'])(
    'returns false for non-Top-10 slug: %s',
    (slug) => {
      expect(isTopCoin(slug)).toBe(false)
    },
  )

  it('returns false for an unknown slug', () => {
    expect(isTopCoin('not-a-real-coin')).toBe(false)
  })
})

describe('isTopComparison', () => {
  it.each([
    'btc-vs-eth',
    'btc-vs-sol',
    'btc-vs-doge',
    'eth-vs-sol',
    'doge-vs-eth',
  ])('returns true for Top 5 pair: %s', (slug) => {
    expect(isTopComparison(slug)).toBe(true)
  })

  it.each(['uni-vs-ltc', 'btc-vs-matic', 'eth-vs-trx'])(
    'returns false for non-Top-5 pair: %s',
    (slug) => {
      expect(isTopComparison(slug)).toBe(false)
    },
  )

  it('returns false for a malformed pair slug', () => {
    expect(isTopComparison('btc-and-eth')).toBe(false)
  })
})

describe('shouldIndex', () => {
  it('indexes Top 10 coin pages', () => {
    expect(shouldIndex('coin', 'btc')).toEqual({ index: true, follow: true })
  })

  it('noindexes non-Top-10 coin pages but follows links', () => {
    expect(shouldIndex('coin', 'matic')).toEqual({ index: false, follow: true })
  })

  it('indexes Top 5 comparison pages', () => {
    expect(shouldIndex('comparison', 'btc-vs-eth')).toEqual({ index: true, follow: true })
  })

  it('noindexes non-Top-5 comparison pages', () => {
    expect(shouldIndex('comparison', 'uni-vs-ltc')).toEqual({ index: false, follow: true })
  })

  it('indexes Top 10 guide pages', () => {
    expect(shouldIndex('guide', 'eth')).toEqual({ index: true, follow: true })
  })

  it('noindexes non-Top-10 guide pages', () => {
    expect(shouldIndex('guide', 'trx')).toEqual({ index: false, follow: true })
  })

  it('always noindexes tax pages regardless of slug', () => {
    expect(shouldIndex('tax', 'btc')).toEqual({ index: false, follow: true })
    expect(shouldIndex('tax', 'matic')).toEqual({ index: false, follow: true })
  })
})
