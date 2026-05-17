'use client'

import { usePathname } from 'next/navigation'
import TerminalFooter from '@/components/terminal/Footer'

const NOTES: Array<{ test: (path: string) => boolean; note: string }> = [
  { test: (p) => p.endsWith('/tax'), note: 'EOF · 본 계산은 참고용 · 실제 신고는 세무 전문가와 상의' },
  { test: (p) => p.startsWith('/blog/') || p.startsWith('/ko/blog/'), note: 'EOF · share this commit · not investment advice' },
  { test: (p) => p === '/about' || p === '/ko/about', note: 'EOF · MIT licensed · pull requests welcome · not investment advice' },
  { test: (p) => p.endsWith('/guide') || p.includes('/guide/'), note: 'EOF · man-page format · not investment advice' },
]

const DEFAULT_NOTE = 'EOF · ⌃C to exit · not investment advice'

export default function Footer() {
  const pathname = usePathname() || '/'
  const note = NOTES.find((entry) => entry.test(pathname))?.note ?? DEFAULT_NOTE

  return (
    <footer style={{ padding: '0 36px 56px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <TerminalFooter note={note} />
      </div>
    </footer>
  )
}
