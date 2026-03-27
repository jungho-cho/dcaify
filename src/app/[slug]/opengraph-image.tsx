import { ImageResponse } from 'next/og'
import { getCoinBySlug, SUPPORTED_COINS, getComparisonPairs } from '@/lib/coins'

export const alt = 'DCAify — Crypto DCA Calculator'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const comparisonPairs = getComparisonPairs()

export function generateStaticParams() {
  const coinParams = SUPPORTED_COINS.map((c) => ({ slug: c.slug }))
  const compParams = comparisonPairs.map((p) => ({ slug: p.slug }))
  return [...coinParams, ...compParams]
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Comparison page
  if (slug.includes('-vs-')) {
    const pair = comparisonPairs.find((p) => p.slug === slug)
    if (!pair) return new Response('Not found', { status: 404 })
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 72, fontWeight: 700, color: '#3b82f6' }}>{pair.coin1.symbol}</span>
              <span style={{ fontSize: 24, color: '#94a3b8' }}>{pair.coin1.name}</span>
            </div>
            <span style={{ fontSize: 48, color: '#64748b' }}>vs</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 72, fontWeight: 700, color: '#10b981' }}>{pair.coin2.symbol}</span>
              <span style={{ fontSize: 24, color: '#94a3b8' }}>{pair.coin2.name}</span>
            </div>
          </div>
          <span style={{ fontSize: 28, color: '#94a3b8' }}>DCA Comparison — dcaify.com</span>
        </div>
      ),
      { ...size },
    )
  }

  // Coin page
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
          {coin.name} DCA Calculator
        </span>
        <span style={{ fontSize: 28, color: '#94a3b8', marginBottom: 24 }}>
          See your {coin.symbol} dollar cost averaging returns
        </span>
        <span style={{ fontSize: 22, color: '#64748b' }}>dcaify.com/{coin.slug}</span>
      </div>
    ),
    { ...size },
  )
}
