'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Link from 'next/link'
import TaxStatusBanner from '@/components/TaxStatusBanner'
import TrustExplanation from '@/components/TrustExplanation'
import { trackEvent } from '@/lib/analytics'
import { getCalculatorErrorMessage } from '@/lib/calculator-errors'
import { type DcaResult, calculateBreakEven, calculateDca, type Frequency } from '@/lib/dca'
import { formatPct, formatUsd } from '@/lib/formatters'
import type { CoinConfig } from '@/lib/coins'
import { fetchPricesForRange } from '@/lib/prices-client'
import { getKoreanTaxStatus } from '@/lib/tax-status'
import { type Lang, getStrings } from '@/lib/strings'

interface Props {
  defaultCoin: CoinConfig
  lang?: Lang
  relatedCoins?: CoinConfig[]
  analyticsContext?: 'coin_calculator' | 'tax_page'
  showTaxBanner?: boolean
}

type UiState = 'initial' | 'loading' | 'success' | 'error' | 'rate_limited'

const ds = {
  surface: '#141926',
  border: '#1E293B',
  textMuted: '#64748B',
  textFaint: '#475569',
  accent: '#38BDF8',
  profit: '#34D399',
  profitBg: 'rgba(6, 78, 59, 0.25)',
  profitStroke: '#10B981',
  loss: '#F87171',
  lossBg: 'rgba(69, 10, 10, 0.25)',
  lossStroke: '#EF4444',
  grid: '#1E293B',
  tooltipBg: '#141926',
}

export default function DcaCalculator({
  defaultCoin,
  lang = 'en',
  relatedCoins,
  analyticsContext = 'coin_calculator',
  showTaxBanner = lang === 'ko',
}: Props) {
  const s = getStrings(lang)
  const taxStatus = getKoreanTaxStatus(lang)
  const coin = defaultCoin

  const [amount, setAmount] = useState('100')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [startDate, setStartDate] = useState(() => (coin.listingDate > '2020-01-01' ? coin.listingDate : '2020-01-01'))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [uiState, setUiState] = useState<UiState>('initial')
  const [result, setResult] = useState<DcaResult | null>(null)
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'stale'>('cache')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [partialWarning, setPartialWarning] = useState<string | null>(null)
  const [effectiveStartDate, setEffectiveStartDate] = useState<string | null>(null)
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

  const handleCalculate = async () => {
    setValidationError(null)
    setPartialWarning(null)
    setEffectiveStartDate(null)
    setErrorMsg(null)

    const validationMessage = validate()
    if (validationMessage) {
      setValidationError(validationMessage)
      return
    }

    setUiState('loading')
    const parsedAmount = parseFloat(amount)

    trackEvent('calculator_submit', {
      context: analyticsContext,
      coin: coin.slug,
      lang,
      frequency,
    })
    if (analyticsContext === 'tax_page') {
      trackEvent('tax_page_calculate_click', { coin: coin.slug })
    }

    try {
      const response = await fetchPricesForRange({ coinId: coin.id, from: startDate, to: endDate })

      if (!response.ok) {
        const message = getCalculatorErrorMessage(response.category, lang, response.payload)
        setErrorMsg(message)
        setUiState(response.category === 'rate_limited' ? 'rate_limited' : 'error')
        trackEvent('calculator_error', {
          context: analyticsContext,
          coin: coin.slug,
          lang,
          category: response.category,
        })
        return
      }

      setDataSource(response.data.dataSource)
      if (response.data.prices.length === 0) {
        setErrorMsg(getCalculatorErrorMessage('no_data', lang))
        setUiState('error')
        trackEvent('calculator_error', {
          context: analyticsContext,
          coin: coin.slug,
          lang,
          category: 'no_data',
        })
        return
      }

      const firstPriceDate = new Date(response.data.prices[0].timestamp).toISOString().slice(0, 10)
      if (firstPriceDate > startDate) {
        setEffectiveStartDate(firstPriceDate)
        setPartialWarning(s.partialWarning(coin.name, firstPriceDate))
      }

      const currentPrice = response.data.prices[response.data.prices.length - 1].price
      const dcaResult = calculateDca({
        prices: response.data.prices,
        amountPerPeriod: parsedAmount,
        frequency,
        startDate,
        endDate,
        currentPrice,
      })

      setResult(dcaResult)
      setUiState('success')
      trackEvent('calculator_success', {
        context: analyticsContext,
        coin: coin.slug,
        lang,
        data_source: response.data.dataSource,
      })
    } catch {
      setErrorMsg(getCalculatorErrorMessage('unknown', lang))
      setUiState('error')
      trackEvent('calculator_error', {
        context: analyticsContext,
        coin: coin.slug,
        lang,
        category: 'unknown',
      })
    }
  }

  const chartData = useMemo(() => {
    if (!result) return []

    const pricePerCoin = result.totalCoins > 0 ? result.currentValue / result.totalCoins : 0
    let cumulativeCoins = 0
    let cumulativeInvested = 0

    return result.purchases.map((purchase) => {
      cumulativeCoins += purchase.coins
      cumulativeInvested += purchase.amount
      return {
        date: purchase.date,
        value: parseFloat((cumulativeCoins * pricePerCoin).toFixed(2)),
        invested: parseFloat(cumulativeInvested.toFixed(2)),
      }
    })
  }, [result])

  const breakEven = result && result.totalCoins > 0
    ? calculateBreakEven(result.totalInvested, result.totalCoins, lang === 'ko' ? 0.22 : 0)
    : null

  const isProfit = result ? result.roi >= 0 : false
  const today = new Date().toISOString().slice(0, 10)
  const isHistorical = endDate < today
  const shareText = result
    ? s.shareText(coin.name, formatUsd(parseFloat(amount)), s[frequency], formatPct(result.roi), formatUsd(result.currentValue))
    : ''
  const langPrefix = lang === 'ko' ? '/ko' : ''

  const faqItems = lang === 'ko'
    ? [
        {
          question: '적립식 투자(DCA)란 무엇인가요?',
          answer: `적립식 투자(Dollar Cost Averaging)는 가격에 관계없이 정기적으로 일정 금액을 투자하는 전략입니다. 예를 들어 매달 10만 원씩 ${coin.name}을 매수하면, 고점과 저점 모두에서 매수하여 평균 매입 단가를 낮출 수 있습니다.`,
        },
        {
          question: `${coin.name}에 매달 얼마를 투자해야 하나요?`,
          answer: '투자 금액은 개인의 재정 상황에 따라 다릅니다. 잃어도 괜찮은 금액부터 시작하세요. 중요한 건 금액보다 꾸준함입니다.',
        },
        {
          question: '언제 시작하는 게 가장 좋나요?',
          answer: 'DCA의 핵심은 시장 타이밍을 맞추지 않는 것입니다. 완벽한 진입 시점을 찾기보다, 감당 가능한 금액으로 지금부터 일관되게 시작하는 편이 더 현실적입니다.',
        },
        {
          question: '한국 세금은 어떻게 반영하나요?',
          answer: `${taxStatus.faqLine} 손익분기점은 참고용 시나리오이며, 실제 신고 전에 최신 공지를 다시 확인해야 합니다.`,
        },
      ]
    : [
        {
          question: 'What is Dollar Cost Averaging (DCA)?',
          answer: `DCA means investing a fixed amount on a recurring schedule, regardless of price. For ${coin.name}, that could be $100 every month or $25 every week.`,
        },
        {
          question: `How much should I invest in ${coin.name}?`,
          answer: 'Use an amount you can repeat comfortably. The useful habit is consistency, not heroically sizing one perfect buy.',
        },
        {
          question: 'Is DCA better than lump-sum investing?',
          answer: 'Lump sum often wins statistically, but DCA wins on repeatability. It reduces timing risk and makes volatile assets easier to hold through.',
        },
        {
          question: 'What does the break-even price mean?',
          answer: `It is the price ${coin.symbol} needs to reach for you to recover your principal. Korean pages also show an estimated tax-aware scenario using the current DCAify tax assumptions.`,
        },
      ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          {coin.name} DCA {lang === 'ko' ? '계산기' : 'Calculator'}
        </h1>
        <p style={{ color: ds.textMuted, fontSize: '0.875rem' }}>{s.tagline(coin.name)}</p>
      </div>

      <div className="p-5 space-y-4" style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>{s.investmentLabel}</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="100"
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>{s.frequencyLabel}</label>
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value as Frequency)}
              className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
            >
              <option value="daily">{s.daily}</option>
              <option value="weekly">{s.weekly}</option>
              <option value="monthly">{s.monthly}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>{s.startDate}</label>
            <input
              type="date"
              value={startDate}
              min={coin.listingDate}
              max={endDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: ds.textMuted }}>{s.endDate}</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
            />
          </div>
        </div>

        {validationError && <p className="text-sm" style={{ color: ds.loss }}>{validationError}</p>}

        <button
          onClick={handleCalculate}
          disabled={uiState === 'loading'}
          className="w-full font-semibold py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: ds.accent, color: '#0B0F19', borderRadius: 'var(--radius-lg)' }}
        >
          {uiState === 'loading' ? s.calculating : s.calculateBtn}
        </button>
      </div>

      {uiState === 'initial' && (
        <div className="p-8 text-center border-dashed" style={{ border: `1px dashed ${ds.border}`, borderRadius: 'var(--radius-lg)', color: ds.textFaint }}>
          <p className="text-sm">
            {lang === 'ko'
              ? `위 설정을 확인하고 "${s.calculateBtn}"를 눌러 ${coin.name} 적립식 투자 결과를 확인하세요.`
              : `Set the schedule above, then hit "${s.calculateBtn}" to see your ${coin.name} DCA result.`}
          </p>
        </div>
      )}

      {uiState === 'loading' && (
        <div className="space-y-4 animate-pulse">
          <div className="h-28" style={{ background: ds.surface, borderRadius: 'var(--radius-lg)' }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-20" style={{ background: ds.surface, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
          <div className="h-64" style={{ background: ds.surface, borderRadius: 'var(--radius-lg)' }} />
        </div>
      )}

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

      {uiState === 'success' && result && (
        <div className="space-y-4">
          <div className="p-6 text-center" style={{ background: isProfit ? ds.profitBg : ds.lossBg, border: `1px solid ${isProfit ? ds.profit : ds.loss}30`, borderRadius: 'var(--radius-lg)' }}>
            <p className="text-sm mb-1" style={{ color: ds.textMuted }}>{s.returnLabel}</p>
            <p className="text-4xl sm:text-5xl font-bold tabular-nums" style={{ color: isProfit ? ds.profit : ds.loss, fontFamily: 'var(--font-display)' }}>
              {formatPct(result.roi)}
            </p>
            <p className="text-sm mt-2 tabular-nums" style={{ color: ds.textMuted }}>
              {formatUsd(result.totalInvested)} → {formatUsd(result.currentValue)}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: s.totalInvested, value: formatUsd(result.totalInvested) },
              { label: isHistorical ? (lang === 'ko' ? '종료일 가치' : 'Value at end date') : s.currentValue, value: formatUsd(result.currentValue) },
              { label: `${coin.symbol} ${s.accumulated}`, value: result.totalCoins.toFixed(6) },
              { label: lang === 'ko' ? '매수 횟수' : 'Purchases', value: String(result.purchases.length) },
            ].map((card) => (
              <div key={card.label} className="p-4" style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)' }}>
                <p className="text-xs mb-1" style={{ color: ds.textMuted }}>{card.label}</p>
                <p className="text-lg font-bold tabular-nums">{card.value}</p>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="p-4" style={{ borderRadius: 'var(--radius-lg)' }}>
              <h3 className="text-sm mb-4" style={{ color: ds.textMuted }}>{s.chartTitle}</h3>
              <ResponsiveContainer width="100%" height={240} className="sm:!h-[288px]">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={ds.grid} />
                  <XAxis dataKey="date" tick={{ fill: ds.textMuted, fontSize: 11 }} tickFormatter={(value: string) => value.slice(0, 7)} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: ds.textMuted, fontSize: 11 }} tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`} width={55} />
                  <Tooltip
                    contentStyle={{ backgroundColor: ds.tooltipBg, border: `1px solid ${ds.border}`, borderRadius: 8 }}
                    labelStyle={{ color: ds.textMuted }}
                    formatter={(value, name) => [formatUsd(Number(value)), name === 'value' ? s.portfolioValue : s.totalInvested]}
                  />
                  <Area type="monotone" dataKey="invested" stroke={ds.textFaint} fill={ds.surface} strokeWidth={1} />
                  <Area type="monotone" dataKey="value" stroke={isProfit ? ds.profitStroke : ds.lossStroke} fill={isProfit ? 'rgba(6, 78, 59, 0.3)' : 'rgba(69, 10, 10, 0.3)'} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

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
                    <p className="text-xs" style={{ color: ds.textFaint }}>{taxStatus.shortLabel}</p>
                    <p className="text-base font-semibold tabular-nums">{formatUsd(breakEven.breakEvenWithTax)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {showTaxBanner && <TaxStatusBanner lang={lang} compact />}

          <TrustExplanation
            coin={coin}
            lang={lang}
            result={result}
            amountPerPeriod={parseFloat(amount)}
            breakEvenPrice={breakEven?.breakEvenPrice}
            dataSource={dataSource}
            normalizedStartDate={effectiveStartDate}
          />

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm font-medium py-3 transition-colors"
            style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)', color: 'var(--text)' }}
          >
            {s.shareBtn}
          </a>
        </div>
      )}

      <div className="p-5 space-y-4 text-sm leading-relaxed" style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)', color: ds.textMuted }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          {lang === 'ko' ? `왜 ${coin.name}에 적립식 투자를 할까요?` : `Why DCA into ${coin.name}?`}
        </h2>
        <p>{coin.description[lang === 'ko' ? 'ko' : 'en']}</p>
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
          {lang === 'ko' ? `${coin.name} 적립식 투자 시작하기` : `How to start DCA into ${coin.name}`}
        </h3>
        <ol className="list-decimal list-inside space-y-1">
          {lang === 'ko' ? (
            <>
              <li>암호화폐 거래소에서 반복 매수 일정을 정합니다.</li>
              <li>감당 가능한 금액으로 꾸준히 매수합니다.</li>
              <li>이 계산기로 수익률과 손익분기점을 주기적으로 점검합니다.</li>
            </>
          ) : (
            <>
              <li>Set a recurring buy plan on the exchange you already trust.</li>
              <li>Use an amount you can repeat without stress.</li>
              <li>Use this calculator to review the result and break-even level over time.</li>
            </>
          )}
        </ol>
      </div>

      <div className="p-5 space-y-4 text-sm leading-relaxed" style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)', color: ds.textMuted }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
          {lang === 'ko' ? '자주 묻는 질문' : 'Frequently asked questions'}
        </h2>
        {faqItems.map((faq) => (
          <details key={faq.question} className="group">
            <summary className="cursor-pointer font-medium py-2 list-none flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <span className="text-xs transition-transform group-open:rotate-90" style={{ color: ds.accent }}>▶</span>
              {faq.question}
            </summary>
            <p className="pl-5 pb-2">{faq.answer}</p>
          </details>
        ))}
      </div>

      {relatedCoins && relatedCoins.length > 0 && (
        <div className="p-4" style={{ background: ds.surface, border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-lg)' }}>
          <h3 className="text-sm mb-3" style={{ color: ds.textMuted }}>{lang === 'ko' ? '다른 코인 DCA 계산기' : 'Other DCA Calculators'}</h3>
          <div className="flex gap-2 flex-wrap">
            {relatedCoins.map((relatedCoin) => (
              <Link
                key={relatedCoin.id}
                href={`${langPrefix}/${relatedCoin.slug}`}
                className="px-3 py-1.5 text-sm font-medium transition-colors"
                style={{ background: 'var(--bg)', border: `1px solid ${ds.border}`, borderRadius: 'var(--radius-sm)', color: ds.textMuted }}
              >
                {relatedCoin.symbol}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
