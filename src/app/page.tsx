'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SUPPORTED_COINS } from '@/lib/coins'

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
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mt-12 mb-4">
          DCAify — Crypto DCA Calculator
        </h1>
        <p className="text-lg text-gray-400 text-center mb-10">
          See exactly how much you&apos;d have if you dollar cost averaged into
          crypto.
        </p>

        <div className="max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Search coins..."
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
      </div>
    </main>
  )
}
