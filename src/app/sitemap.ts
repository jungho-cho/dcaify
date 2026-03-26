import { MetadataRoute } from 'next'
import { SUPPORTED_COINS } from '@/lib/coins'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://dcaify.com'
  const now = new Date()

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...SUPPORTED_COINS.map((c) => ({
      url: `${base}/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ]
}
