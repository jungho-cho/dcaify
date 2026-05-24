import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'
import { shouldIndex } from '@/lib/seo'
import GuideContent from '@/components/GuideContent'
import Crumb from '@/components/terminal/Crumb'
import PageShell from '@/components/terminal/PageShell'

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
      languages: { en: `https://dcaify.com/${slug}/guide`, ko: url },
    },
    openGraph: { title, description, url, siteName: 'DCAify', type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
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
    <PageShell tab="home" lang="ko">
      <Crumb path={`/ko/${coin.slug}/guide`} />
      <GuideContent coin={coin} lang="ko" relatedCoins={relatedCoins} />
    </PageShell>
  )
}
