import Link from 'next/link'

interface NavProps {
  lang?: 'en' | 'ko'
}

export default function Nav({ lang = 'en' }: NavProps) {
  const isKo = lang === 'ko'
  const home = isKo ? '/ko' : '/'

  return (
    <nav
      className="backdrop-blur-sm sticky top-0 z-50"
      style={{ borderBottom: '1px solid var(--border)', background: 'rgba(11, 15, 25, 0.8)' }}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href={home}
          className="text-lg font-bold transition-colors"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          <span style={{ color: 'var(--accent)' }}>DCA</span>ify
        </Link>
        <div className="flex items-center gap-3 sm:gap-5 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link href={home} className="hidden sm:block hover:text-[var(--text)] transition-colors">
            {isKo ? '코인 목록' : 'Coins'}
          </Link>
          <Link href="/blog" className="hover:text-[var(--text)] transition-colors">
            {isKo ? '블로그' : 'Blog'}
          </Link>
          <Link href="/about" className="hidden sm:block hover:text-[var(--text)] transition-colors">
            {isKo ? '소개' : 'About'}
          </Link>
          {isKo ? (
            <Link
              href="/"
              className="text-xs px-2 py-1 transition-colors"
              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
            >
              EN
            </Link>
          ) : (
            <Link
              href="/ko"
              className="text-xs px-2 py-1 transition-colors"
              style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
            >
              한국어
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
