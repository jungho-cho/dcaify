import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'
import GuideContent from '@/components/GuideContent'
import Crumb from '@/components/terminal/Crumb'
import PageShell from '@/components/terminal/PageShell'
import { shouldIndex } from '@/lib/seo'

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
      languages: { en: url, ko: `https://dcaify.com/ko/${slug}/guide` },
    },
    openGraph: { title, description, url, siteName: 'DCAify', type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
    robots: shouldIndex('guide', slug),
  }
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const coin = getCoinBySlug(slug)
  if (!coin) notFound()

  const relatedCoins = SUPPORTED_COINS.filter(
    (c) => c.category === coin.category && c.slug !== coin.slug,
  ).slice(0, 5)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is ${coin.name} DCA?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Dollar cost averaging (DCA) into ${coin.name} (${coin.symbol}) means investing a fixed amount of money at regular intervals regardless of price. This removes the need to time the market.`,
        },
      },
      {
        '@type': 'Question',
        name: `Why should I DCA into ${coin.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `DCA reduces timing risk by averaging your purchase price over time. It removes emotional decision-making and is accessible — you don't need a large lump sum to start.`,
        },
      },
      {
        '@type': 'Question',
        name: `How do I calculate my ${coin.name} DCA returns?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Use the DCAify ${coin.name} DCA Calculator at dcaify.com/${coin.slug}. Enter your investment amount, frequency, and date range to see your historical returns.`,
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <PageShell tab="home">
        <Crumb path={`/${coin.slug}/guide`} />
        <GuideContent coin={coin} lang="en" relatedCoins={relatedCoins} />
      </PageShell>
    </>
  )
}
