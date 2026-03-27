import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { getCoinBySlug, SUPPORTED_COINS, getComparisonPairs, TOP_COINS_FOR_COMPARISON } from '@/lib/coins'
import DcaCalculator from '@/components/DcaCalculator'

function JsonLd({ coin }: { coin: { name: string; symbol: string; slug: string } }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${coin.name} DCA Calculator`,
    description: `Calculate your ${coin.name} dollar cost averaging returns`,
    url: `https://dcaify.com/${coin.slug}`,
    applicationCategory: 'FinanceApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// This is a comparison page route: /btc-vs-eth
function isComparisonSlug(slug: string): boolean {
  return slug.includes('-vs-')
}

// --- Comparison page helpers ---
const comparisonPairs = getComparisonPairs()

function getComparisonBySlug(slug: string) {
  return comparisonPairs.find((p) => p.slug === slug)
}

function getCanonicalComparisonSlug(slug: string): string | null {
  const parts = slug.split('-vs-')
  if (parts.length !== 2) return null
  const [a, b] = parts
  const coinA = getCoinBySlug(a)
  const coinB = getCoinBySlug(b)
  if (!coinA || !coinB) return null
  const [first, second] = [coinA, coinB].sort((x, y) => x.symbol.localeCompare(y.symbol))
  return `${first.slug}-vs-${second.slug}`
}

// --- Static params: coin pages + comparison pages ---
interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  const coinParams = SUPPORTED_COINS.map((c) => ({ slug: c.slug }))
  const compParams = comparisonPairs.map((p) => ({ slug: p.slug }))
  return [...coinParams, ...compParams]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  if (isComparisonSlug(slug)) {
    const pair = getComparisonBySlug(slug)
    if (!pair) return {}
    const title = `${pair.coin1.name} vs ${pair.coin2.name} DCA — Side-by-Side Comparison`
    const description = `Compare ${pair.coin1.name} (${pair.coin1.symbol}) and ${pair.coin2.name} (${pair.coin2.symbol}) dollar cost averaging returns side by side.`
    return {
      title,
      description,
      alternates: { canonical: `https://dcaify.com/${slug}` },
      openGraph: { title, description, url: `https://dcaify.com/${slug}`, siteName: 'DCAify', type: 'website' },
    }
  }

  const coin = getCoinBySlug(slug)
  if (!coin) return {}

  const title = `${coin.name} DCA Calculator — See Your Returns`
  const description = `Calculate your ${coin.name} (${coin.symbol}) dollar cost averaging returns. See exactly how much you'd have if you invested $100/month in ${coin.name} DCA strategy.`
  const url = `https://dcaify.com/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: url, ko: `https://dcaify.com/ko/${slug}` },
    },
    openGraph: { title, description, url, siteName: 'DCAify', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

// --- Comparison Page Component ---
function ComparisonPage({ coin1, coin2, slug }: { coin1: typeof SUPPORTED_COINS[0]; coin2: typeof SUPPORTED_COINS[0]; slug: string }) {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{coin1.name} vs {coin2.name} DCA Comparison</h1>
        <p className="text-gray-400 mb-8">
          Compare dollar cost averaging returns for {coin1.name} ({coin1.symbol}) and {coin2.name} ({coin2.symbol}) side by side.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <DcaCalculator defaultCoin={coin1} />
          </div>
          <div>
            <DcaCalculator defaultCoin={coin2} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/${coin1.slug}`} className="text-blue-400 hover:underline text-sm">
            {coin1.name} Calculator →
          </Link>
          <Link href={`/${coin2.slug}`} className="text-blue-400 hover:underline text-sm">
            {coin2.name} Calculator →
          </Link>
          <Link href={`/${coin1.slug}/guide`} className="text-blue-400 hover:underline text-sm">
            {coin1.name} Guide →
          </Link>
          <Link href={`/${coin2.slug}/guide`} className="text-blue-400 hover:underline text-sm">
            {coin2.name} Guide →
          </Link>
        </div>
      </div>
    </main>
  )
}

// --- Main page handler ---
export default async function SlugPage({ params }: Props) {
  const { slug } = await params

  // Comparison page
  if (isComparisonSlug(slug)) {
    const canonical = getCanonicalComparisonSlug(slug)
    if (canonical && canonical !== slug) {
      const { redirect } = await import('next/navigation')
      redirect(`/${canonical}`)
    }
    const pair = getComparisonBySlug(slug)
    if (!pair) notFound()
    return <ComparisonPage coin1={pair.coin1} coin2={pair.coin2} slug={slug} />
  }

  // Coin calculator page
  const coin = getCoinBySlug(slug)
  if (!coin) notFound()

  const relatedCoins = SUPPORTED_COINS.filter(
    (c) => c.category === coin.category && c.slug !== coin.slug,
  ).slice(0, 5)

  return (
    <>
      <JsonLd coin={coin} />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <DcaCalculator defaultCoin={coin} relatedCoins={relatedCoins} />
          <div className="mt-6 text-center space-x-4">
            <Link href={`/${coin.slug}/guide`} className="text-blue-400 hover:underline text-sm">
              Read the {coin.name} DCA Guide →
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
