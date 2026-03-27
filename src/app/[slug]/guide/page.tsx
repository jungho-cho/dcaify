import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return SUPPORTED_COINS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const coin = getCoinBySlug(slug)
  if (!coin) return {}

  const title = `${coin.name} DCA Guide — Dollar Cost Averaging Explained`
  const description = `Learn how to dollar cost average into ${coin.name} (${coin.symbol}). Understand the DCA strategy, why it works, and how to use the DCAify calculator.`
  const url = `https://dcaify.com/${slug}/guide`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        ko: `https://dcaify.com/ko/${slug}/guide`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'DCAify',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const coin = getCoinBySlug(slug)

  if (!coin) notFound()

  const relatedCoins = SUPPORTED_COINS.filter(
    (c) => c.category === coin.category && c.slug !== coin.slug,
  ).slice(0, 5)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-[65ch] mx-auto px-4 py-8">
        <nav className="mb-8 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">
            Home
          </Link>
          {' / '}
          <Link href={`/${coin.slug}`} className="hover:text-white">
            {coin.name} Calculator
          </Link>
          {' / '}
          <span className="text-white">Guide</span>
        </nav>

        <h1 className="text-3xl font-bold mb-6">
          {coin.name} DCA Guide — Dollar Cost Averaging Explained
        </h1>

        <p className="text-gray-300 leading-relaxed mb-8">
          {coin.description.en}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            What is {coin.name} DCA?
          </h2>
          <p className="text-gray-300 leading-relaxed">
            Dollar cost averaging (DCA) into {coin.name} ({coin.symbol}) means
            investing a fixed amount of money at regular intervals — for
            example, $100 every week or $500 every month — regardless of the
            current price. This strategy removes the stress of trying to time
            the market and smooths out the impact of volatility over time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Why DCA into {coin.name}?
          </h2>
          <ul className="list-disc list-inside text-gray-300 leading-relaxed space-y-2">
            <li>
              <strong>Reduces timing risk:</strong> You buy at both highs and
              lows, averaging out your cost basis over time.
            </li>
            <li>
              <strong>Emotional discipline:</strong> A fixed schedule removes
              the temptation to panic-sell or FOMO-buy.
            </li>
            <li>
              <strong>Accessible:</strong> You don&apos;t need a large lump sum
              to get started — even small amounts add up.
            </li>
            <li>
              <strong>Proven strategy:</strong> DCA has been used in
              traditional stock markets for decades and works especially well
              in volatile asset classes like crypto.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            How to Use the Calculator
          </h2>
          <ol className="list-decimal list-inside text-gray-300 leading-relaxed space-y-2">
            <li>
              Go to the{' '}
              <Link
                href={`/${coin.slug}`}
                className="text-blue-400 hover:underline"
              >
                {coin.name} DCA Calculator
              </Link>
              .
            </li>
            <li>Choose your investment amount (e.g. $100).</li>
            <li>Select how often you invest (weekly, biweekly, or monthly).</li>
            <li>Pick a start date to see historical performance.</li>
            <li>
              Review your results: total invested, portfolio value, and return
              percentage.
            </li>
          </ol>
        </section>

        {relatedCoins.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-800">
            <h2 className="text-xl font-semibold mb-4">
              Related Coins
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedCoins.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}/guide`}
                  className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm hover:border-blue-500 hover:bg-gray-800 transition"
                >
                  {c.symbol} — {c.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
