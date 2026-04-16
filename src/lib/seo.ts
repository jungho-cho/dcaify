/**
 * Indexation policy source of truth.
 *
 * Only pages in these lists are indexable by Google. All other page
 * variants emit `noindex, follow` so link equity still flows but the
 * URL does not enter Google's index. See
 * docs/superpowers/specs/2026-04-16-seo-indexation-recovery-design.md.
 */

export const TOP_COIN_SLUGS = [
  'btc',
  'eth',
  'sol',
  'xrp',
  'ada',
  'doge',
  'bnb',
  'avax',
  'dot',
  'link',
] as const

export const TOP_COMPARISON_SLUGS = [
  'btc-vs-eth',
  'btc-vs-sol',
  'btc-vs-doge',
  'eth-vs-sol',
  'doge-vs-eth',
] as const

const TOP_COIN_SET: ReadonlySet<string> = new Set(TOP_COIN_SLUGS)
const TOP_COMPARISON_SET: ReadonlySet<string> = new Set(TOP_COMPARISON_SLUGS)

export function isTopCoin(slug: string): boolean {
  return TOP_COIN_SET.has(slug)
}

export function isTopComparison(slug: string): boolean {
  return TOP_COMPARISON_SET.has(slug)
}

export type PageType = 'coin' | 'guide' | 'comparison' | 'tax'

export interface RobotsDirective {
  index: boolean
  follow: boolean
}

export function shouldIndex(type: PageType, slug: string): RobotsDirective {
  if (type === 'tax') return { index: false, follow: true }
  if (type === 'comparison') {
    return { index: isTopComparison(slug), follow: true }
  }
  return { index: isTopCoin(slug), follow: true }
}
