'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import ComparisonSummary from '@/components/ComparisonSummary'
import { trackEvent } from '@/lib/analytics'
import { getCalculatorErrorMessage } from '@/lib/calculator-errors'
import { calculateDca, type DcaResult, type Frequency } from '@/lib/dca'
import { formatPct, formatUsd } from '@/lib/formatters'
import type { CoinConfig } from '@/lib/coins'
import { fetchPricesForRange } from '@/lib/prices-client'
import {
  buildComparisonVerdict,
  isSameCoinComparison,
  normalizeComparisonStartDate,
} from '@/lib/result-interpretation'

interface ComparisonCalculatorProps {
  leftCoin: CoinConfig
  rightCoin: CoinConfig
}

interface ComparisonLeg {
  coin: CoinConfig
  result: DcaResult | null
  error: string | null
}

const ds = {
  surface: '#141926',
  border: '#1E293B',
  textMuted: '#64748B',
  textFaint: '#475569',
  accent: '#38BDF8',
  profit: '#34D399',
  loss: '#F87171',
}

function ComparisonResultCard({ coin, result }: { coin: CoinConfig; result: DcaResult | null }) {
  if (!result) return null

  const isProfit = result.roi >= 0
  return (
    <div
      className="space-y-3 p-4"
      style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)' }}
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {coin.name}
        </h3>
        <p className="text-sm" style={{ color: ds.textMuted }}>
          {coin.symbol} shared-window result
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p style={{ color: ds.textFaint }}>Return</p>
          <p className="font-semibold" style={{ color: isProfit ? ds.profit : ds.loss }}>
            {formatPct(result.roi)}
          </p>
        </div>
        <div>
          <p style={{ color: ds.textFaint }}>Ending value</p>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>
            {formatUsd(result.currentValue)}
          </p>
        </div>
        <div>
          <p style={{ color: ds.textFaint }}>Total invested</p>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>
            {formatUsd(result.totalInvested)}
          </p>
        </div>
        <div>
          <p style={{ color: ds.textFaint }}>Purchases</p>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>
            {result.purchases.length}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ComparisonCalculator({ leftCoin, rightCoin }: ComparisonCalculatorProps) {
  const [amount, setAmount] = useState('100')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [startDate, setStartDate] = useState('2020-01-01')
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [legs, setLegs] = useState<[ComparisonLeg, ComparisonLeg]>([
    { coin: leftCoin, result: null, error: null },
    { coin: rightCoin, result: null, error: null },
  ])
  const [uiState, setUiState] = useState<'initial' | 'loading' | 'success' | 'partial' | 'error'>('initial')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [partialMessage, setPartialMessage] = useState<string | null>(null)

  const normalizedWindow = useMemo(
    () => normalizeComparisonStartDate(startDate, leftCoin.listingDate, rightCoin.listingDate),
    [leftCoin.listingDate, rightCoin.listingDate, startDate],
  )

  const verdict =
    uiState === 'success' && legs[0].result && legs[1].result
      ? buildComparisonVerdict({ left: legs[0].result, right: legs[1].result })
      : null

  const validate = () => {
    const parsedAmount = parseFloat(amount)
    const today = new Date().toISOString().slice(0, 10)

    if (isNaN(parsedAmount) || parsedAmount <= 0) return 'Enter an amount greater than zero.'
    if (startDate >= endDate) return 'Choose an end date after the start date.'
    if (endDate > today) return 'End date must be in the past.'
    if (isSameCoinComparison(leftCoin.slug, rightCoin.slug)) return 'Choose two different coins to compare.'

    return null
  }

  const handleCompare = async () => {
    setValidationError(null)
    setPartialMessage(null)

    const error = validate()
    if (error) {
      setValidationError(error)
      return
    }

    setUiState('loading')
    trackEvent('comparison_submit', {
      left_coin: leftCoin.slug,
      right_coin: rightCoin.slug,
      frequency,
    })

    const effectiveStartDate = normalizedWindow.effectiveStartDate
    const responses = await Promise.all([
      fetchPricesForRange({ coinId: leftCoin.id, from: effectiveStartDate, to: endDate }),
      fetchPricesForRange({ coinId: rightCoin.id, from: effectiveStartDate, to: endDate }),
    ])

    const nextLegs: [ComparisonLeg, ComparisonLeg] = [
      { coin: leftCoin, result: null, error: null },
      { coin: rightCoin, result: null, error: null },
    ]

    responses.forEach((response, index) => {
      if (!response.ok) {
        nextLegs[index].error = getCalculatorErrorMessage(response.category, 'en', response.payload)
        return
      }

      if (response.data.prices.length === 0) {
        nextLegs[index].error = getCalculatorErrorMessage('no_data', 'en')
        return
      }

      const currentPrice = response.data.prices[response.data.prices.length - 1].price
      nextLegs[index].result = calculateDca({
        prices: response.data.prices,
        amountPerPeriod: parseFloat(amount),
        frequency,
        startDate: effectiveStartDate,
        endDate,
        currentPrice,
      })
    })

    setLegs(nextLegs)

    const successes = nextLegs.filter((leg) => leg.result)
    if (successes.length === 2) {
      setUiState('success')
      trackEvent('comparison_success', {
        left_coin: leftCoin.slug,
        right_coin: rightCoin.slug,
      })
      return
    }

    if (successes.length === 1) {
      setUiState('partial')
      const failedCoin = nextLegs.find((leg) => !leg.result)?.coin.name
      const successfulCoin = nextLegs.find((leg) => leg.result)?.coin.name
      const message = `${successfulCoin} loaded successfully, but ${failedCoin} did not. We are showing the good leg and hiding the verdict.`
      setPartialMessage(message)
      trackEvent('comparison_partial', {
        left_coin: leftCoin.slug,
        right_coin: rightCoin.slug,
      })
      return
    }

    setUiState('error')
    trackEvent('comparison_error', {
      left_coin: leftCoin.slug,
      right_coin: rightCoin.slug,
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {leftCoin.name} vs {rightCoin.name} DCA Comparison
        </h1>
        <p style={{ color: ds.textMuted }}>
          Use one set of assumptions, then see which asset handled that exact DCA plan better.
        </p>
      </div>

      <div className="space-y-4 p-5" style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>Investment per period (USD)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)' }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>Frequency</label>
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as Frequency)}
              className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)' }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>Requested start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              max={endDate}
              className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)' }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              min={startDate}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)' }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs" style={{ color: ds.textFaint }}>
          <span>{leftCoin.symbol} listed {leftCoin.listingDate}</span>
          <span>•</span>
          <span>{rightCoin.symbol} listed {rightCoin.listingDate}</span>
          {normalizedWindow.normalized && (
            <>
              <span>•</span>
              <span>Shared window starts on {normalizedWindow.effectiveStartDate}</span>
            </>
          )}
        </div>

        {validationError && <p className="text-sm" style={{ color: ds.loss }}>{validationError}</p>}

        <button
          onClick={handleCompare}
          disabled={uiState === 'loading'}
          className="w-full font-semibold py-3 disabled:opacity-50"
          style={{ background: ds.accent, color: '#0B0F19', borderRadius: 'var(--radius-lg)' }}
        >
          {uiState === 'loading' ? 'Comparing…' : 'Compare this DCA plan'}
        </button>
      </div>

      {uiState === 'initial' && (
        <div className="p-8 text-center border-dashed" style={{ border: `1px dashed ${ds.border}`, borderRadius: 'var(--radius-lg)', color: ds.textFaint }}>
          Run one shared backtest first, then the comparison verdict appears here.
        </div>
      )}

      {uiState === 'loading' && (
        <div className="p-8 text-center border-dashed" style={{ border: `1px dashed ${ds.border}`, borderRadius: 'var(--radius-lg)', color: ds.textFaint }}>
          Loading both comparison legs…
        </div>
      )}

      {(uiState === 'success' || uiState === 'partial' || uiState === 'error') && (
        <ComparisonSummary
          leftLabel={leftCoin.name}
          rightLabel={rightCoin.name}
          normalizedStartDate={normalizedWindow.normalized ? normalizedWindow.effectiveStartDate : null}
          state={uiState}
          verdict={verdict}
          partialMessage={partialMessage}
        />
      )}

      {(uiState === 'success' || uiState === 'partial') && (
        <div className="grid gap-4 lg:grid-cols-2">
          {legs.map((leg) => (
            <div key={leg.coin.slug} className="space-y-3">
              <ComparisonResultCard coin={leg.coin} result={leg.result} />
              {leg.error && (
                <div
                  className="rounded-[var(--radius-lg)] border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-200"
                >
                  {leg.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/${leftCoin.slug}`} style={{ color: 'var(--accent)' }}>
          {leftCoin.name} calculator →
        </Link>
        <Link href={`/${rightCoin.slug}`} style={{ color: 'var(--accent)' }}>
          {rightCoin.name} calculator →
        </Link>
        <Link href={`/${leftCoin.slug}/guide`} style={{ color: 'var(--accent)' }}>
          {leftCoin.name} guide →
        </Link>
        <Link href={`/${rightCoin.slug}/guide`} style={{ color: 'var(--accent)' }}>
          {rightCoin.name} guide →
        </Link>
      </div>
    </div>
  )
}
