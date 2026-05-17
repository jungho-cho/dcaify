import type { CSSProperties, ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  padding?: string
  className?: string
  style?: CSSProperties
  tone?: 'default' | 'amber'
}

export default function Panel({
  children,
  padding = '18px 22px',
  className,
  style,
  tone = 'default',
}: PanelProps) {
  const background = tone === 'amber' ? 'rgba(244,185,66,0.10)' : 'var(--panel)'
  const cornerColor = tone === 'amber' ? 'var(--amber)' : 'var(--accent)'
  const borderColor = tone === 'amber' ? 'rgba(244,185,66,0.33)' : 'var(--border)'

  return (
    <div
      className={className}
      style={{
        background,
        border: `1px solid ${borderColor}`,
        padding,
        position: 'relative',
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: -1,
          left: -1,
          width: 6,
          height: 6,
          background: cornerColor,
        }}
      />
      {children}
    </div>
  )
}
