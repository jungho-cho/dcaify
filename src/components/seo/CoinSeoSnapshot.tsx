import Link from 'next/link'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { formatPct, formatUsd } from '@/lib/formatters'
import type { CoinSeoSnapshot, SeoScenario } from '@/lib/dca-scenarios'

interface CoinSeoSnapshotViewProps {
  snapshot: CoinSeoSnapshot
}

type SuccessfulCoinSeoSnapshot = Extract<CoinSeoSnapshot, { ok: true }>

function formatMonthlyAmount(value: number): string {
  return formatUsd(value).replace('.00', '')
}

function coinTitle(snapshot: SuccessfulCoinSeoSnapshot): string {
  if (snapshot.lang === 'ko' && snapshot.coin.slug === 'btc') {
    return '비트코인 적립식 투자 계산기'
  }

  return `${snapshot.coin.name} DCA Calculator`
}

function defaultLead(snapshot: SuccessfulCoinSeoSnapshot): string {
  const scenario = snapshot.defaultScenario
  if (snapshot.lang === 'ko') {
    return `월 ${formatMonthlyAmount(scenario.amount)}씩 ${snapshot.coin.name}를 적립식으로 매수한 달러 기준 백테스트입니다.`
  }

  return `If you invested ${formatMonthlyAmount(scenario.amount)}/month in ${snapshot.coin.name}, this is the historical DCA result using Binance daily closes.`
}

function faqItems(snapshot: SuccessfulCoinSeoSnapshot) {
  if (snapshot.lang === 'ko') {
    return [
      {
        question: '비트코인 적립식 투자는 어떤 방식인가요?',
        answer: '정해진 금액을 정기적으로 매수해 진입 시점 리스크를 나누는 방식입니다. 이 페이지의 기본 결과는 달러 기준 월별 매수 백테스트입니다.',
      },
      {
        question: 'DCAify의 비트코인 결과는 투자 조언인가요?',
        answer: '아닙니다. DCAify는 과거 가격 기준 계산 도구이며 금융, 투자, 세금 조언을 제공하지 않습니다.',
      },
      {
        question: '한국 세금 시나리오는 어디서 볼 수 있나요?',
        answer: '예상 세금 시나리오는 별도 세금 페이지에서 참고용으로 확인할 수 있습니다. 실제 신고 전에는 최신 공식 자료를 확인해야 합니다.',
      },
    ]
  }

  return [
    {
      question: `What does ${snapshot.coin.name} DCA mean?`,
      answer: `It means buying ${snapshot.coin.name} on a recurring schedule, such as investing $100 every month, instead of trying to pick one perfect entry price.`,
    },
    {
      question: `Is this ${snapshot.coin.name} DCA result live?`,
      answer: 'The SEO snapshot uses Binance daily close data fetched on the server. The interactive calculator below can be used to change the amount, frequency, and date range.',
    },
    {
      question: 'Is DCAify financial advice?',
      answer: 'No. DCAify is an educational calculator for historical backtests, not financial, tax, or investment advice.',
    },
  ]
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}
    >
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function ScenarioRow({ scenario }: { scenario: SeoScenario }) {
  return (
    <tr>
      <td className="py-2 pr-4">{scenario.label}</td>
      <td className="py-2 pr-4 tabular-nums">{formatUsd(scenario.amount)}</td>
      <td className="py-2 pr-4 tabular-nums">{formatUsd(scenario.result.totalInvested)}</td>
      <td className="py-2 pr-4 tabular-nums">{formatUsd(scenario.result.currentValue)}</td>
      <td className="py-2 tabular-nums">{formatPct(scenario.result.roi)}</td>
    </tr>
  )
}

export default function CoinSeoSnapshotView({ snapshot }: CoinSeoSnapshotViewProps) {
  if (!snapshot.ok) {
    return (
      <section
        className="mb-6 p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}
      >
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {snapshot.lang === 'ko' ? `${snapshot.coin.name} 적립식 투자 계산기` : `${snapshot.coin.name} DCA Calculator`}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {snapshot.lang === 'ko'
            ? '최근 가격 데이터를 불러오지 못했습니다. 아래 계산기에서 직접 조건을 입력해 다시 시도할 수 있습니다.'
            : 'Recent price data could not be loaded. You can still use the calculator below to run a custom backtest.'}
        </p>
      </section>
    )
  }

  const title = coinTitle(snapshot)
  const scenario = snapshot.defaultScenario
  const faqs = faqItems(snapshot)
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <section className="mb-8 space-y-6">
      <JsonLdScript data={faqJsonLd} />
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--accent)' }}>
          {snapshot.lang === 'ko' ? '달러 기준 DCA 백테스트' : 'DCA backtest from daily closes'}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          {defaultLead(snapshot)}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultCard label={snapshot.lang === 'ko' ? '총 투자금' : 'Total invested'} value={formatUsd(scenario.result.totalInvested)} />
        <ResultCard label={snapshot.lang === 'ko' ? '현재 가치' : 'Current value'} value={formatUsd(scenario.result.currentValue)} />
        <ResultCard label={snapshot.lang === 'ko' ? '수익률' : 'Return'} value={formatPct(scenario.result.roi)} />
        <ResultCard label={snapshot.lang === 'ko' ? '매수 횟수' : 'Purchases'} value={String(snapshot.risk.purchaseCount)} />
      </div>

      <div
        className="overflow-x-auto p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}
      >
        <h2 className="text-xl font-semibold mb-3">Scenario table</h2>
        <table className="w-full text-sm">
          <thead style={{ color: 'var(--text-muted)' }}>
            <tr>
              <th className="text-left py-2 pr-4">Window</th>
              <th className="text-left py-2 pr-4">Monthly</th>
              <th className="text-left py-2 pr-4">Invested</th>
              <th className="text-left py-2 pr-4">Value</th>
              <th className="text-left py-2">ROI</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.scenarioMatrix.map((item) => (
              <ScenarioRow key={`${item.label}-${item.amount}`} scenario={item} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h2 className="text-xl font-semibold mb-2">DCA vs lump sum</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            DCA value: {formatUsd(snapshot.dcaVsLumpSum.dcaValue)}. Lump-sum value: {formatUsd(snapshot.dcaVsLumpSum.lumpSumValue)}. Difference: {formatUsd(snapshot.dcaVsLumpSum.difference)}.
          </p>
        </div>
        <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <h2 className="text-xl font-semibold mb-2">{snapshot.lang === 'ko' ? '리스크 지표' : 'Risk metrics'}</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Average buy price: {formatUsd(snapshot.risk.averageBuyPrice)}. Current price: {formatUsd(snapshot.risk.currentPrice)}. Asset max drawdown: {formatPct(snapshot.risk.maxDrawdownPct)}.
          </p>
        </div>
      </div>

      {snapshot.lang === 'ko' && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          세금 시나리오는 <Link href="/ko/btc/tax" style={{ color: 'var(--accent)' }}>비트코인 세금 분석</Link>에서 별도로 확인할 수 있습니다.
        </p>
      )}

      <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <h2 className="text-xl font-semibold mb-3">{snapshot.lang === 'ko' ? '자주 묻는 질문' : 'Frequently asked questions'}</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
