import { ImageResponse } from 'next/og'

export const alt = 'DCAify — Crypto DCA Calculator'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
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
            width: 140,
            height: 140,
            background: '#2563EB',
            borderRadius: 35,
            marginBottom: 40,
          }}
        >
          <svg width="90" height="90" viewBox="0 0 120 120">
            <path d="M15 85 L35 45 L55 65 L75 25 L105 35" stroke="#10B981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M15 85 L35 45 L55 65 L75 25 L105 35 L105 85 Z" fill="#10B981" fillOpacity="0.2" />
          </svg>
        </div>
        <span style={{ fontSize: 72, fontWeight: 700, color: 'white', marginBottom: 16 }}>
          DCAify
        </span>
        <span style={{ fontSize: 32, color: '#94a3b8' }}>
          Crypto DCA Calculator — See Your Returns
        </span>
      </div>
    ),
    { ...size },
  )
}
