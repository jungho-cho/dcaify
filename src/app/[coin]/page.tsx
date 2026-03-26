import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'
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

interface Props {
  params: Promise<{ coin: string }>
}

export function generateStaticParams() {
  return SUPPORTED_COINS.map((c) => ({ coin: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { coin: slug } = await params
  const coin = getCoinBySlug(slug)
  if (!coin) return {}

  const title = `${coin.name} DCA Calculator — See Your Returns`
  const description = `Calculate your ${coin.name} (${coin.symbol}) dollar cost averaging returns. See exactly how much you'd have if you invested $100/month in ${coin.name} DCA strategy.`
  const url = `https://dcaify.com/${slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'DCAify',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function CoinPage({ params }: Props) {
  const { coin: slug } = await params
  const coin = getCoinBySlug(slug)

  if (!coin) notFound()

  return (
    <>
      <JsonLd coin={coin} />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <DcaCalculator defaultCoin={coin} />
        </div>
      </main>
    </>
  )
}
