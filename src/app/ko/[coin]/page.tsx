import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'
import { shouldIndex } from '@/lib/seo'
import DcaCalculator from '@/components/DcaCalculator'
import Nav from '@/components/Nav'

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

  const title = `${coin.name} DCA 계산기 — 적립식 투자 수익 계산`
  const description = `${coin.name}(${coin.symbol}) 적립식 투자(DCA) 수익을 계산해보세요. 매달 꾸준히 투자했다면 지금 얼마일까요? 손익분기점 분석 포함.`
  const url = `https://dcaify.com/ko/${slug}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `https://dcaify.com/${slug}`,
        ko: url,
      },
    },
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
    robots: shouldIndex('coin', slug),
  }
}

export default async function KoCoinPage({ params }: Props) {
  const { coin: slug } = await params
  const coin = getCoinBySlug(slug)

  if (!coin) notFound()

  const relatedCoins = SUPPORTED_COINS.filter(
    (c) => c.category === coin.category && c.slug !== coin.slug,
  ).slice(0, 5)

  return (
    <>
    <Nav lang="ko" />
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <DcaCalculator defaultCoin={coin} lang="ko" relatedCoins={relatedCoins} />
        <div className="mt-6 text-center space-x-4">
          <Link
            href={`/ko/${coin.slug}/guide`}
            className="text-blue-400 hover:underline text-sm"
          >
            {coin.name} 적립식 투자 가이드 →
          </Link>
          <Link
            href={`/ko/${coin.slug}/tax`}
            className="text-blue-400 hover:underline text-sm"
          >
            {coin.name} 세금 분석 →
          </Link>
        </div>
      </div>
    </main>
    </>
  )
}
