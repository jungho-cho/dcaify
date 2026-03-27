'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SUPPORTED_COINS } from '@/lib/coins'
import Nav from '@/components/Nav'

const TOP_COINS = SUPPORTED_COINS.slice(0, 12)

export default function Home() {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? SUPPORTED_COINS.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.symbol.toLowerCase().includes(query.toLowerCase()),
      )
    : TOP_COINS

  return (
    <>
      <Nav />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-center mt-12 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            <span style={{ color: 'var(--accent)' }}>DCA</span>ify
          </h1>
          <p className="text-xl text-center mb-2" style={{ color: 'var(--text)' }}>
            What if you had invested $100/month in crypto?
          </p>
          <p className="text-sm text-center mb-10" style={{ color: 'var(--text-faint)' }}>
            Calculate returns for 29+ coins with real Binance price data
          </p>

          <div className="max-w-md mx-auto mb-10">
            <input
              type="text"
              placeholder="Search coins... (e.g. Bitcoin, ETH, Solana)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((coin, i) => {
              const isTop = !query.trim() && i < 3
              return (
                <Link
                  key={coin.slug}
                  href={`/${coin.slug}`}
                  className="flex flex-col items-center gap-1 p-4 transition"
                  style={{
                    background: isTop ? 'rgba(56, 189, 248, 0.05)' : 'var(--surface)',
                    border: `1px solid ${isTop ? 'rgba(56, 189, 248, 0.2)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <span className="font-bold" style={{ fontSize: isTop ? '1.5rem' : '1.125rem', color: isTop ? 'var(--accent)' : 'var(--text)' }}>
                    {coin.symbol}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{coin.name}</span>
                  {isTop && <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{coin.category}</span>}
                </Link>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-center mt-8" style={{ color: 'var(--text-faint)' }}>
              No coins found matching &quot;{query}&quot;
            </p>
          )}

          <section className="mt-16 space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>What is Dollar Cost Averaging?</h2>
            <p>
              Dollar cost averaging (DCA) is an investment strategy where you invest a fixed
              amount of money at regular intervals, regardless of the asset&apos;s current price.
              This approach removes the stress of trying to time the market and has historically
              proven effective for long-term wealth building in volatile markets like cryptocurrency.
            </p>

            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>How DCAify Works</h2>
            <p>
              Choose any of our supported cryptocurrencies, set your investment amount and
              frequency, pick a historical date range, and instantly see your results.
              DCAify uses real price data from Binance to calculate your total invested amount,
              portfolio value, return percentage, and a visual chart of your portfolio growth.
            </p>

            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Features</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>29+ supported cryptocurrencies with real Binance price data</li>
              <li>Daily, weekly, and monthly DCA frequency options</li>
              <li>Up to 10 years of historical backtesting</li>
              <li>Break-even price analysis</li>
              <li>Korean tax analysis (22% capital gains tax with 2.5M KRW deduction)</li>
              <li>Side-by-side coin comparison calculator</li>
              <li>Available in English and Korean</li>
            </ul>

            <div className="flex flex-wrap gap-3 pt-4">
              <Link href="/blog" className="hover:underline" style={{ color: 'var(--accent)' }}>Read our DCA guides →</Link>
              <Link href="/btc/guide" className="hover:underline" style={{ color: 'var(--accent)' }}>Bitcoin DCA Guide →</Link>
              <Link href="/eth/guide" className="hover:underline" style={{ color: 'var(--accent)' }}>Ethereum DCA Guide →</Link>
              <Link href="/btc-vs-eth" className="hover:underline" style={{ color: 'var(--accent)' }}>BTC vs ETH Comparison →</Link>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
