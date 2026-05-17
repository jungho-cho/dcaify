import type { CSSProperties, ReactNode } from 'react'
import TopBar from './TopBar'

interface PageShellProps {
  children: ReactNode
  /** Override the path label in the TopBar (defaults to the URL pathname). */
  path?: string
  /** Override active tab detection. */
  tab?: 'home' | 'compare' | 'blog' | 'tax' | 'about' | null
  /** Override language detection. */
  lang?: 'en' | 'ko'
  style?: CSSProperties
  /** Max content width. Defaults to 1280px. */
  maxWidth?: number | string
}

export default function PageShell({
  children,
  path,
  tab,
  lang,
  style,
  maxWidth = 1280,
}: PageShellProps) {
  return (
    <main
      style={{
        background: 'var(--bg)',
        color: 'var(--fg)',
        padding: '20px 36px 56px',
        minHeight: '100%',
        ...style,
      }}
    >
      <div style={{ maxWidth, margin: '0 auto' }}>
        <TopBar path={path} tab={tab} lang={lang} />
        {children}
      </div>
    </main>
  )
}
