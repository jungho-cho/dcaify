import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'
import DcaCalculator from '@/components/DcaCalculator'

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
  }
}

export default async function KoCoinPage({ params }: Props) {
  const { coin: slug } = await params
  const coin = getCoinBySlug(slug)

  if (!coin) notFound()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <DcaCalculator defaultCoin={coin} lang="ko" />
      </div>
    </main>
  )
}
