import { describe, expect, it } from 'vitest'
import sitemap from '@/app/sitemap'
import { TOP_COIN_SLUGS, TOP_COMPARISON_SLUGS } from '@/lib/seo'

const urls = () => sitemap().map((entry) => entry.url)

describe('sitemap', () => {
  it('includes homepage and static pages for both languages', () => {
    const u = urls()
    expect(u).toContain('https://dcaify.com')
    expect(u).toContain('https://dcaify.com/ko')
    expect(u).toContain('https://dcaify.com/about')
    expect(u).toContain('https://dcaify.com/ko/about')
    expect(u).toContain('https://dcaify.com/privacy')
    expect(u).toContain('https://dcaify.com/ko/privacy')
    expect(u).toContain('https://dcaify.com/blog')
    expect(u).toContain('https://dcaify.com/ko/blog')
  })

  it('includes every Top 10 coin page and guide page in EN and KO', () => {
    const u = urls()
    for (const slug of TOP_COIN_SLUGS) {
      expect(u).toContain(`https://dcaify.com/${slug}`)
      expect(u).toContain(`https://dcaify.com/ko/${slug}`)
      expect(u).toContain(`https://dcaify.com/${slug}/guide`)
      expect(u).toContain(`https://dcaify.com/ko/${slug}/guide`)
    }
  })

  it('includes every Top 5 comparison page', () => {
    const u = urls()
    for (const pair of TOP_COMPARISON_SLUGS) {
      expect(u).toContain(`https://dcaify.com/${pair}`)
    }
  })

  it('excludes non-Top-10 coin pages', () => {
    const u = urls()
    expect(u).not.toContain('https://dcaify.com/matic')
    expect(u).not.toContain('https://dcaify.com/trx')
    expect(u).not.toContain('https://dcaify.com/ko/matic')
  })

  it('excludes non-Top-10 guide pages', () => {
    const u = urls()
    expect(u).not.toContain('https://dcaify.com/matic/guide')
    expect(u).not.toContain('https://dcaify.com/ko/trx/guide')
  })

  it('excludes all tax pages', () => {
    const u = urls()
    for (const entry of u) {
      expect(entry.endsWith('/tax')).toBe(false)
    }
  })

  it('excludes non-Top-5 comparison pages', () => {
    const u = urls()
    expect(u).not.toContain('https://dcaify.com/uni-vs-ltc')
    expect(u).not.toContain('https://dcaify.com/btc-vs-matic')
  })

  it('emits exactly 53 URLs', () => {
    expect(urls().length).toBe(53)
  })
})
