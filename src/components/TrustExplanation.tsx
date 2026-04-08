import type { CoinConfig } from '@/lib/coins'
import type { DcaResult } from '@/lib/dca'
import { formatPct, formatUsd } from '@/lib/formatters'
import { summarizeDcaOutcome } from '@/lib/result-interpretation'
import type { Lang } from '@/lib/strings'

interface TrustExplanationProps {
  coin: CoinConfig
  lang?: Lang
  result: DcaResult
  amountPerPeriod: number
  breakEvenPrice?: number
  dataSource: 'live' | 'cache' | 'stale'
  normalizedStartDate?: string | null
}

export default function TrustExplanation({
  coin,
  lang = 'en',
  result,
  amountPerPeriod,
  breakEvenPrice,
  dataSource,
  normalizedStartDate,
}: TrustExplanationProps) {
  const summary = summarizeDcaOutcome(result)
  const freshnessLabel =
    dataSource === 'live'
      ? lang === 'ko'
        ? '이번 계산에는 최신 가격 데이터를 사용했습니다.'
        : 'This run used fresh price data from the live provider.'
      : dataSource === 'stale'
        ? lang === 'ko'
          ? '일시적인 공급자 문제로 최신이 아닐 수 있는 데이터를 사용했습니다.'
          : 'This run used fallback data that may be slightly out of date.'
        : lang === 'ko'
          ? '캐시된 가격 데이터를 사용해 응답 속도를 높였습니다.'
          : 'This run used cached price data for a faster response.'

  const interpretationLines =
    lang === 'ko'
      ? [
          `${formatUsd(result.totalInvested)}를 ${result.purchases.length}번에 나눠 투자했고, 현재 가치는 ${formatUsd(result.currentValue)}입니다.`,
          summary.outcome === 'flat'
            ? '현재 기준으로는 거의 본전 수준입니다.'
            : summary.outcome === 'profit'
              ? `지금까지 ${formatPct(result.roi)} 수익 구간입니다.`
              : `지금까지 ${formatPct(result.roi)} 손실 구간입니다.`,
          breakEvenPrice
            ? `${coin.symbol} 가격이 ${formatUsd(breakEvenPrice)}에 도달하면 원금 기준 손익분기점에 도달합니다.`
            : '아직 충분한 매수 데이터가 없어 손익분기점을 계산할 수 없습니다.',
        ]
      : [
          `You invested ${formatUsd(result.totalInvested)} across ${result.purchases.length} purchases, and the position is now worth ${formatUsd(result.currentValue)}.`,
          summary.outcome === 'flat'
            ? 'At the moment, this backtest is sitting close to flat.'
            : summary.outcome === 'profit'
              ? `That puts the strategy at ${formatPct(result.roi)} so far.`
              : `That leaves the strategy at ${formatPct(result.roi)} so far.`,
          breakEvenPrice
            ? `${coin.symbol} would need to trade at ${formatUsd(breakEvenPrice)} for you to get back to break-even on principal.`
            : 'There is not enough purchase data yet to calculate a break-even price.',
        ]

  return (
    <section
      className="space-y-3 text-sm leading-relaxed"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--text-muted)',
        padding: '20px',
      }}
    >
      <div className="space-y-1">
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
          {lang === 'ko' ? '이 계산을 믿어도 되는 이유' : 'How this result was calculated'}
        </h3>
        <p>
          {lang === 'ko'
            ? `${coin.name}의 일별 종가 데이터를 기준으로, 매 ${formatUsd(amountPerPeriod)}씩 같은 주기로 매수했다고 가정했습니다.`
            : `We used ${coin.name} daily closing prices and assumed a recurring buy of ${formatUsd(amountPerPeriod)} on the schedule you selected.`}
        </p>
      </div>

      {normalizedStartDate && (
        <p className="text-xs" style={{ color: 'var(--warning)' }}>
          {lang === 'ko'
            ? `비교 가능한 데이터가 ${normalizedStartDate}부터 시작되어 그 날짜를 기준으로 계산했습니다.`
            : `The first comparable price data starts on ${normalizedStartDate}, so the calculation was normalized to that date.`}
        </p>
      )}

      <ul className="space-y-2">
        {interpretationLines.map((line) => (
          <li key={line}>• {line}</li>
        ))}
      </ul>

      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
        {freshnessLabel}
      </p>
    </section>
  )
}
