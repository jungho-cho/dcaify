import { MetadataRoute } from 'next'
import { TOP_COIN_SLUGS, TOP_COMPARISON_SLUGS } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://dcaify.com'
  const now = new Date()

  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/ko`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/ko/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.2 },
    { url: `${base}/ko/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.2 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/ko/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
  ]

  for (const slug of TOP_COIN_SLUGS) {
    pages.push(
      { url: `${base}/${slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${base}/ko/${slug}`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    )
  }

  for (const slug of TOP_COIN_SLUGS) {
    pages.push(
      { url: `${base}/${slug}/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
      { url: `${base}/ko/${slug}/guide`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    )
  }

  for (const pair of TOP_COMPARISON_SLUGS) {
    pages.push(
      { url: `${base}/${pair}`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    )
  }

  return pages
}
