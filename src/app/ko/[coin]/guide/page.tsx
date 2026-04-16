import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'
import { shouldIndex } from '@/lib/seo'
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

  const title = `${coin.name} 적립식 투자(DCA) 가이드 — 달러 코스트 애버리징 설명`
  const description = `${coin.name}(${coin.symbol})에 적립식 투자하는 방법을 알아보세요. DCA 전략이 무엇인지, 왜 효과적인지, 계산기 사용법까지 안내합니다.`
  const url = `https://dcaify.com/ko/${slug}/guide`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `https://dcaify.com/${slug}/guide`,
        ko: url,
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
    robots: shouldIndex('guide', slug),
  }
}

export default async function KoGuidePage({ params }: Props) {
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
      <div className="max-w-[65ch] mx-auto px-4 py-8">
        <nav className="mb-8 text-sm text-gray-400">
          <Link href="/ko" className="hover:text-white">
            홈
          </Link>
          {' / '}
          <Link href={`/ko/${coin.slug}`} className="hover:text-white">
            {coin.name} 계산기
          </Link>
          {' / '}
          <span className="text-white">가이드</span>
        </nav>

        <h1 className="text-3xl font-bold mb-6">
          {coin.name} 적립식 투자(DCA) 가이드
        </h1>

        <p className="text-gray-300 leading-relaxed mb-8">
          {coin.description.ko}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            {coin.name}이란?
          </h2>
          <p className="text-gray-300 leading-relaxed">
            {coin.name}({coin.symbol})에 대한 적립식 투자(DCA)란 현재 가격에
            관계없이 정해진 금액을 정기적으로 투자하는 것을 의미합니다. 예를
            들어 매주 10만 원, 매달 50만 원씩 투자하는 방식입니다. 이 전략은
            시장 타이밍을 맞추려는 스트레스를 없애고, 시간이 지남에 따라
            변동성의 영향을 완화합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            왜 {coin.name}에 적립식 투자를 해야 할까?
          </h2>
          <ul className="list-disc list-inside text-gray-300 leading-relaxed space-y-2">
            <li>
              <strong>타이밍 리스크 감소:</strong> 고점과 저점 모두에서
              매수하여 평균 매입 단가를 낮출 수 있습니다.
            </li>
            <li>
              <strong>감정적 규율:</strong> 정해진 일정에 따라 투자하므로
              공포 매도나 FOMO 매수의 유혹을 줄일 수 있습니다.
            </li>
            <li>
              <strong>접근성:</strong> 큰 목돈이 필요하지 않습니다. 소액이라도
              꾸준히 모이면 큰 금액이 됩니다.
            </li>
            <li>
              <strong>검증된 전략:</strong> DCA는 전통 주식 시장에서 수십 년간
              사용되어 온 전략이며, 암호화폐처럼 변동성이 큰 자산에서 특히
              효과적입니다.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">계산기 사용법</h2>
          <ol className="list-decimal list-inside text-gray-300 leading-relaxed space-y-2">
            <li>
              <Link
                href={`/ko/${coin.slug}`}
                className="text-blue-400 hover:underline"
              >
                {coin.name} DCA 계산기
              </Link>
              로 이동합니다.
            </li>
            <li>투자 금액을 선택합니다 (예: 10만 원).</li>
            <li>
              투자 빈도를 선택합니다 (매주, 격주, 또는 매달).
            </li>
            <li>시작 날짜를 선택하여 과거 성과를 확인합니다.</li>
            <li>
              결과를 확인합니다: 총 투자 금액, 포트폴리오 가치, 수익률.
            </li>
          </ol>
        </section>

        {relatedCoins.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-800">
            <h2 className="text-xl font-semibold mb-4">
              관련 코인
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedCoins.map((c) => (
                <Link
                  key={c.slug}
                  href={`/ko/${c.slug}/guide`}
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
    </>
  )
}
