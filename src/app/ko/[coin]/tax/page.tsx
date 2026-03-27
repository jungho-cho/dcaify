import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
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

  const title = `${coin.name} 세금 분석 — 암호화폐 양도소득세 손익분기점`
  const description = `${coin.name}(${coin.symbol}) 적립식 투자 시 한국 암호화폐 양도소득세(22%)를 고려한 손익분기점을 계산합니다. 250만원 기본공제 적용.`
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
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <nav className="mb-8 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">홈</Link>
          {' / '}
          <Link href={`/ko/${coin.slug}`} className="hover:text-white">{coin.name} 계산기</Link>
          {' / '}
          <span className="text-white">세금 분석</span>
        </nav>

        <h1 className="text-3xl font-bold mb-2">{coin.name} 세금 분석</h1>
        <p className="text-gray-400 mb-6">
          한국 암호화폐 양도소득세(22%)를 고려한 {coin.name} 적립식 투자 손익분기점을 계산합니다.
        </p>

        {/* Tax info card */}
        <div className="bg-blue-900/20 border border-blue-800 rounded-2xl p-5 mb-6 space-y-3">
          <h2 className="text-lg font-semibold text-blue-300">한국 암호화폐 과세 안내</h2>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>
              <strong>세율:</strong> 양도소득의 22% (지방소득세 포함)
            </li>
            <li>
              <strong>기본공제:</strong> 연간 250만원까지 비과세
            </li>
            <li>
              <strong>과세 대상:</strong> 암호화폐 매도 시 발생하는 양도차익
            </li>
          </ul>
          <p className="text-xs text-yellow-400">
            * 본 계산기의 세금 분석은 참고용이며, 실제 세금은 개인 상황에 따라 다를 수 있습니다. 정확한 세금 계산은 세무 전문가에게 상담하세요.
          </p>
        </div>

        {/* Calculator with Korean tax */}
        <DcaCalculator defaultCoin={coin} lang="ko" />

        <div className="mt-8 space-y-4">
          <div className="bg-gray-900 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-3">손익분기점이란?</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              손익분기점(Break-even Price)은 총 투자금을 회수하기 위해 코인 가격이 도달해야 하는 최소 가격입니다.
              세금을 고려한 손익분기점은 22% 양도소득세를 납부한 후에도 원금을 회수할 수 있는 가격을 의미합니다.
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-3">DCA와 세금 절약</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              적립식 투자(DCA)는 평균 매입 단가를 낮추어 양도차익을 줄이는 효과가 있습니다.
              이는 결과적으로 세금 부담을 줄이는 데 도움이 됩니다.
              특히 변동성이 큰 암호화폐 시장에서 DCA는 세금 효율적인 투자 전략입니다.
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
  )
}
