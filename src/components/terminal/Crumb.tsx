interface CrumbProps {
  path: string
}

export default function Crumb({ path }: CrumbProps) {
  return (
    <div style={{ fontSize: 12, color: 'var(--muted)', margin: '20px 0 4px' }}>
      # cwd: <span style={{ color: 'var(--fg-2)' }}>{path}</span>
    </div>
  )
}
