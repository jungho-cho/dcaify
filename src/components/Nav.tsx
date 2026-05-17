import TopBar from '@/components/terminal/TopBar'

interface NavProps {
  lang?: 'en' | 'ko'
}

/**
 * Legacy entry point — renders the Terminal `TopBar` inside the page padding.
 * New pages should use `<PageShell>` directly instead of `<Nav />`.
 */
export default function Nav({ lang }: NavProps) {
  return (
    <header style={{ background: 'var(--bg)', padding: '20px 36px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <TopBar lang={lang} />
      </div>
    </header>
  )
}
