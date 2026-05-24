'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import AsciiHeader from '@/components/terminal/AsciiHeader'
import { getCoinAscii } from '@/components/terminal/ascii'
import HeroChart from '@/components/terminal/HeroChart'
import HR from '@/components/terminal/HR'
import Panel from '@/components/terminal/Panel'
import { trackEvent } from '@/lib/analytics'
import { getCalculatorErrorMessage } from '@/lib/calculator-errors'
import { calculateBreakEven, calculateDca, type DcaResult, type Frequency } from '@/lib/dca'
import type { CoinConfig } from '@/lib/coins'
import { formatPct, formatUsd } from '@/lib/formatters'
import { fetchPricesForRange } from '@/lib/prices-client'
import { type Lang, getStrings } from '@/lib/strings'
import { readUrlParams, useUrlSync } from '@/lib/url-sync'

interface Props {
  defaultCoin: CoinConfig
  lang?: Lang
  relatedCoins?: CoinConfig[]
  analyticsContext?: 'coin_calculator' | 'tax_page'
  headingLevel?: 'h1' | 'h2'
}

type UiState = 'initial' | 'loading' | 'success' | 'error' | 'rate_limited'

const TODAY = (): string => new Date().toISOString().slice(0, 10)

function yearsAgo(years: number): string {
  const d = new Date()
  d.setUTCFullYear(d.getUTCFullYear() - years)
  return d.toISOString().slice(0, 10)
}

function clampStart(date: string, listing: string): string {
  return date < listing ? listing : date
}

interface PresetDef {
  id: string
  label: string
  amount: string
  frequency: Frequency
  yearsBack: number | 'listing'
}

const PRESETS: PresetDef[] = [
  { id: 'wk-5y', label: '$50/wk · 5y',    amount: '50',  frequency: 'weekly',  yearsBack: 5 },
  { id: 'mo-5y', label: '$100/mo · 5y',   amount: '100', frequency: 'monthly', yearsBack: 5 },
  { id: 'mo-3y', label: '$200/mo · 3y',   amount: '200', frequency: 'monthly', yearsBack: 3 },
  { id: 'mo-1y', label: '$500/mo · 1y',   amount: '500', frequency: 'monthly', yearsBack: 1 },
  { id: 'listing', label: 'since-listing', amount: '100', frequency: 'monthly', yearsBack: 'listing' },
]

export default function DcaCalculator({
  defaultCoin,
  lang = 'en',
  relatedCoins,
  analyticsContext = 'coin_calculator',
  headingLevel = 'h1',
}: Props) {
  const s = getStrings(lang)
  const coin = defaultCoin

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
  const [uiState, setUiState] = useState<UiState>('initial')
  const [result, setResult] = useState<DcaResult | null>(null)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'stale'>('cache')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [effectiveStartDate, setEffectiveStartDate] = useState<string>(initialStart)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const validate = (): string | null => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return s.invalidAmount
    const today = TODAY()
    if (startDate > today) return s.startInFuture
    if (endDate > today) return s.endInFuture
    if (startDate >= endDate) return s.endBeforeStart
    const startYear = new Date(startDate).getFullYear()
    const endYear = new Date(endDate).getFullYear()
    if (endYear - startYear > 10) return s.maxRange
    return null
  }

  async function runCalculation() {
    const validationMessage = validate()
    if (validationMessage) {
      setErrorMsg(validationMessage)
      setUiState('error')
      return
    }
    setErrorMsg(null)
    setUiState('loading')
    const parsedAmount = parseFloat(amount)
    const requestStart = clampStart(startDate, coin.listingDate)
    setEffectiveStartDate(requestStart)

    trackEvent('calculator_submit', { context: analyticsContext, coin: coin.slug, lang, frequency })
    if (analyticsContext === 'tax_page') trackEvent('tax_page_calculate_click', { coin: coin.slug })

    try {
      const response = await fetchPricesForRange({ coinId: coin.id, from: requestStart, to: endDate })
      if (!response.ok) {
        setErrorMsg(getCalculatorErrorMessage(response.category, lang, response.payload))
        setUiState(response.category === 'rate_limited' ? 'rate_limited' : 'error')
        trackEvent('calculator_error', { context: analyticsContext, coin: coin.slug, lang, category: response.category })
        return
      }
      setDataSource(response.data.dataSource)
      if (response.data.prices.length === 0) {
        setErrorMsg(getCalculatorErrorMessage('no_data', lang))
        setUiState('error')
        return
      }
      const last = response.data.prices[response.data.prices.length - 1]
      const price = last.price
      const dcaResult = calculateDca({
        prices: response.data.prices,
        amountPerPeriod: parsedAmount,
        frequency,
        startDate: requestStart,
        endDate,
        currentPrice: price,
      })
      setResult(dcaResult)
      setCurrentPrice(price)
      setUiState('success')
      trackEvent('calculator_success', { context: analyticsContext, coin: coin.slug, lang, data_source: response.data.dataSource })
    } catch {
      setErrorMsg(getCalculatorErrorMessage('unknown', lang))
      setUiState('error')
    }
  }

  // Run on mount + on any input change (debounced).
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
    if (!result || currentPrice === null) return []
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
    const last = out[out.length - 1]
    if (last && last.date !== endDate) {
      out.push({
        date: endDate,
        value: Number(result.currentValue.toFixed(2)),
        invested: Number(result.totalInvested.toFixed(2)),
      })
    }
    return out
  }, [result, currentPrice, endDate])

  const purchasesSample = useMemo(() => {
    if (!result) return []
    if (result.purchases.length <= 12) return result.purchases
    const step = (result.purchases.length - 1) / 11
    return Array.from({ length: 12 }, (_, i) => result.purchases[Math.round(i * step)])
  }, [result])

  const breakEven = result && result.totalCoins > 0
    ? calculateBreakEven(result.totalInvested, result.totalCoins, lang === 'ko' ? 0.22 : 0)
    : null

  const isProfit = result ? result.roi >= 0 : false
  const delta = result ? result.currentValue - result.totalInvested : 0
  const shareText = result
    ? s.shareText(coin.name, formatUsd(parseFloat(amount)), s[frequency], formatPct(result.roi), formatUsd(result.currentValue))
    : ''
  const tweetHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
  const langPrefix = lang === 'ko' ? '/ko' : ''

  // Compute CAGR + max drawdown for the metric grid.
  const { cagrPct, maxDrawdown } = useMemo(() => {
    if (!result) return { cagrPct: null as number | null, maxDrawdown: null as { pct: number; date: string } | null }
    const years = (new Date(endDate).getTime() - new Date(effectiveStartDate).getTime()) / (365.25 * 24 * 3600 * 1000)
    const cagr = years > 0 && result.totalInvested > 0
      ? (((result.currentValue / result.totalInvested) ** (1 / years)) - 1) * 100
      : null

    let cumCoins = 0
    let cumInvested = 0
    let peak = 0
    let dd: { pct: number; date: string } | null = null
    for (const p of result.purchases) {
      cumCoins += p.coins
      cumInvested += p.amount
      const value = cumCoins * p.price
      if (value > peak) peak = value
      else if (peak > 0) {
        const drawdown = ((value - peak) / peak) * 100
        if (!dd || drawdown < dd.pct) dd = { pct: drawdown, date: p.date }
      }
      // Track invested-relative drawdown as well so a flat start still registers losses
      if (cumInvested > 0 && value < cumInvested) {
        const drawdown = ((value - cumInvested) / cumInvested) * 100
        if (!dd || drawdown < dd.pct) dd = { pct: drawdown, date: p.date }
      }
    }
    return { cagrPct: cagr, maxDrawdown: dd }
  }, [result, effectiveStartDate, endDate])

  function applyPreset(p: PresetDef) {
    setAmount(p.amount)
    setFrequency(p.frequency)
    if (p.yearsBack === 'listing') {
      setStartDate(coin.listingDate)
    } else {
      setStartDate(clampStart(yearsAgo(p.yearsBack), coin.listingDate))
    }
    setEndDate(TODAY())
  }

  function activePresetId(): string | null {
    for (const p of PRESETS) {
      if (p.amount !== amount) continue
      if (p.frequency !== frequency) continue
      const expected = p.yearsBack === 'listing'
        ? coin.listingDate
        : clampStart(yearsAgo(p.yearsBack), coin.listingDate)
      if (expected === startDate) return p.id
    }
    return null
  }
  const activePreset = activePresetId()

  const ascii = getCoinAscii(coin.slug)
  const subtitleEn = `see what consistent ${coin.name.toLowerCase()} buys would be worth today · binance · 1d closes`
  const subtitleKo = `${coin.name} 적립식 매수의 현재 가치 · 바이낸스 · 1일 종가`

  const Heading = headingLevel

  return (
    <div style={{ marginTop: 4 }}>
      <Heading className="sr-only">{coin.name} DCA {lang === 'ko' ? '계산기' : 'Calculator'}</Heading>
      <AsciiHeader lines={ascii} subtitle={lang === 'ko' ? subtitleKo : subtitleEn} />

      {/* Prompt (editable) */}
      <Panel>
        <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 6 }}>
          # {lang === 'ko' ? '어떤 플래그든 값을 클릭해 편집 · 자동으로 재계산' : 'click any flag value to edit · auto-recomputes'}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0,
            fontSize: 14,
            lineHeight: 1.8,
          }}
        >
          <span style={{ color: 'var(--accent)' }}>$ </span>
          <span style={{ color: 'var(--fg)' }}>dca</span>
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
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              background: 'var(--accent)',
              width: 9,
              height: 16,
              marginLeft: 6,
              verticalAlign: 'middle',
              animation: 'trmBlink 1s steps(2) infinite',
            }}
          />
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
          <span style={{ color: 'var(--muted)' }}>presets:</span>
          {PRESETS.map((p) => {
            const active = activePreset === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                style={{
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  color: active ? 'var(--accent)' : 'var(--fg-2)',
                  background: active ? 'var(--accent-bg)' : 'var(--panel-2)',
                  padding: '4px 10px',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </Panel>

      <HR label="result" right={`data: ${dataSource} · binance.com/api/v3/klines`} />

      {uiState === 'error' && errorMsg && (
        <div
          style={{
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

      {uiState === 'rate_limited' && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(244,185,66,0.10)',
            border: '1px solid rgba(244,185,66,0.35)',
            color: 'var(--amber)',
            fontSize: 13,
          }}
        >
          # rate_limited · {s.rateLimited}
        </div>
      )}

      {result && currentPrice !== null && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
            gap: 28,
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                color: 'var(--muted)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {lang === 'ko' ? '포트폴리오_가치' : 'portfolio_value'}
            </div>
            <HeroNumber value={result.currentValue} size={64} />
            <div style={{ marginTop: 10, fontSize: 17, color: isProfit ? 'var(--profit)' : 'var(--loss)' }}>
              {delta >= 0 ? '+' : ''}{formatUsd(delta)}
              <span
                style={{
                  background: isProfit ? 'var(--accent-bg)' : 'rgba(255,92,68,0.12)',
                  padding: '2px 8px',
                  marginLeft: 10,
                }}
              >
                {formatPct(result.roi)}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 10 }}>
                {lang === 'ko' ? '대비' : 'roi vs'} {formatUsd(result.totalInvested)} {lang === 'ko' ? '투입' : 'in'}
              </span>
            </div>

            <div
              className="tabular-nums"
              style={{
                marginTop: 24,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px 24px',
                fontSize: 13,
              }}
            >
              {[
                [lang === 'ko' ? '총_투자금' : 'total_invested', formatUsd(result.totalInvested)],
                [`${coin.symbol.toLowerCase()}_accumulated`, result.totalCoins.toFixed(6)],
                [lang === 'ko' ? '평균_매수단가' : 'avg_buy_price', formatUsd(breakEven?.breakEvenPrice ?? 0)],
                [lang === 'ko' ? '현재가' : 'current_price', formatUsd(currentPrice)],
                [lang === 'ko' ? '손익분기' : 'breakeven_price', formatUsd(breakEven?.breakEvenPrice ?? 0)],
                [lang === 'ko' ? '매수_횟수' : 'n_purchases', `${result.purchases.length} / ${result.purchases.length} ok`],
                [lang === 'ko' ? '첫_매수' : 'first_buy', result.purchases[0]?.date ?? '—'],
                [lang === 'ko' ? '마지막_매수' : 'last_buy', result.purchases[result.purchases.length - 1]?.date ?? '—'],
                [
                  lang === 'ko' ? '연복리' : 'cagr',
                  cagrPct === null ? '—' : `${cagrPct >= 0 ? '+' : ''}${cagrPct.toFixed(1)}%`,
                ],
                [
                  lang === 'ko' ? '최대_낙폭' : 'max_drawdown',
                  maxDrawdown ? `${maxDrawdown.pct.toFixed(1)}% · ${maxDrawdown.date}` : '—',
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px dotted var(--faint)',
                    padding: '3px 0',
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <HeroChart data={series} height={260} />
            <div style={{ display: 'flex', gap: 18, marginTop: 10, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
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
                {lang === 'ko' ? '포트폴리오' : 'portfolio'}
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
                {lang === 'ko' ? '투자원금' : 'invested'}
              </span>
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
                {lang === 'ko' ? '월별 가격 데이터 위로 마우스 →' : 'hover any month for price detail →'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Purchases sample */}
      {result && purchasesSample.length > 0 && (
        <>
          <HR
            label={`purchases · sample · ${purchasesSample.length} of ${result.purchases.length}`}
            right={lang === 'ko' ? '모두 보기 → CSV (곧 추가)' : 'show all → CSV (soon)'}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 130px minmax(140px, 1fr) 120px 120px 130px',
              fontSize: 12.5,
              color: 'var(--muted)',
              borderBottom: '1px solid var(--border)',
              paddingBottom: 6,
              gap: 8,
            }}
          >
            <span>#</span>
            <span>DATE</span>
            <span>SOURCE</span>
            <span style={{ textAlign: 'right' }}>PRICE</span>
            <span style={{ textAlign: 'right' }}>{coin.symbol}_BOUGHT</span>
            <span style={{ textAlign: 'right' }}>RUN_VALUE</span>
          </div>
          {(() => {
            let runCoins = 0
            return purchasesSample.map((p, idx) => {
              runCoins += p.coins
              const runValue = runCoins * (currentPrice ?? p.price)
              const realIndex = result.purchases.findIndex((pp) => pp.date === p.date) + 1
              return (
                <div
                  key={`${p.date}-${idx}`}
                  className="tabular-nums"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 130px minmax(140px, 1fr) 120px 120px 130px',
                    fontSize: 13,
                    padding: '6px 0',
                    borderBottom: '1px solid var(--faint)',
                    gap: 8,
                  }}
                >
                  <span style={{ color: 'var(--muted)' }}>{String(realIndex).padStart(2, '0')}</span>
                  <span>{p.date}</span>
                  <span style={{ color: 'var(--muted)' }}>{coin.binanceSymbol} 1d close</span>
                  <span style={{ textAlign: 'right', color: 'var(--amber)' }}>{formatUsd(p.price)}</span>
                  <span style={{ textAlign: 'right' }}>{p.coins.toFixed(6)}</span>
                  <span style={{ textAlign: 'right', color: 'var(--profit)' }}>{formatUsd(runValue)}</span>
                </div>
              )
            })
          })()}
        </>
      )}

      {/* Break-even + share */}
      {breakEven && (
        <>
          <HR label="break_even · share" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <Panel padding="14px 18px">
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {lang === 'ko' ? '손익분기_가격' : 'break_even_price'}
              </div>
              <div className="tabular-nums" style={{ fontSize: 22, marginTop: 6, color: 'var(--amber)' }}>
                {formatUsd(breakEven.breakEvenPrice)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                # {lang === 'ko'
                  ? `${coin.symbol} 가격이 이 수준에 도달하면 원금 회수`
                  : `price ${coin.symbol} must reach to recover principal`}
              </div>
            </Panel>
            {lang === 'ko' && (
              <Panel padding="14px 18px">
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  break_even · kr_tax
                </div>
                <div className="tabular-nums" style={{ fontSize: 22, marginTop: 6, color: 'var(--amber)' }}>
                  {formatUsd(breakEven.breakEvenWithTax)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  # 22% 분리과세 가정
                </div>
              </Panel>
            )}
            <Panel padding="14px 18px">
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                share
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <a
                  href={tweetHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ border: '1px solid var(--border)', padding: '4px 10px', fontSize: 12, color: 'var(--fg-2)', background: 'var(--panel-2)' }}
                >
                  $ tweet
                </a>
                <CopyUrlButton />
              </div>
            </Panel>
          </div>
          {lang === 'en' && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
              # need a tax-adjusted figure?{' '}
              <Link href={`/ko/${coin.slug}/tax`} style={{ color: 'var(--accent)' }}>
                $ tax --coin={coin.slug} --country=kr
              </Link>
            </div>
          )}
        </>
      )}

      {/* FAQ */}
      <HR label="faq" />
      <FaqList coin={coin} lang={lang} />

      {/* Related coins */}
      {relatedCoins && relatedCoins.length > 0 && (
        <>
          <HR label="related" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {relatedCoins.map((rc) => (
              <Link
                key={rc.id}
                href={`${langPrefix}/${rc.slug}`}
                style={{
                  border: '1px solid var(--border)',
                  padding: '6px 10px',
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--fg)',
                }}
              >
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{rc.symbol}</span>
                <span style={{ color: 'var(--muted)' }}>{rc.name}</span>
              </Link>
            ))}
          </div>
        </>
      )}
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

function HeroNumber({ value, size = 56 }: { value: number; size?: number }) {
  const formatted = formatUsd(value)
  const decimalIndex = formatted.lastIndexOf('.')
  const integerPart = decimalIndex >= 0 ? formatted.slice(0, decimalIndex) : formatted
  const decimalPart = decimalIndex >= 0 ? formatted.slice(decimalIndex) : ''
  return (
    <div
      className="tabular-nums"
      style={{ fontSize: size, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 4 }}
    >
      {integerPart}
      <span style={{ color: 'var(--muted)', fontSize: Math.round(size * 0.4) }}>{decimalPart}</span>
    </div>
  )
}

function CopyUrlButton() {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window === 'undefined') return
        navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      style={{
        border: '1px solid var(--border)',
        padding: '4px 10px',
        fontSize: 12,
        color: 'var(--fg-2)',
        background: 'var(--panel-2)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {copied ? '$ copied' : '$ copy url'}
    </button>
  )
}

function FaqList({ coin, lang }: { coin: CoinConfig; lang: Lang }) {
  const items = lang === 'ko'
    ? [
        { q: '? 적립식 투자(DCA)란 무엇인가요', a: `정기적으로 일정 금액을 매수하는 전략입니다. ${coin.name}이라면 매달 10만 원, 매주 2만 원처럼 가격과 무관하게 같은 금액으로 매수합니다.` },
        { q: `? ${coin.name}에 매달 얼마를 투자해야 하나요`, a: '꾸준히 반복 가능한 금액부터 시작하세요. 한 번에 큰 금액보다 일관성이 더 큰 효과를 냅니다.' },
        { q: '? 일시불 투자보다 유리한가요', a: '통계적으로는 일시불이 자주 이깁니다. 다만 적립식은 시장 타이밍 부담을 줄여 변동성이 큰 자산을 끝까지 들고 가기 쉬워집니다.' },
        { q: '? 손익분기점은 어떻게 계산하나요', a: `${coin.symbol} 가격이 평균 매수단가에 도달하면 원금 기준 손익분기점입니다. 한국어 페이지에는 22% 세금을 반영한 시나리오도 함께 표시됩니다.` },
      ]
    : [
        { q: '? what is dollar cost averaging', a: `DCA means investing a fixed amount on a recurring schedule, regardless of price. For ${coin.name}, that could be $100 every month or $25 every week.` },
        { q: `? how much should I invest into ${coin.name.toLowerCase()}`, a: 'Use an amount you can repeat comfortably. The useful habit is consistency, not heroically sizing one perfect buy.' },
        { q: '? is DCA better than lump-sum', a: 'Lump sum often wins statistically, but DCA wins on repeatability. It reduces timing risk and makes volatile assets easier to hold through.' },
        { q: '? what does the break-even price mean', a: `The price ${coin.symbol} needs to reach so the dollar value of the bag equals total dollars invested. Korean pages also show a 22%-tax-adjusted scenario.` },
      ]
  return (
    <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.7, display: 'grid', gap: 14 }}>
      {items.map((it) => (
        <div key={it.q}>
          <div style={{ color: 'var(--amber)' }}>{it.q}</div>
          <div style={{ color: 'var(--fg-2)', paddingLeft: 16, marginTop: 2 }}>{it.a}</div>
        </div>
      ))}
    </div>
  )
}
