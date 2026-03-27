import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563EB',
          borderRadius: 40,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 120 120">
          <path
            d="M15 85 L35 45 L55 65 L75 25 L105 35"
            stroke="#10B981"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M15 85 L35 45 L55 65 L75 25 L105 35 L105 85 Z"
            fill="#10B981"
            fillOpacity="0.2"
          />
        </svg>
      </div>
    ),
    { ...size },
  )
}
