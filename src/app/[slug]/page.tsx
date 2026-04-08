import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import ComparisonCalculator from '@/components/ComparisonCalculator'
import DcaCalculator from '@/components/DcaCalculator'
import Nav from '@/components/Nav'
import { getCoinBySlug, getComparisonPairs, SUPPORTED_COINS } from '@/lib/coins'

function CoinJsonLd({ coin }: { coin: { name: string; symbol: string; slug: string } }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${coin.name} DCA Calculator`,
    description: `Calculate your ${coin.name} dollar cost averaging returns`,
    url: `https://dcaify.com/${coin.slug}`,
    applicationCategory: 'FinanceApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

function ComparisonJsonLd({
  slug,
  coin1,
  coin2,
}: {
  slug: string
  coin1: { name: string; symbol: string }
  coin2: { name: string; symbol: string }
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${coin1.name} vs ${coin2.name} DCA Comparison`,
    description: `Compare ${coin1.name} and ${coin2.name} using the same DCA plan and shared time window.`,
    url: `https://dcaify.com/${slug}`,
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

function isComparisonSlug(slug: string): boolean {
  return slug.includes('-vs-')
}

const comparisonPairs = getComparisonPairs()

function getComparisonBySlug(slug: string) {
  return comparisonPairs.find((pair) => pair.slug === slug)
}

function getCanonicalComparisonSlug(slug: string): string | null {
  const parts = slug.split('-vs-')
  if (parts.length !== 2) return null

  const [leftSlug, rightSlug] = parts
  const leftCoin = getCoinBySlug(leftSlug)
  const rightCoin = getCoinBySlug(rightSlug)
  if (!leftCoin || !rightCoin) return null

  const [first, second] = [leftCoin, rightCoin].sort((a, b) => a.symbol.localeCompare(b.symbol))
  return `${first.slug}-vs-${second.slug}`
}

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return [
    ...SUPPORTED_COINS.map((coin) => ({ slug: coin.slug })),
    ...comparisonPairs.map((pair) => ({ slug: pair.slug })),
  ]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  if (isComparisonSlug(slug)) {
    const pair = getComparisonBySlug(slug)
    if (!pair) return {}

    const title = `${pair.coin1.name} vs ${pair.coin2.name} DCA Comparison`
    const description = `Run one shared DCA plan and see whether ${pair.coin1.name} or ${pair.coin2.name} held up better over the same window.`
    const url = `https://dcaify.com/${slug}`

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, siteName: 'DCAify', type: 'website' },
    }
  }

  const coin = getCoinBySlug(slug)
  if (!coin) return {}

  const title = `${coin.name} DCA Calculator — See your recurring-buy result`
  const description = `Calculate your ${coin.name} (${coin.symbol}) dollar cost averaging returns with real Binance daily closes, result explanations, and clear assumptions.`
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

function ComparisonPage({ slug }: { slug: string }) {
  const pair = getComparisonBySlug(slug)
  if (!pair) notFound()

  return (
    <>
      <ComparisonJsonLd slug={slug} coin1={pair.coin1} coin2={pair.coin2} />
      <Nav />
      <main className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <ComparisonCalculator leftCoin={pair.coin1} rightCoin={pair.coin2} />
        </div>
      </main>
    </>
  )
}

function CoinCalculatorPage({ slug }: { slug: string }) {
  const coin = getCoinBySlug(slug)
  if (!coin) notFound()

  const relatedCoins = SUPPORTED_COINS.filter((candidate) => candidate.category === coin.category && candidate.slug !== coin.slug).slice(0, 5)

  return (
    <>
      <CoinJsonLd coin={coin} />
      <Nav />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <DcaCalculator defaultCoin={coin} relatedCoins={relatedCoins} />
          <div className="mt-6 text-center space-x-4">
            <Link href={`/${coin.slug}/guide`} className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>
              Read the {coin.name} guide →
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default async function SlugPage({ params }: Props) {
  const { slug } = await params

  if (isComparisonSlug(slug)) {
    const canonicalSlug = getCanonicalComparisonSlug(slug)
    if (canonicalSlug && canonicalSlug !== slug) {
      redirect(`/${canonicalSlug}`)
    }
    return <ComparisonPage slug={slug} />
  }

  return <CoinCalculatorPage slug={slug} />
}
