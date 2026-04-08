'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import NoResultsRecovery from '@/components/NoResultsRecovery'
import { trackEvent } from '@/lib/analytics'
import { SUPPORTED_COINS } from '@/lib/coins'

const TOP_COINS = SUPPORTED_COINS.slice(0, 12)

const COPY = {
  en: {
    title: 'See what consistent crypto buys would be worth today',
    subtitle:
      'Backtest 29 coins with real Binance daily closes, clear result explanations, and Korean tax-aware scenarios.',
    placeholder: 'Search by coin name or ticker, e.g. Bitcoin, ETH, Solana',
    trust: ['29 supported coins', 'Real Binance daily closes', 'Results explained in plain English'],
    featuredLinks: [
      { href: '/btc', label: 'Start with Bitcoin' },
      { href: '/eth', label: 'Try Ethereum' },
      { href: '/btc-vs-eth', label: 'Compare BTC vs ETH' },
    ],
    sectionTitle: 'Pick a coin and run the backtest',
    sectionDescription:
      'Start with a major asset, or search by ticker. The goal is not to browse forever. It is to answer one investing question quickly.',
    bodyTitle: 'Why people use DCAify',
    bodyText:
      'Most DCA calculators stop at a number. DCAify shows the number, explains what it means, and keeps the assumptions visible so the result feels trustworthy, not mysterious.',
    featuredTitle: 'Useful starting points',
    featuredDescription:
      'If you are not sure where to start, run a Bitcoin backtest, compare BTC vs ETH, or check the Korean tax scenario page.',
    recoverySuggestions: [
      { href: '/btc', label: 'Bitcoin calculator' },
      { href: '/eth', label: 'Ethereum calculator' },
      { href: '/btc-vs-eth', label: 'BTC vs ETH comparison' },
    ],
  },
  ko: {
    title: '지금까지 적립식으로 샀다면 얼마가 됐는지 바로 확인하세요',
    subtitle:
      '29개 코인의 실제 바이낸스 일별 종가를 바탕으로, 수익 계산과 해석, 한국어 세금 시나리오까지 한 번에 보여줍니다.',
    placeholder: '코인 이름이나 심볼로 검색하세요. 예: Bitcoin, ETH, 솔라나',
    trust: ['29개 코인 지원', '실제 바이낸스 일별 종가 사용', '결과 해석과 세금 시나리오 제공'],
    featuredLinks: [
      { href: '/ko/btc', label: '비트코인부터 시작' },
      { href: '/ko/eth', label: '이더리움 계산' },
      { href: '/btc-vs-eth', label: 'BTC vs ETH 비교 (영문)' },
    ],
    sectionTitle: '원하는 코인을 골라 바로 계산하세요',
    sectionDescription:
      '코인 목록을 구경하는 페이지가 아니라, 투자 질문 하나에 바로 답하는 도구로 설계했습니다.',
    bodyTitle: '왜 DCAify를 쓰나요?',
    bodyText:
      '대부분의 계산기는 숫자만 보여줍니다. DCAify는 그 숫자가 왜 나왔는지, 어떤 전제를 썼는지, 한국 사용자에게 어떤 의미인지까지 같이 보여주려고 합니다.',
    featuredTitle: '한국어 사용자에게 특히 유용한 시작점',
    featuredDescription:
      '비트코인 계산부터 시작하거나, 한글 가이드와 예상 세금 시나리오 페이지로 바로 들어가세요. 비교 페이지는 현재 영문으로 제공됩니다.',
    recoverySuggestions: [
      { href: '/ko/btc', label: '비트코인 계산기' },
      { href: '/ko/eth', label: '이더리움 계산기' },
      { href: '/ko/btc/tax', label: '비트코인 세금 시나리오' },
    ],
  },
} as const

interface CoinExplorerHomeProps {
  lang?: 'en' | 'ko'
}

export default function CoinExplorerHome({ lang = 'en' }: CoinExplorerHomeProps) {
  const [query, setQuery] = useState('')
  const trackedNoResultsQuery = useRef<string | null>(null)
  const copy = COPY[lang]

  const filtered = useMemo(() => {
    if (!query.trim()) return TOP_COINS

    const normalized = query.toLowerCase()
    return SUPPORTED_COINS.filter(
      (coin) =>
        coin.name.toLowerCase().includes(normalized) ||
        coin.symbol.toLowerCase().includes(normalized) ||
        coin.slug.toLowerCase().includes(normalized),
    )
  }, [query])

  useEffect(() => {
    if (!query.trim() || filtered.length > 0) {
      trackedNoResultsQuery.current = null
      return
    }

    if (trackedNoResultsQuery.current === query) return
    trackedNoResultsQuery.current = query
    trackEvent('search_no_results', { lang, query: query.trim() })
  }, [filtered.length, lang, query])

  const basePath = lang === 'ko' ? '/ko' : ''

  return (
    <>
      <Nav lang={lang} />
      <main className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          <section className="space-y-6">
            <div className="space-y-3 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>
                {lang === 'ko' ? 'Crypto DCA backtesting tool' : 'Crypto DCA backtesting tool'}
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {copy.title}
              </h1>
              <p className="text-base sm:text-lg" style={{ color: 'var(--text-muted)' }}>
                {copy.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {copy.trust.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 text-xs font-medium"
                  style={{
                    borderRadius: '999px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.18)',
                    color: 'var(--text)',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-start">
              <input
                type="text"
                placeholder={copy.placeholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                }}
              />
              <div className="flex flex-wrap gap-2">
                {copy.featuredLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-3 text-sm font-medium"
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 space-y-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                {copy.sectionTitle}
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {copy.sectionDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((coin, index) => {
                const isTop = !query.trim() && index < 3
                const href = `${basePath}/${coin.slug}`

                return (
                  <Link
                    key={coin.slug}
                    href={href}
                    onClick={() => trackEvent('coin_entry_click', { lang, coin: coin.slug, source: query.trim() ? 'search' : 'grid' })}
                    className="flex flex-col items-start gap-2 p-4 transition"
                    style={{
                      background: isTop ? 'rgba(56, 189, 248, 0.05)' : 'var(--surface)',
                      border: `1px solid ${isTop ? 'rgba(56, 189, 248, 0.2)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <span className="font-bold text-lg" style={{ color: isTop ? 'var(--accent)' : 'var(--text)' }}>
                      {coin.symbol}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {coin.name}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      {coin.category}
                    </span>
                  </Link>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div>
                <NoResultsRecovery
                  lang={lang}
                  query={query.trim()}
                  suggestions={copy.recoverySuggestions}
                  onSuggestionClick={(href) => trackEvent('search_recovery_click', { lang, href, query: query.trim() })}
                />
              </div>
            )}
          </section>

          <section className="mt-14 grid gap-6 lg:grid-cols-2">
            <div
              className="space-y-3"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
              }}
            >
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                {copy.bodyTitle}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {copy.bodyText}
              </p>
            </div>

            <div
              className="space-y-3"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
              }}
            >
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                {copy.featuredTitle}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {copy.featuredDescription}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                {copy.recoverySuggestions.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => trackEvent('search_recovery_click', { lang, href: item.href })}
                    className="hover:underline text-sm"
                    style={{ color: 'var(--accent)' }}
                  >
                    {item.label} →
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
