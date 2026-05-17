import type { ReactNode } from 'react'

interface HRProps {
  label: string
  right?: ReactNode
}

export default function HR({ label, right }: HRProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '32px 0 16px',
        color: 'var(--faint)',
        fontSize: 12,
        whiteSpace: 'nowrap',
      }}
    >
      <span>────</span>
      <span style={{ color: 'var(--accent)' }}>{label}</span>
      <span style={{ flex: 1, borderTop: '1px dashed var(--border)' }} />
      {right && <span style={{ color: 'var(--muted)' }}>{right}</span>}
    </div>
  )
}
