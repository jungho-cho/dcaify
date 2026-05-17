interface PromptProps {
  cmd: string
  args?: ReadonlyArray<readonly [string, string | number]>
  cursor?: boolean
  size?: number
}

export default function Prompt({ cmd, args = [], cursor = true, size = 16 }: PromptProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        fontSize: size,
        lineHeight: 1.6,
      }}
    >
      <span style={{ color: 'var(--accent)' }}>$ </span>
      <span style={{ color: 'var(--fg)' }}>{cmd}</span>
      {args.map(([k, v], i) => (
        <span key={`${k}-${i}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ color: 'var(--fg-2)' }}>&nbsp;{k}=</span>
          <span style={{ color: 'var(--amber)', background: 'var(--amber-bg)', padding: '0 4px' }}>
            {String(v)}
          </span>
        </span>
      ))}
      {cursor && (
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            background: 'var(--accent)',
            width: 9,
            height: size + 2,
            marginLeft: 6,
            verticalAlign: 'middle',
            animation: 'trmBlink 1s steps(2) infinite',
          }}
        />
      )}
    </div>
  )
}
