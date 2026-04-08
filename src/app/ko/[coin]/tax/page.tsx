import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import AnalyticsViewTracker from '@/components/AnalyticsViewTracker'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'
import DcaCalculator from '@/components/DcaCalculator'
import Nav from '@/components/Nav'
import TaxStatusBanner from '@/components/TaxStatusBanner'

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

  const title = `${coin.name} 세금 분석 — 암호화폐 양도소득세 손익분기점`
  const description = `${coin.name}(${coin.symbol}) 적립식 투자 시 예정된 한국 가상자산 과세 시나리오를 반영한 손익분기점 참고값을 계산합니다.`
  const url = `https://dcaify.com/ko/${slug}/tax`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'DCAify', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function KoTaxPage({ params }: Props) {
  const { coin: slug } = await params
  const coin = getCoinBySlug(slug)

  if (!coin) notFound()

  return (
    <>
    <AnalyticsViewTracker eventName="tax_page_view" params={{ coin: slug }} />
    <Nav lang="ko" />
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="mb-8 text-sm text-gray-400">
          <Link href="/ko" className="hover:text-white">홈</Link>
          {' / '}
          <Link href={`/ko/${coin.slug}`} className="hover:text-white">{coin.name} 계산기</Link>
          {' / '}
          <span className="text-white">세금 분석</span>
        </nav>

        <h1 className="text-3xl font-bold mb-2">{coin.name} 세금 분석</h1>
        <p className="text-gray-400 mb-6">
          예정된 한국 가상자산 과세 시나리오를 반영해 {coin.name} 적립식 투자 손익분기점을 참고용으로 계산합니다.
        </p>

        <div className="mb-6">
          <TaxStatusBanner lang="ko" />
        </div>

        {/* Calculator with Korean tax */}
        <DcaCalculator defaultCoin={coin} lang="ko" analyticsContext="tax_page" showTaxBanner={false} />

        <div className="mt-8 space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-3">손익분기점이란?</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              손익분기점(Break-even Price)은 총 투자금을 회수하기 위해 코인 가격이 도달해야 하는 최소 가격입니다.
              세금을 고려한 손익분기점은 현재 DCAify가 가정한 예상 세율 22%를 반영한 참고값으로,
              향후 과세가 시행된다는 전제 아래 원금을 회수할 수 있는 가격을 의미합니다.
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-3">DCA와 세금 절약</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              적립식 투자(DCA)는 평균 매입 단가를 낮추어 양도차익을 줄이는 효과가 있습니다.
              이는 결과적으로 향후 과세가 시행될 때 세후 손익 관리에 도움이 될 수 있습니다.
              다만 실제 세금은 시행 시점과 규정 변경 여부를 다시 확인해야 합니다.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center space-x-4">
          <Link href={`/ko/${coin.slug}`} className="text-blue-400 hover:underline text-sm">
            {coin.name} DCA 계산기 →
          </Link>
          <Link href={`/ko/${coin.slug}/guide`} className="text-blue-400 hover:underline text-sm">
            {coin.name} 적립식 투자 가이드 →
          </Link>
        </div>
      </div>
    </main>
    </>
  )
}
