'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import AsciiHeader from '@/components/terminal/AsciiHeader'
import { COMPARE_ASCII } from '@/components/terminal/ascii'
import HeroChart from '@/components/terminal/HeroChart'
import HR from '@/components/terminal/HR'
import Panel from '@/components/terminal/Panel'
import { trackEvent } from '@/lib/analytics'
import { getCalculatorErrorMessage } from '@/lib/calculator-errors'
import { calculateBreakEven, calculateDca, type DcaResult, type Frequency } from '@/lib/dca'
import { formatPct, formatUsd } from '@/lib/formatters'
import type { CoinConfig } from '@/lib/coins'
import { fetchPricesForRange } from '@/lib/prices-client'
import { isSameCoinComparison, normalizeComparisonStartDate } from '@/lib/result-interpretation'
import { readUrlParams, useUrlSync } from '@/lib/url-sync'

interface ComparisonCalculatorProps {
  leftCoin: CoinConfig
  rightCoin: CoinConfig
  headingLevel?: 'h1' | 'h2'
}

interface LegMetrics {
  avgPrice: number
  maxDrawdownPct: number | null
  cagrPct: number | null
}

interface LegData extends LegMetrics {
  coin: CoinConfig
  result: DcaResult
  currentPrice: number
}

interface LegOutcome {
  data: LegData | null
  error: string | null
}

type UiState = 'initial' | 'loading' | 'success' | 'partial' | 'error'

const TODAY = (): string => new Date().toISOString().slice(0, 10)

const POPULAR_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['btc', 'sol'], ['eth', 'sol'], ['btc', 'bnb'], ['btc', 'xrp'],
  ['sol', 'avax'], ['doge', 'shib'], ['arb', 'op'], ['inj', 'fet'],
]

function computeLegMetrics(result: DcaResult, startDate: string, endDate: string): LegMetrics {
  const breakEven = result.totalCoins > 0 ? calculateBreakEven(result.totalInvested, result.totalCoins, 0) : null
  let cumCoins = 0
  let cumInvested = 0
  let peak = 0
  let maxDd: number | null = null
  for (const p of result.purchases) {
    cumCoins += p.coins
    cumInvested += p.amount
    const value = cumCoins * p.price
    if (value > peak) peak = value
    else if (peak > 0) {
      const dd = ((value - peak) / peak) * 100
      if (maxDd === null || dd < maxDd) maxDd = dd
    }
    if (cumInvested > 0 && value < cumInvested) {
      const dd = ((value - cumInvested) / cumInvested) * 100
      if (maxDd === null || dd < maxDd) maxDd = dd
    }
  }
  const years = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (365.25 * 24 * 3600 * 1000)
  const cagrPct = years > 0 && result.totalInvested > 0
    ? (((result.currentValue / result.totalInvested) ** (1 / years)) - 1) * 100
    : null
  return {
    avgPrice: breakEven?.breakEvenPrice ?? 0,
    maxDrawdownPct: maxDd,
    cagrPct,
  }
}

function buildSeries(result: DcaResult): { date: string; value: number; invested: number }[] {
  const out: { date: string; value: number; invested: number }[] = []
  let cumCoins = 0
  let cumInvested = 0
  for (const p of result.purchases) {
    cumCoins += p.coins
    cumInvested += p.amount
    out.push({
      date: p.date,
      value: Number((cumCoins * p.price).toFixed(2)),
      invested: Number(cumInvested.toFixed(2)),
    })
  }
  if (out.length > 0 && out[out.length - 1].date !== result.endDate) {
    out.push({
      date: result.endDate,
      value: Number(result.currentValue.toFixed(2)),
      invested: Number(result.totalInvested.toFixed(2)),
    })
  }
  return out
}

export default function ComparisonCalculator({ leftCoin, rightCoin, headingLevel = 'h1' }: ComparisonCalculatorProps) {
  const Heading = headingLevel
  const today = TODAY()
  const initial = useMemo(() => {
    const params = readUrlParams()
    const f = params.get('freq')
    return {
      amount: params.get('amount') ?? '100',
      frequency: (f === 'daily' || f === 'weekly' || f === 'monthly' ? f : 'monthly') as Frequency,
      startDate: params.get('from') ?? '2020-01-01',
      endDate: params.get('to') ?? today,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftCoin.slug, rightCoin.slug])
  const [amount, setAmount] = useState(initial.amount)
  const [frequency, setFrequency] = useState<Frequency>(initial.frequency)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)

  useUrlSync(
    { amount, freq: frequency, from: startDate, to: endDate },
    { amount: '100', freq: 'monthly', from: '2020-01-01', to: today },
  )
  const [uiState, setUiState] = useState<UiState>('initial')
  const [legs, setLegs] = useState<[LegOutcome, LegOutcome]>([
    { data: null, error: null },
    { data: null, error: null },
  ])
  const [validationError, setValidationError] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const normalizedWindow = useMemo(
    () => normalizeComparisonStartDate(startDate, leftCoin.listingDate, rightCoin.listingDate),
    [leftCoin.listingDate, rightCoin.listingDate, startDate],
  )

  const validate = (): string | null => {
    const parsed = parseFloat(amount)
    const today = TODAY()
    if (isNaN(parsed) || parsed <= 0) return 'amount must be > 0'
    if (startDate >= endDate) return 'end must be after start'
    if (endDate > today) return 'end must be in the past'
    if (isSameCoinComparison(leftCoin.slug, rightCoin.slug)) return 'pick two different coins'
    return null
  }

  async function runComparison() {
    const error = validate()
    if (error) {
      setValidationError(error)
      setUiState('error')
      return
    }
    setValidationError(null)
    setUiState('loading')
    const effectiveStart = normalizedWindow.effectiveStartDate
    trackEvent('comparison_submit', {
      left_coin: leftCoin.slug,
      right_coin: rightCoin.slug,
      frequency,
    })

    const responses = await Promise.all([
      fetchPricesForRange({ coinId: leftCoin.id, from: effectiveStart, to: endDate }),
      fetchPricesForRange({ coinId: rightCoin.id, from: effectiveStart, to: endDate }),
    ])

    const nextLegs: [LegOutcome, LegOutcome] = [
      { data: null, error: null },
      { data: null, error: null },
    ]
    const coins = [leftCoin, rightCoin]

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
      const result = calculateDca({
        prices: response.data.prices,
        amountPerPeriod: parseFloat(amount),
        frequency,
        startDate: effectiveStart,
        endDate,
        currentPrice,
      })
      nextLegs[index].data = {
        coin: coins[index],
        result,
        currentPrice,
        ...computeLegMetrics(result, effectiveStart, endDate),
      }
    })

    setLegs(nextLegs)
    const successes = nextLegs.filter((leg) => leg.data)
    if (successes.length === 2) {
      setUiState('success')
      trackEvent('comparison_success', { left_coin: leftCoin.slug, right_coin: rightCoin.slug })
    } else if (successes.length === 1) {
      setUiState('partial')
      trackEvent('comparison_partial', { left_coin: leftCoin.slug, right_coin: rightCoin.slug })
    } else {
      setUiState('error')
      trackEvent('comparison_error', { left_coin: leftCoin.slug, right_coin: rightCoin.slug })
    }
  }

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      void runComparison()
    }, 250)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, frequency, startDate, endDate, leftCoin.slug, rightCoin.slug])

  const leftData = legs[0].data
  const rightData = legs[1].data
  const winner: 'left' | 'right' | 'tie' | null = leftData && rightData
    ? (leftData.result.roi > rightData.result.roi
        ? 'left'
        : leftData.result.roi < rightData.result.roi
          ? 'right'
          : 'tie')
    : null

  const subtitle = `run one shared DCA plan on ${leftCoin.symbol} and ${rightCoin.symbol} · then see which held it better`

  return (
    <div style={{ marginTop: 4 }}>
      <Heading className="sr-only">
        {leftCoin.name} vs {rightCoin.name} DCA Comparison
      </Heading>
      <AsciiHeader lines={COMPARE_ASCII} subtitle={subtitle} />

      <Panel>
        <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 6 }}>
          # shared inputs — edit any flag to recompute both legs
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          <span style={{ color: 'var(--accent)' }}>$ </span>
          <span style={{ color: 'var(--fg)' }}>compare</span>
          <FlagReadonly k="--left" v={leftCoin.slug} />
          <FlagReadonly k="--right" v={rightCoin.slug} />
          <FlagInput k="--amount" value={amount} onChange={setAmount} width={70} />
          <FlagSelect
            k="--freq"
            value={frequency}
            onChange={(v) => setFrequency(v as Frequency)}
            options={[
              { label: 'daily', value: 'daily' },
              { label: 'weekly', value: 'weekly' },
              { label: 'monthly', value: 'monthly' },
            ]}
          />
          <FlagInput
            k="--from"
            value={startDate}
            onChange={setStartDate}
            type="date"
            min="2017-01-01"
            max={endDate}
            width={130}
          />
          <FlagInput
            k="--to"
            value={endDate}
            onChange={setEndDate}
            type="date"
            min={startDate}
            max={TODAY()}
            width={130}
          />
        </div>
        <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--muted)' }}>
          # {leftCoin.symbol} listed {leftCoin.listingDate} · {rightCoin.symbol} listed {rightCoin.listingDate}
          {normalizedWindow.normalized && (
            <>
              {' '}· shared window starts on{' '}
              <span style={{ color: 'var(--amber)' }}>{normalizedWindow.effectiveStartDate}</span>
            </>
          )}
        </div>
        {validationError && (
          <div style={{ color: 'var(--loss)', fontSize: 12, marginTop: 8 }}># {validationError}</div>
        )}
      </Panel>

      <HR label="verdict" />
      <VerdictBanner
        leftData={leftData}
        rightData={rightData}
        winner={winner}
        leftCoin={leftCoin}
        rightCoin={rightCoin}
        amount={amount}
        frequency={frequency}
        uiState={uiState}
      />

      <HR label="legs" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14 }}>
        <LegCard leg={legs[0]} color="var(--accent)" />
        <LegCard leg={legs[1]} color="var(--cyan)" />
      </div>

      {leftData && rightData && (
        <>
          <HR label="delta · same dollars in" />
          <DeltaTable leftData={leftData} rightData={rightData} leftCoin={leftCoin} rightCoin={rightCoin} />
        </>
      )}

      <HR label="try other matchups" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
        {POPULAR_PAIRS.map(([a, b]) => (
          <Link
            key={`${a}-${b}`}
            href={`/${a}-vs-${b}`}
            style={{
              border: '1px solid var(--border)',
              color: 'var(--fg-2)',
              padding: '5px 10px',
              background: 'var(--panel-2)',
            }}
          >
            $ compare {a} {b}
          </Link>
        ))}
      </div>
    </div>
  )
}

function VerdictBanner({
  leftData,
  rightData,
  winner,
  leftCoin,
  rightCoin,
  amount,
  frequency,
  uiState,
}: {
  leftData: LegData | null
  rightData: LegData | null
  winner: 'left' | 'right' | 'tie' | null
  leftCoin: CoinConfig
  rightCoin: CoinConfig
  amount: string
  frequency: Frequency
  uiState: UiState
}) {
  if (uiState === 'loading') {
    return <div style={{ color: 'var(--muted)', fontSize: 13 }}># computing both legs…</div>
  }
  if (!leftData || !rightData) {
    return (
      <div
        style={{
          padding: '14px 22px',
          background: 'rgba(244,185,66,0.10)',
          border: '1px solid rgba(244,185,66,0.33)',
          color: 'var(--amber)',
          fontSize: 13,
        }}
      >
        # only one leg loaded — hiding the verdict until both succeed
      </div>
    )
  }
  const roiDelta = leftData.result.roi - rightData.result.roi
  const valueDelta = leftData.result.currentValue - rightData.result.currentValue
  const winnerData = winner === 'left' ? leftData : winner === 'right' ? rightData : null
  const loserData = winner === 'left' ? rightData : winner === 'right' ? leftData : null

  return (
    <div
      className="trm-corner"
      style={{
        background: 'var(--accent-bg)',
        border: '1px solid rgba(181,242,61,0.33)',
        padding: '16px 22px',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--accent-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        verdict
      </div>
      <div style={{ fontSize: 20, marginTop: 4, lineHeight: 1.4 }}>
        {winner === 'tie' ? (
          <>
            <span style={{ color: 'var(--accent)' }}>{leftCoin.symbol}</span> and{' '}
            <span style={{ color: 'var(--cyan)' }}>{rightCoin.symbol}</span> are effectively tied on the same{' '}
            ${amount}/{frequency.slice(0, 2)} plan over {leftData.result.purchases.length} buys.
          </>
        ) : winnerData && loserData ? (
          <>
            <span style={{ color: winner === 'left' ? 'var(--accent)' : 'var(--cyan)' }}>
              {winnerData.coin.symbol}
            </span>{' '}
            held the same ${amount}/{frequency.slice(0, 2)} plan{' '}
            <span style={{ color: 'var(--profit)' }}>
              {roiDelta >= 0 ? '+' : ''}{Math.abs(roiDelta).toFixed(1)} pts
            </span>{' '}
            better than{' '}
            <span style={{ color: winner === 'left' ? 'var(--cyan)' : 'var(--accent)' }}>
              {loserData.coin.symbol}
            </span>{' '}
            over {leftData.result.purchases.length} buys.
          </>
        ) : null}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
        # delta: {valueDelta >= 0 ? '+' : ''}{formatUsd(Math.abs(valueDelta))} · same dollars in, different bags out · past performance, etc.
      </div>
    </div>
  )
}

function LegCard({ leg, color }: { leg: LegOutcome; color: string }) {
  // Hooks must come first — compute series for whatever result we have, or empty.
  const series = useMemo(() => (leg.data ? buildSeries(leg.data.result) : []), [leg.data])

  if (leg.error) {
    return (
      <Panel padding="18px 22px">
        <div style={{ fontSize: 13, color: 'var(--loss)' }}># error · {leg.error}</div>
      </Panel>
    )
  }
  if (!leg.data) {
    return (
      <Panel padding="18px 22px">
        <div style={{ fontSize: 13, color: 'var(--muted)' }}># waiting for data…</div>
      </Panel>
    )
  }
  const { coin, result, avgPrice, cagrPct } = leg.data
  const isProfit = result.roi >= 0
  const delta = result.currentValue - result.totalInvested
  return (
    <Panel padding="18px 22px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span style={{ color, fontWeight: 700, fontSize: 16 }}>{coin.symbol}</span>
          <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 13 }}>{coin.name}</span>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>listed {coin.listingDate}</span>
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 11,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        portfolio_value
      </div>
      <div
        className="tabular-nums"
        style={{ fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 4 }}
      >
        {formatUsd(result.currentValue)}
      </div>
      <div style={{ marginTop: 8, fontSize: 14, color: isProfit ? 'var(--profit)' : 'var(--loss)' }}>
        {delta >= 0 ? '+' : ''}{formatUsd(delta)}
        <span
          style={{
            background: isProfit ? 'var(--accent-bg)' : 'rgba(255,92,68,0.12)',
            padding: '2px 8px',
            marginLeft: 8,
          }}
        >
          {formatPct(result.roi)}
        </span>
      </div>
      <div
        className="tabular-nums"
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px dashed var(--border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px 16px',
          fontSize: 12.5,
        }}
      >
        {[
          ['total_invested', formatUsd(result.totalInvested)],
          [`${coin.symbol.toLowerCase()}_accumulated`, result.totalCoins.toFixed(6)],
          ['avg_buy_price', formatUsd(avgPrice)],
          ['cagr', cagrPct === null ? '—' : `${cagrPct >= 0 ? '+' : ''}${cagrPct.toFixed(1)}%`],
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px dotted var(--faint)',
              padding: '2px 0',
            }}
          >
            <span style={{ color: 'var(--muted)' }}>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <HeroChart data={series} height={120} color={color} />
      </div>
    </Panel>
  )
}

function DeltaTable({
  leftData,
  rightData,
  leftCoin,
  rightCoin,
}: {
  leftData: LegData
  rightData: LegData
  leftCoin: CoinConfig
  rightCoin: CoinConfig
}) {
  const rows: Array<{ metric: string; left: string; right: string; delta: string; winner: 'left' | 'right' | null }> = [
    {
      metric: 'portfolio_value',
      left: formatUsd(leftData.result.currentValue),
      right: formatUsd(rightData.result.currentValue),
      delta: formatUsd(leftData.result.currentValue - rightData.result.currentValue),
      winner: leftData.result.currentValue >= rightData.result.currentValue ? 'left' : 'right',
    },
    {
      metric: 'roi',
      left: formatPct(leftData.result.roi),
      right: formatPct(rightData.result.roi),
      delta: `${leftData.result.roi - rightData.result.roi >= 0 ? '+' : ''}${(leftData.result.roi - rightData.result.roi).toFixed(1)} pts`,
      winner: leftData.result.roi >= rightData.result.roi ? 'left' : 'right',
    },
    {
      metric: 'avg_buy_price',
      left: formatUsd(leftData.avgPrice),
      right: formatUsd(rightData.avgPrice),
      delta: '—',
      winner: null,
    },
    {
      metric: 'max_drawdown',
      left: leftData.maxDrawdownPct === null ? '—' : `${leftData.maxDrawdownPct.toFixed(1)}%`,
      right: rightData.maxDrawdownPct === null ? '—' : `${rightData.maxDrawdownPct.toFixed(1)}%`,
      delta: leftData.maxDrawdownPct === null || rightData.maxDrawdownPct === null
        ? '—'
        : `${leftData.maxDrawdownPct - rightData.maxDrawdownPct >= 0 ? '+' : ''}${(leftData.maxDrawdownPct - rightData.maxDrawdownPct).toFixed(1)} pts`,
      winner: leftData.maxDrawdownPct !== null && rightData.maxDrawdownPct !== null
        ? (leftData.maxDrawdownPct > rightData.maxDrawdownPct ? 'left' : 'right')
        : null,
    },
    {
      metric: 'cagr',
      left: leftData.cagrPct === null ? '—' : `${leftData.cagrPct >= 0 ? '+' : ''}${leftData.cagrPct.toFixed(1)}%`,
      right: rightData.cagrPct === null ? '—' : `${rightData.cagrPct >= 0 ? '+' : ''}${rightData.cagrPct.toFixed(1)}%`,
      delta: leftData.cagrPct === null || rightData.cagrPct === null
        ? '—'
        : `${leftData.cagrPct - rightData.cagrPct >= 0 ? '+' : ''}${(leftData.cagrPct - rightData.cagrPct).toFixed(1)} pts`,
      winner: leftData.cagrPct !== null && rightData.cagrPct !== null
        ? (leftData.cagrPct >= rightData.cagrPct ? 'left' : 'right')
        : null,
    },
    {
      metric: 'n_purchases',
      left: String(leftData.result.purchases.length),
      right: String(rightData.result.purchases.length),
      delta: '—',
      winner: null,
    },
  ]

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 160px 160px 180px',
          fontSize: 13,
          color: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
          paddingBottom: 6,
          gap: 8,
        }}
      >
        <span>metric</span>
        <span style={{ textAlign: 'right', color: 'var(--accent)' }}>{leftCoin.symbol}</span>
        <span style={{ textAlign: 'right', color: 'var(--cyan)' }}>{rightCoin.symbol}</span>
        <span style={{ textAlign: 'right' }}>Δ ({leftCoin.symbol} − {rightCoin.symbol})</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.metric}
          className="tabular-nums"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 160px 160px 180px',
            fontSize: 13,
            padding: '7px 0',
            borderBottom: '1px solid var(--faint)',
            gap: 8,
          }}
        >
          <span style={{ color: 'var(--muted)' }}>{row.metric}</span>
          <span style={{ textAlign: 'right' }}>{row.left}</span>
          <span style={{ textAlign: 'right' }}>{row.right}</span>
          <span
            style={{
              textAlign: 'right',
              color: row.winner === null ? 'var(--muted)' : 'var(--profit)',
            }}
          >
            {row.delta}
          </span>
        </div>
      ))}
    </div>
  )
}

function FlagReadonly({ k, v }: { k: string; v: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ color: 'var(--fg-2)' }}>&nbsp;{k}=</span>
      <span style={{ color: 'var(--amber)', background: 'var(--amber-bg)', padding: '0 4px' }}>{v}</span>
    </span>
  )
}

function FlagInput({
  k,
  value,
  onChange,
  type = 'text',
  min,
  max,
  width = 80,
}: {
  k: string
  value: string
  onChange: (v: string) => void
  type?: string
  min?: string
  max?: string
  width?: number
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ color: 'var(--fg-2)' }}>&nbsp;{k}=</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        style={{
          background: 'var(--amber-bg)',
          color: 'var(--amber)',
          border: 'none',
          padding: '0 4px',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          width,
          outline: 'none',
        }}
      />
    </span>
  )
}

function FlagSelect({
  k,
  value,
  onChange,
  options,
}: {
  k: string
  value: string
  onChange: (v: string) => void
  options: Array<{ label: string; value: string }>
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ color: 'var(--fg-2)' }}>&nbsp;{k}=</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'var(--amber-bg)',
          color: 'var(--amber)',
          border: 'none',
          padding: '0 4px',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </span>
  )
}
