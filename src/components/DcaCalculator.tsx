'use client'

import { useState, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { CoinConfig } from '@/lib/coins'
import { PricesResponse } from '@/types/prices'
import { calculateDca, calculateBreakEven, Frequency, DcaResult } from '@/lib/dca'
import { Lang, getStrings } from '@/lib/strings'

interface Props {
  defaultCoin: CoinConfig
  lang?: Lang
  relatedCoins?: CoinConfig[]
}

type UiState = 'initial' | 'loading' | 'success' | 'error' | 'rate_limited'

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n)
}

function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

// Design system tokens (from DESIGN.md)
const ds = {
  surface: '#141926',
  border: '#1E293B',
  textMuted: '#64748B',
  textFaint: '#475569',
  accent: '#38BDF8',
  accentHover: '#0EA5E9',
  profit: '#34D399',
  profitBg: 'rgba(6, 78, 59, 0.25)',
  profitStroke: '#10B981',
  loss: '#F87171',
  lossBg: 'rgba(69, 10, 10, 0.25)',
  lossStroke: '#EF4444',
  grid: '#1E293B',
  tooltipBg: '#141926',
}

export default function DcaCalculator({ defaultCoin, lang = 'en', relatedCoins }: Props) {
  const s = getStrings(lang)
  const coin = defaultCoin

  const [amount, setAmount] = useState('100')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [startDate, setStartDate] = useState(() => {
    return coin.listingDate > '2020-01-01' ? coin.listingDate : '2020-01-01'
  })
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))

  const [uiState, setUiState] = useState<UiState>('initial')
  const [result, setResult] = useState<DcaResult | null>(null)
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'stale'>('cache')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [partialWarning, setPartialWarning] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const validate = (): string | null => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return s.invalidAmount
    const today = new Date().toISOString().slice(0, 10)
    if (startDate > today) return s.startInFuture
    if (endDate > today) return s.endInFuture
    if (startDate >= endDate) return s.endBeforeStart
    const startYear = new Date(startDate).getFullYear()
    const endYear = new Date(endDate).getFullYear()
    if (endYear - startYear > 10) return s.maxRange
    if (startDate < coin.listingDate) return s.listingDateError(coin.name, coin.listingDate)
    return null
  }

  const handleCalculate = useCallback(async () => {
    setValidationError(null)
    setPartialWarning(null)
    setErrorMsg(null)
    const err = validate()
    if (err) { setValidationError(err); return }
    setUiState('loading')
    try {
      const params = new URLSearchParams({ coinId: coin.id, from: startDate, to: endDate })
      const res = await fetch(`/api/prices?${params}`)
      if (res.status === 429) { setUiState('rate_limited'); return }
      if (!res.ok) { setErrorMsg(s.fetchError); setUiState('error'); return }
      const data: PricesResponse = await res.json()
      setDataSource(data.dataSource)
      if (data.prices.length === 0) { setErrorMsg(s.noData); setUiState('error'); return }
      const firstPriceDate = new Date(data.prices[0].timestamp).toISOString().slice(0, 10)
      if (firstPriceDate > startDate) setPartialWarning(s.partialWarning(coin.name, firstPriceDate))
      const currentPrice = data.prices[data.prices.length - 1].price
      const dcaResult = calculateDca({ prices: data.prices, amountPerPeriod: parseFloat(amount), frequency, startDate, endDate, currentPrice })
      setResult(dcaResult)
      setUiState('success')
    } catch { setErrorMsg(s.genericError); setUiState('error') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coin, amount, frequency, startDate, endDate, lang])

  const chartData = result
    ? (() => {
        const pricePerCoin = result.totalCoins > 0 ? result.currentValue / result.totalCoins : 0
        let cumulativeCoins = 0
        let cumulativeInvested = 0
        return result.purchases.map((p) => {
          cumulativeCoins += p.coins
          cumulativeInvested += p.amount
          return { date: p.date, value: parseFloat((cumulativeCoins * pricePerCoin).toFixed(2)), invested: parseFloat(cumulativeInvested.toFixed(2)) }
        })
      })()
    : []

  const breakEven = result && result.totalCoins > 0
    ? calculateBreakEven(result.totalInvested, result.totalCoins, lang === 'ko' ? 0.22 : 0)
    : null

  const isProfit = result && result.roi >= 0
  const today = new Date().toISOString().slice(0, 10)
  const isHistorical = endDate < today
  const shareText = result ? s.shareText(coin.name, formatUsd(parseFloat(amount)), s[frequency], formatPct(result.roi), formatUsd(result.currentValue)) : ''
  const langPrefix = lang === 'ko' ? '/ko' : ''

  const inputClass = "w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40"

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          {coin.name} DCA {lang === 'ko' ? '계산기' : 'Calculator'}
        </h1>
        <p style={{ color: ds.textMuted, fontSize: '0.875rem' }}>{s.tagline(coin.name)}</p>
      </div>

      {/* Form */}
      <div className="p-5 space-y-4" style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>{s.investmentLabel}</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)}
              className={inputClass} placeholder="100"
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>{s.frequencyLabel}</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}
              className={inputClass}
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}>
              <option value="daily">{s.daily}</option>
              <option value="weekly">{s.weekly}</option>
              <option value="monthly">{s.monthly}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>{s.startDate}</label>
            <input type="date" value={startDate} min={coin.listingDate} max={endDate} onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>{s.endDate}</label>
            <input type="date" value={endDate} min={startDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)', color: 'var(--text)' }} />
          </div>
        </div>

        {validationError && <p className="text-sm" style={{ color: ds.loss }}>{validationError}</p>}

        <button onClick={handleCalculate} disabled={uiState === 'loading'}
          className="w-full font-semibold py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: ds.accent, color: '#0B0F19', borderRadius: 'var(--radius-lg)' }}>
          {uiState === 'loading' ? s.calculating : s.calculateBtn}
        </button>
      </div>

      {/* Initial state */}
      {uiState === 'initial' && (
        <div className="p-8 text-center border-dashed" style={{ border: `1px dashed ${ds.border}`, borderRadius: 'var(--radius-lg)', color: ds.textFaint }}>
          <p className="text-sm">
            {lang === 'ko'
              ? `위 설정을 확인하고 "DCA 수익 계산하기"를 눌러 ${coin.name} 적립식 투자 수익을 확인하세요.`
              : `Set your preferences above and hit "Calculate" to see your ${coin.name} DCA returns.`}
          </p>
        </div>
      )}

      {/* Skeleton loading */}
      {uiState === 'loading' && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28" style={{ background: ds.surface, borderRadius: 'var(--radius-lg)' }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20" style={{ background: ds.surface, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
          <div className="h-64" style={{ background: ds.surface, borderRadius: 'var(--radius-lg)' }} />
        </div>
      )}

      {/* Alerts */}
      {uiState === 'rate_limited' && (
        <div className="p-4 text-sm" style={{ background: ds.lossBg, border: `1px solid ${ds.loss}40`, borderRadius: 'var(--radius-lg)', color: ds.loss }}>
          {s.rateLimited}
        </div>
      )}
      {uiState === 'error' && errorMsg && (
        <div className="p-4 text-sm" style={{ background: ds.lossBg, border: `1px solid ${ds.loss}40`, borderRadius: 'var(--radius-lg)', color: ds.loss }}>
          {errorMsg}
        </div>
      )}
      {uiState === 'success' && dataSource === 'stale' && (
        <div className="p-4 text-sm" style={{ background: 'rgba(251, 191, 36, 0.1)', border: `1px solid ${ds.textFaint}`, borderRadius: 'var(--radius-lg)', color: '#FBBF24' }}>
          {s.staleWarning}
        </div>
      )}
      {partialWarning && (
        <div className="p-4 text-sm" style={{ background: 'rgba(251, 191, 36, 0.1)', border: `1px solid ${ds.textFaint}`, borderRadius: 'var(--radius-lg)', color: '#FBBF24' }}>
          {partialWarning}
        </div>
      )}

      {/* Results */}
      {uiState === 'success' && result && (
        <div className="space-y-4">
          {/* Hero ROI */}
          <div className="p-6 text-center"
            style={{ background: isProfit ? ds.profitBg : ds.lossBg, border: `1px solid ${isProfit ? ds.profit : ds.loss}30`, borderRadius: 'var(--radius-lg)' }}>
            <p className="text-sm mb-1" style={{ color: ds.textMuted }}>{s.returnLabel}</p>
            <p className="text-4xl sm:text-5xl font-bold tabular-nums" style={{ color: isProfit ? ds.profit : ds.loss, fontFamily: 'var(--font-display)' }}>
              {formatPct(result.roi)}
            </p>
            <p className="text-sm mt-2 tabular-nums" style={{ color: ds.textMuted }}>
              {formatUsd(result.totalInvested)} → {formatUsd(result.currentValue)}
            </p>
          </div>

          {/* Detail cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: s.totalInvested, value: formatUsd(result.totalInvested) },
              { label: isHistorical ? (lang === 'ko' ? '종료일 가치' : 'Value at End Date') : s.currentValue, value: formatUsd(result.currentValue) },
              { label: `${coin.symbol} ${s.accumulated}`, value: result.totalCoins.toFixed(6) },
              { label: lang === 'ko' ? '매수 횟수' : 'Purchases', value: String(result.purchases.length) },
            ].map((card, i) => (
              <div key={i} className="p-4" style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)' }}>
                <p className="text-xs mb-1" style={{ color: ds.textMuted }}>{card.label}</p>
                <p className="text-lg font-bold tabular-nums">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="p-4" style={{ borderRadius: 'var(--radius-lg)' }}>
              <h3 className="text-sm mb-4" style={{ color: ds.textMuted }}>{s.chartTitle}</h3>
              <ResponsiveContainer width="100%" height={240} className="sm:!h-[288px]">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ds.grid} />
                  <XAxis dataKey="date" tick={{ fill: ds.textMuted, fontSize: 11 }} tickFormatter={(v: string) => v.slice(0, 7)} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: ds.textMuted, fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} width={55} />
                  <Tooltip contentStyle={{ backgroundColor: ds.tooltipBg, border: `1px solid ${ds.border}`, borderRadius: 8 }} labelStyle={{ color: ds.textMuted }}
                    formatter={(value, name) => [formatUsd(Number(value)), name === 'value' ? s.portfolioValue : s.totalInvested]} />
                  <Area type="monotone" dataKey="invested" stroke={ds.textFaint} fill={ds.surface} strokeWidth={1} />
                  <Area type="monotone" dataKey="value" stroke={isProfit ? ds.profitStroke : ds.lossStroke} fill={isProfit ? 'rgba(6, 78, 59, 0.3)' : 'rgba(69, 10, 10, 0.3)'} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Break-even */}
          {breakEven && (
            <div className="p-4" style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)' }}>
              <h3 className="text-sm mb-3" style={{ color: ds.textMuted }}>{s.breakEvenTitle}</h3>
              <div className={`grid ${lang === 'ko' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div>
                  <p className="text-xs" style={{ color: ds.textFaint }}>{s.breakEvenPrice}</p>
                  <p className="text-base font-semibold tabular-nums">{formatUsd(breakEven.breakEvenPrice)}</p>
                </div>
                {lang === 'ko' && (
                  <div>
                    <p className="text-xs" style={{ color: ds.textFaint }}>{s.breakEvenWithTax}</p>
                    <p className="text-base font-semibold tabular-nums">{formatUsd(breakEven.breakEvenWithTax)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Share */}
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
            className="block text-center text-sm font-medium py-3 transition-colors"
            style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)', color: 'var(--text)' }}>
            {s.shareBtn}
          </a>
        </div>
      )}

      {/* Related coins */}
      {relatedCoins && relatedCoins.length > 0 && (
        <div className="p-4" style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)' }}>
          <h3 className="text-sm mb-3" style={{ color: ds.textMuted }}>{lang === 'ko' ? '다른 코인 DCA 계산기' : 'Other DCA Calculators'}</h3>
          <div className="flex gap-2 flex-wrap">
            {relatedCoins.map((c) => (
              <a key={c.id} href={`${langPrefix}/${c.slug}`}
                className="px-3 py-1.5 text-sm font-medium transition-colors"
                style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)', color: ds.textMuted }}>
                {c.symbol}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
