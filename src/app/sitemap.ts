import { MetadataRoute } from 'next'
import { SUPPORTED_COINS, getComparisonPairs } from '@/lib/coins'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://dcaify.com'
  const now = new Date()

  const pages: MetadataRoute.Sitemap = [
    // Homepage
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
  ]

  // Coin calculator pages (en + ko)
  for (const c of SUPPORTED_COINS) {
    pages.push(
      { url: `${base}/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${base}/ko/${c.slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    )
  }

  // Guide pages (en + ko)
  for (const c of SUPPORTED_COINS) {
    pages.push(
      { url: `${base}/${c.slug}/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
      { url: `${base}/ko/${c.slug}/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    )
  }

  // Tax pages (ko only)
  for (const c of SUPPORTED_COINS) {
    pages.push(
      { url: `${base}/ko/${c.slug}/tax`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    )
  }

  // Comparison pages (en only, top 20 coins)
  for (const pair of getComparisonPairs()) {
    pages.push(
      { url: `${base}/${pair.slug}`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    )
  }

  return pages
}
