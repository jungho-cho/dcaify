import Link from 'next/link'

interface NavProps {
  lang?: 'en' | 'ko'
}

export default function Nav({ lang = 'en' }: NavProps) {
  const isKo = lang === 'ko'
  const home = isKo ? '/ko' : '/'

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={home} className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
          DCAify
        </Link>
        <div className="flex items-center gap-5 text-sm text-gray-400">
          <Link href={home} className="hover:text-white transition-colors">
            {isKo ? '코인 목록' : 'Coins'}
          </Link>
          <Link href="/blog" className="hover:text-white transition-colors">
            {isKo ? '블로그' : 'Blog'}
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            {isKo ? '소개' : 'About'}
          </Link>
          {/* Language switcher */}
          {isKo ? (
            <Link href="/" className="text-xs px-2 py-1 rounded border border-gray-700 hover:border-blue-500 transition-colors">
              EN
            </Link>
          ) : (
            <Link href="/ko" className="text-xs px-2 py-1 rounded border border-gray-700 hover:border-blue-500 transition-colors">
              한국어
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
