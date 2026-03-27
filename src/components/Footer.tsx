'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  const isKo = pathname.startsWith('/ko')

  return (
    <footer
      className="py-6 text-center text-xs mt-auto"
      style={{ borderTop: '1px solid var(--border)', color: 'var(--text-faint)' }}
    >
      <div className="flex justify-center gap-4 mb-2">
        <Link href={isKo ? '/ko/about' : '/about'} className="hover:text-[var(--text-muted)]">
          {isKo ? '소개' : 'About'}
        </Link>
        <Link href={isKo ? '/ko/privacy' : '/privacy'} className="hover:text-[var(--text-muted)]">
          {isKo ? '개인정보처리방침' : 'Privacy'}
        </Link>
        <Link href={isKo ? '/ko/blog' : '/blog'} className="hover:text-[var(--text-muted)]">
          {isKo ? '블로그' : 'Blog'}
        </Link>
      </div>
      <p>&copy; {new Date().getFullYear()} DCAify. {isKo ? '투자 조언이 아닙니다.' : 'Not financial advice.'}</p>
    </footer>
  )
}
