interface AsciiHeaderProps {
  lines: readonly string[]
  subtitle?: string
}

export default function AsciiHeader({ lines, subtitle }: AsciiHeaderProps) {
  return (
    <>
      <pre
        style={{
          color: 'var(--accent)',
          margin: '20px 0 4px',
          fontSize: 11,
          lineHeight: 1.0,
          whiteSpace: 'pre',
          overflowX: 'auto',
        }}
      >
        {lines.join('\n')}
      </pre>
      {subtitle && (
        <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 20 }}>
          # {subtitle}
        </div>
      )}
    </>
  )
}
