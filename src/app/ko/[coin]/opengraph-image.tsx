import { ImageResponse } from 'next/og'
import { getCoinBySlug, SUPPORTED_COINS } from '@/lib/coins'

export const alt = 'DCAify — 암호화폐 DCA 계산기'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return SUPPORTED_COINS.map((c) => ({ coin: c.slug }))
}

export default async function OgImage({ params }: { params: Promise<{ coin: string }> }) {
  const { coin: slug } = await params
  const coin = getCoinBySlug(slug)
  if (!coin) return new Response('Not found', { status: 404 })

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            background: '#2563EB',
            borderRadius: 30,
            marginBottom: 32,
          }}
        >
          <svg width="80" height="80" viewBox="0 0 120 120">
            <path d="M15 85 L35 45 L55 65 L75 25 L105 35" stroke="#10B981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M15 85 L35 45 L55 65 L75 25 L105 35 L105 85 Z" fill="#10B981" fillOpacity="0.2" />
          </svg>
        </div>
        <span style={{ fontSize: 64, fontWeight: 700, color: 'white', marginBottom: 8 }}>
          {coin.name} DCA 계산기
        </span>
        <span style={{ fontSize: 28, color: '#94a3b8', marginBottom: 24 }}>
          {coin.symbol} 적립식 투자 수익을 계산해보세요
        </span>
        <span style={{ fontSize: 22, color: '#64748b' }}>dcaify.com/ko/{coin.slug}</span>
      </div>
    ),
    { ...size },
  )
}
