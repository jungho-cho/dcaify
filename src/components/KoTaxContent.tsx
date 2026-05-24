'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import AsciiHeader from '@/components/terminal/AsciiHeader'
import { TAX_ASCII } from '@/components/terminal/ascii'
import HeroChart from '@/components/terminal/HeroChart'
import HR from '@/components/terminal/HR'
import Panel from '@/components/terminal/Panel'
import { trackEvent } from '@/lib/analytics'
import { getCalculatorErrorMessage } from '@/lib/calculator-errors'
import { calculateBreakEven, calculateDca, type DcaResult, type Frequency } from '@/lib/dca'
import { formatPct, formatUsd } from '@/lib/formatters'
import type { CoinConfig } from '@/lib/coins'
import { fetchPricesForRange } from '@/lib/prices-client'
import { KOREAN_CRYPTO_TAX } from '@/lib/tax-status'
import { readUrlParams, useUrlSync } from '@/lib/url-sync'

interface KoTaxContentProps {
  coin: CoinConfig
}

const TAX_RATE = KOREAN_CRYPTO_TAX.assumedRate
const ANNUAL_DEDUCTION_KRW = KOREAN_CRYPTO_TAX.basicDeductionKrw
const KRW_PER_USD = 1370 // rough scenario rate — explicit so users can see what we assumed
const ANNUAL_DEDUCTION_USD = ANNUAL_DEDUCTION_KRW / KRW_PER_USD

const TODAY = (): string => new Date().toISOString().slice(0, 10)

function clampStart(date: string, listing: string): string {
  return date < listing ? listing : date
}

interface Computed {
  result: DcaResult
  currentPrice: number
  breakEvenPre: number
  breakEvenPost: number
  grossProfit: number
  taxDueEstimate: number
  netProfit: number
}

export default function KoTaxContent({ coin }: KoTaxContentProps) {
  const initialStart = clampStart('2020-01-01', coin.listingDate)
  const today = TODAY()
  const initial = useMemo(() => {
    const params = readUrlParams()
    const f = params.get('freq')
    return {
      amount: params.get('amount') ?? '100',
      frequency: (f === 'daily' || f === 'weekly' || f === 'monthly' ? f : 'monthly') as Frequency,
      startDate: params.get('from') ?? initialStart,
      endDate: params.get('to') ?? today,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coin.slug])
  const [amount, setAmount] = useState(initial.amount)
  const [frequency, setFrequency] = useState<Frequency>(initial.frequency)
  const [startDate, setStartDate] = useState(initial.startDate)
  const [endDate, setEndDate] = useState(initial.endDate)

  useUrlSync(
    { amount, freq: frequency, from: startDate, to: endDate },
    { amount: '100', freq: 'monthly', from: initialStart, to: today },
  )
  const [computed, setComputed] = useState<Computed | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [uiState, setUiState] = useState<'loading' | 'success' | 'error'>('loading')
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'stale'>('cache')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function runCalculation() {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg('금액은 0보다 커야 합니다.')
      setUiState('error')
      return
    }
    const effectiveStart = clampStart(startDate, coin.listingDate)
    setUiState('loading')
    setErrorMsg(null)
    trackEvent('calculator_submit', { context: 'tax_page', coin: coin.slug, lang: 'ko', frequency })

    try {
      const response = await fetchPricesForRange({ coinId: coin.id, from: effectiveStart, to: endDate })
      if (!response.ok) {
        setErrorMsg(getCalculatorErrorMessage(response.category, 'ko', response.payload))
        setUiState('error')
        return
      }
      setDataSource(response.data.dataSource)
      if (response.data.prices.length === 0) {
        setErrorMsg(getCalculatorErrorMessage('no_data', 'ko'))
        setUiState('error')
        return
      }
      const currentPrice = response.data.prices[response.data.prices.length - 1].price
      const result = calculateDca({
        prices: response.data.prices,
        amountPerPeriod: parsed,
        frequency,
        startDate: effectiveStart,
        endDate,
        currentPrice,
      })
      const breakEven = calculateBreakEven(result.totalInvested, result.totalCoins, TAX_RATE)
      const grossProfit = result.currentValue - result.totalInvested
      const taxableProfit = Math.max(0, grossProfit - ANNUAL_DEDUCTION_USD)
      const taxDueEstimate = taxableProfit * TAX_RATE
      const netProfit = grossProfit - taxDueEstimate
      setComputed({
        result,
        currentPrice,
        breakEvenPre: breakEven.breakEvenPrice,
        breakEvenPost: breakEven.breakEvenWithTax,
        grossProfit,
        taxDueEstimate,
        netProfit,
      })
      setUiState('success')
      trackEvent('calculator_success', { context: 'tax_page', coin: coin.slug, lang: 'ko', data_source: response.data.dataSource })
    } catch {
      setErrorMsg(getCalculatorErrorMessage('unknown', 'ko'))
      setUiState('error')
    }
  }

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      void runCalculation()
    }, 250)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, frequency, startDate, endDate, coin.slug])

  const series = useMemo(() => {
    if (!computed) return []
    const out: { date: string; value: number; invested: number }[] = []
    let cumCoins = 0
    let cumInvested = 0
    for (const p of computed.result.purchases) {
      cumCoins += p.coins
      cumInvested += p.amount
      out.push({
        date: p.date,
        value: Number((cumCoins * p.price).toFixed(2)),
        invested: Number(cumInvested.toFixed(2)),
      })
    }
    if (out.length > 0 && out[out.length - 1].date !== endDate) {
      out.push({
        date: endDate,
        value: Number(computed.result.currentValue.toFixed(2)),
        invested: Number(computed.result.totalInvested.toFixed(2)),
      })
    }
    return out
  }, [computed, endDate])

  const statusYearMonth = TODAY().slice(0, 7)
  const subtitle = `${coin.name} 적립식 투자 손익분기점 · ${KOREAN_CRYPTO_TAX.expectedStartDate.slice(0, 4)}년 시행 예정 가상자산 과세 가정`

  return (
    <div style={{ marginTop: 4 }}>
      <AsciiHeader lines={TAX_ASCII} subtitle={subtitle} />

      {/* Status banner */}
      <Panel tone="amber" padding="14px 22px">
        <div
          style={{
            fontSize: 11,
            color: 'var(--amber)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          # status · {statusYearMonth}
        </div>
        <div style={{ fontSize: 14, color: 'var(--fg-2)', marginTop: 4, lineHeight: 1.55 }}>
          가상자산 양도소득세는{' '}
          <span style={{ color: 'var(--fg)' }}>
            {KOREAN_CRYPTO_TAX.expectedStartDate.slice(0, 4)}년 시행 예정
          </span>
          으로 발표되었지만 두 차례 유예 이력이 있습니다. 본 계산기는{' '}
          <span style={{ color: 'var(--amber)' }}>
            연 {ANNUAL_DEDUCTION_KRW.toLocaleString('ko-KR')}원 공제 후 {(TAX_RATE * 100).toFixed(0)}% 분리과세
          </span>
          를 가정합니다. 실제 신고 전 최신 공지를 다시 확인하세요.
        </div>
      </Panel>

      {/* Editable prompt */}
      <div style={{ marginTop: 18 }}>
        <Panel>
          <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 6 }}>
            # 어떤 플래그든 값을 클릭해 편집 · 자동으로 재계산
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
            <span style={{ color: 'var(--fg)' }}>tax</span>
            <FlagReadonly k="--country" v="kr" />
            <FlagReadonly k="--rate" v={`${(TAX_RATE * 100).toFixed(0)}%`} />
            <FlagReadonly k="--deduction" v={`${ANNUAL_DEDUCTION_KRW.toLocaleString('ko-KR')} KRW`} />
            <FlagReadonly k="--coin" v={coin.slug} />
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
              min={coin.listingDate}
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
        </Panel>
      </div>

      {uiState === 'error' && errorMsg && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'rgba(255,92,68,0.10)',
            border: '1px solid rgba(255,92,68,0.35)',
            color: 'var(--loss)',
            fontSize: 13,
          }}
        >
          # error · {errorMsg}
        </div>
      )}

      {computed && (
        <>
          {/* Break-even 세전 vs 세후 */}
          <HR label="break_even · 세전 vs 세후" right={`data: ${dataSource} · binance.com/api/v3/klines`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <Panel>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                break_even · 세전
              </div>
              <SplitNumber value={computed.breakEvenPre} size={44} color="var(--fg)" />
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                # 원금 회수에 필요한 {coin.symbol} 가격 · 세금 미반영
              </div>
              <div
                className="tabular-nums"
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px dashed var(--border)',
                  fontSize: 12.5,
                  color: 'var(--fg-2)',
                  display: 'grid',
                  gap: 4,
                }}
              >
                <Kv k="total_invested" v={formatUsd(computed.result.totalInvested)} />
                <Kv k={`${coin.symbol.toLowerCase()}_accumulated`} v={computed.result.totalCoins.toFixed(6)} />
                <Kv k="avg_buy_price" v={formatUsd(computed.breakEvenPre)} />
              </div>
            </Panel>
            <Panel tone="amber">
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--amber)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                break_even · 세후 ({(TAX_RATE * 100).toFixed(0)}%)
              </div>
              <SplitNumber value={computed.breakEvenPost} size={44} color="var(--amber)" />
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                # 세후 원금 회수에 필요한 {coin.symbol} 가격 ·{' '}
                {computed.breakEvenPre > 0
                  ? `+${(((computed.breakEvenPost - computed.breakEvenPre) / computed.breakEvenPre) * 100).toFixed(2)}% 상향`
                  : '—'}
              </div>
              <div
                className="tabular-nums"
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px dashed var(--border)',
                  fontSize: 12.5,
                  color: 'var(--fg-2)',
                  display: 'grid',
                  gap: 4,
                }}
              >
                <Kv k="예상 양도세" v={formatUsd(computed.taxDueEstimate)} valueColor="var(--amber)" />
                <Kv
                  k="연간 공제"
                  v={`₩${ANNUAL_DEDUCTION_KRW.toLocaleString('ko-KR')} ≈ ${formatUsd(ANNUAL_DEDUCTION_USD)}`}
                />
                <Kv k="과세 시점" v={`매도 시 분리과세 ${(TAX_RATE * 100).toFixed(0)}%`} />
              </div>
            </Panel>
          </div>

          {/* 실수령 수익 시뮬레이션 */}
          <HR label="실수령 수익 시뮬레이션" />
          <Panel>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 24,
              }}
            >
              <SimulationCell label="투자_원금" value={formatUsd(computed.result.totalInvested)} color="var(--fg)" />
              <SimulationCell label="현재_평가액" value={formatUsd(computed.result.currentValue)} color="var(--fg)" />
              <SimulationCell
                label="세전_수익"
                value={`${computed.grossProfit >= 0 ? '+' : ''}${formatUsd(computed.grossProfit)} · ${formatPct(computed.result.roi)}`}
                color={computed.grossProfit >= 0 ? 'var(--profit)' : 'var(--loss)'}
              />
              <SimulationCell
                label="세후_수익_추정"
                value={`${computed.netProfit >= 0 ? '+' : ''}${formatUsd(computed.netProfit)}`}
                color="var(--amber)"
              />
            </div>
            <div style={{ marginTop: 18 }}>
              <HeroChart data={series} height={160} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <span>
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    height: 2,
                    background: 'var(--accent)',
                    verticalAlign: 'middle',
                    marginRight: 5,
                  }}
                />
                포트폴리오
              </span>
              <span>
                <span
                  style={{
                    display: 'inline-block',
                    width: 12,
                    borderTop: '1px dashed var(--muted)',
                    verticalAlign: 'middle',
                    marginRight: 5,
                  }}
                />
                투자원금
              </span>
              <span style={{ marginLeft: 'auto' }}>
                # 환율 가정: 1 USD ≈ {KRW_PER_USD.toLocaleString('ko-KR')} KRW
              </span>
            </div>
          </Panel>
        </>
      )}

      {/* 용어 */}
      <HR label="용어" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {[
          {
            q: '? 손익분기점이란?',
            a: '총 투자금을 회수하기 위해 코인 가격이 도달해야 하는 최소 가격입니다. 세후 손익분기점은 본 페이지가 가정한 22% 세율과 연 250만 원 공제를 반영한 참고값입니다.',
          },
          {
            q: '? DCA와 세금 절약',
            a: '적립식 투자(DCA)는 평균 매입 단가를 낮추어 양도차익을 줄이는 효과가 있습니다. 향후 과세 시행 시 세후 손익 관리에 유리할 수 있습니다.',
          },
          {
            q: '? 시행 시점은 확정인가?',
            a: '확정 아닙니다. 두 차례 유예 이력이 있으며 본 계산기는 가장 최근 공지를 기준으로 합니다. 신고 전 최신 정보 확인 필수.',
          },
          {
            q: '? 해외 거주자라면?',
            a: '본 페이지는 한국 거주자 기준입니다. 거주국이 다르면 본 시나리오는 적용되지 않으며, 해당 국가의 세무 자료를 직접 확인해야 합니다.',
          },
        ].map((item) => (
          <div key={item.q}>
            <div style={{ color: 'var(--accent)', fontSize: 13 }}>{item.q}</div>
            <div style={{ color: 'var(--fg-2)', fontSize: 13, paddingLeft: 14, marginTop: 4, lineHeight: 1.65 }}>
              {item.a}
            </div>
          </div>
        ))}
      </div>

      {/* 관련 페이지 */}
      <HR label="관련 페이지" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
        <ChipLink href={`/ko/${coin.slug}`}>$ dca --coin={coin.slug}</ChipLink>
        <ChipLink href={`/ko/${coin.slug}/guide`}>$ man {coin.slug}/guide</ChipLink>
        <ChipLink href={`/ko/eth/tax`}>$ tax --coin=eth</ChipLink>
        <ChipLink href={`/ko/sol/tax`}>$ tax --coin=sol</ChipLink>
        <ChipLink href={`/${coin.slug}-vs-eth`}>$ compare {coin.slug} eth</ChipLink>
      </div>
    </div>
  )
}

function SplitNumber({ value, size, color }: { value: number; size: number; color: string }) {
  const formatted = formatUsd(value)
  const decimalIndex = formatted.lastIndexOf('.')
  const integerPart = decimalIndex >= 0 ? formatted.slice(0, decimalIndex) : formatted
  const decimalPart = decimalIndex >= 0 ? formatted.slice(decimalIndex) : ''
  return (
    <div
      className="tabular-nums"
      style={{ fontSize: size, marginTop: 6, lineHeight: 1, letterSpacing: '-0.02em', color }}
    >
      {integerPart}
      <span style={{ color: 'var(--muted)', fontSize: Math.round(size * 0.5) }}>{decimalPart}</span>
    </div>
  )
}

function SimulationCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      <div className="tabular-nums" style={{ fontSize: 22, marginTop: 4, color }}>
        {value}
      </div>
    </div>
  )
}

function Kv({ k, v, valueColor }: { k: string; v: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--muted)' }}>{k}</span>
      <span style={{ color: valueColor ?? 'var(--fg)' }}>{v}</span>
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

function ChipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        border: '1px solid var(--border)',
        color: 'var(--fg-2)',
        padding: '5px 10px',
        background: 'var(--panel-2)',
      }}
    >
      {children}
    </Link>
  )
}
