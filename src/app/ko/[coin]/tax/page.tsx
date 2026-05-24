import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import AnalyticsViewTracker from '@/components/AnalyticsViewTracker'
import KoTaxContent from '@/components/KoTaxContent'
import Crumb from '@/components/terminal/Crumb'
import PageShell from '@/components/terminal/PageShell'
import { shouldIndex } from '@/lib/seo'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'

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
    robots: shouldIndex('tax', slug),
  }
}

export default async function KoTaxPage({ params }: Props) {
  const { coin: slug } = await params
  const coin = getCoinBySlug(slug)
  if (!coin) notFound()

  return (
    <PageShell tab="tax" lang="ko">
      <AnalyticsViewTracker eventName="tax_page_view" params={{ coin: slug }} />
      <Crumb path={`/ko/${coin.slug}/tax`} />
      <KoTaxContent coin={coin} />
    </PageShell>
  )
}
