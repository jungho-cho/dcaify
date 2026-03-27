'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SUPPORTED_COINS } from '@/lib/coins'
import Nav from '@/components/Nav'

const TOP_COINS = SUPPORTED_COINS.slice(0, 12)

export default function KoHome() {
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
      <Nav lang="ko" />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mt-12 mb-4">
            DCAify — 암호화폐 적립식 투자 계산기
          </h1>
          <p className="text-lg text-gray-400 text-center mb-10">
            비트코인, 이더리움, 솔라나 등 29개 이상의 암호화폐에 적립식 투자했다면 지금 얼마일까요?
          </p>

          <div className="max-w-md mx-auto mb-10">
            <input
              type="text"
              placeholder="코인 검색... (예: Bitcoin, ETH, 솔라나)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((coin) => (
              <Link
                key={coin.slug}
                href={`/ko/${coin.slug}`}
                className="flex flex-col items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 p-4 transition hover:border-blue-500 hover:bg-gray-800"
              >
                <span className="text-xl font-semibold">{coin.symbol}</span>
                <span className="text-sm text-gray-400">{coin.name}</span>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-gray-500 mt-8">
              &quot;{query}&quot;에 해당하는 코인이 없습니다
            </p>
          )}

          <section className="mt-16 space-y-6 text-gray-400 text-sm leading-relaxed">
            <h2 className="text-xl font-semibold text-white">적립식 투자(DCA)란?</h2>
            <p>
              적립식 투자(Dollar Cost Averaging, DCA)는 자산의 가격에 관계없이 정해진 금액을
              주기적으로 투자하는 전략입니다. 시장 타이밍을 맞추려는 스트레스 없이 장기적으로
              자산을 축적할 수 있는 검증된 투자 방법입니다.
            </p>

            <h2 className="text-xl font-semibold text-white">DCAify 사용법</h2>
            <p>
              원하는 암호화폐를 선택하고, 투자 금액과 주기를 설정한 뒤, 기간을 지정하면
              과거 데이터를 기반으로 투자 수익을 즉시 확인할 수 있습니다. 바이낸스의 실제
              가격 데이터를 사용합니다.
            </p>

            <h2 className="text-xl font-semibold text-white">주요 기능</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>29개 이상 암호화폐 지원 (바이낸스 실시간 가격)</li>
              <li>일별, 주별, 월별 투자 주기 선택</li>
              <li>최대 10년 과거 백테스팅</li>
              <li>손익분기점 분석</li>
              <li>한국 암호화폐 양도소득세 분석 (22%, 250만원 기본공제)</li>
              <li>코인 간 비교 계산기</li>
            </ul>

            <div className="flex flex-wrap gap-3 pt-4">
              <Link href="/ko/blog" className="text-blue-400 hover:underline">DCA 가이드 읽기 →</Link>
              <Link href="/ko/btc/guide" className="text-blue-400 hover:underline">비트코인 적립식 투자 가이드 →</Link>
              <Link href="/ko/eth/guide" className="text-blue-400 hover:underline">이더리움 적립식 투자 가이드 →</Link>
              <Link href="/ko/btc/tax" className="text-blue-400 hover:underline">비트코인 세금 분석 →</Link>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
