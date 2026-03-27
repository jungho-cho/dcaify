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
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mt-12 mb-4">
            DCAify — Crypto DCA Calculator
          </h1>
          <p className="text-lg text-gray-400 text-center mb-10">
            See exactly how much you&apos;d have if you dollar cost averaged into
            crypto. Track returns for Bitcoin, Ethereum, Solana, and 25+ coins.
          </p>

          <div className="max-w-md mx-auto mb-10">
            <input
              type="text"
              placeholder="Search coins... (e.g. Bitcoin, ETH, Solana)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((coin) => (
              <Link
                key={coin.slug}
                href={`/${coin.slug}`}
                className="flex flex-col items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 p-4 transition hover:border-blue-500 hover:bg-gray-800"
              >
                <span className="text-xl font-semibold">{coin.symbol}</span>
                <span className="text-sm text-gray-400">{coin.name}</span>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-gray-500 mt-8">
              No coins found matching &quot;{query}&quot;
            </p>
          )}

          {/* SEO content — visible to crawlers, helpful to users */}
          <section className="mt-16 space-y-6 text-gray-400 text-sm leading-relaxed">
            <h2 className="text-xl font-semibold text-white">What is Dollar Cost Averaging?</h2>
            <p>
              Dollar cost averaging (DCA) is an investment strategy where you invest a fixed
              amount of money at regular intervals — weekly, biweekly, or monthly — regardless
              of the asset&apos;s current price. This approach removes the stress of trying to time
              the market and has historically proven effective for long-term wealth building in
              volatile markets like cryptocurrency.
            </p>

            <h2 className="text-xl font-semibold text-white">How DCAify Works</h2>
            <p>
              Choose any of our supported cryptocurrencies, set your investment amount and
              frequency, pick a historical date range, and instantly see your results.
              DCAify uses real price data from Binance to calculate your total invested amount,
              portfolio value, return percentage, and a visual chart of your portfolio growth
              over time.
            </p>

            <h2 className="text-xl font-semibold text-white">Features</h2>
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
              <Link href="/blog" className="text-blue-400 hover:underline">Read our DCA guides →</Link>
              <Link href="/btc/guide" className="text-blue-400 hover:underline">Bitcoin DCA Guide →</Link>
              <Link href="/eth/guide" className="text-blue-400 hover:underline">Ethereum DCA Guide →</Link>
              <Link href="/btc-vs-eth" className="text-blue-400 hover:underline">BTC vs ETH Comparison →</Link>
            </div>
          </section>

        </div>
      </main>
    </>
  )
}
