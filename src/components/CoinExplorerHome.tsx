import Link from 'next/link'
import AsciiHeader from '@/components/terminal/AsciiHeader'
import CoinTable from '@/components/terminal/CoinTable'
import Crumb from '@/components/terminal/Crumb'
import HeroChart from '@/components/terminal/HeroChart'
import HR from '@/components/terminal/HR'
import PageShell from '@/components/terminal/PageShell'
import Panel from '@/components/terminal/Panel'
import Prompt from '@/components/terminal/Prompt'
import { formatPct, formatUsd } from '@/lib/formatters'
import type { HomeData, HomeBtcResult } from '@/lib/home-data'

const HOME_ASCII = [
  ' ____   ____    _     _   __',
  '|  _ \\ / ___|  / \\   (_) / _|_   _',
  '| | | | |     / _ \\  | || |_| | | |',
  '| |_| | |___ / ___ \\ | ||  _| |_| |',
  '|____/ \\____/_/   \\_\\|_||_|  \\__, |',
  '                              |___/',
]

const COPY = {
  en: {
    subtitle: 'honest, fast, reproducible · binance daily closes · every assumption visible',
    promptHint: '# press ↑ to recall · click any flag to edit · ⇥ to autocomplete coins',
    resolved: (n: number, freq: string, from: string, to: string) =>
      `→ resolved · ${n} ${freq} buys · ${from} → ${to}`,
    portfolioLabel: 'portfolio_value',
    roiLabel: 'roi vs',
    suggestions: ['$ dca --coin=eth', '$ dca --coin=sol --from=2021-01-01', '$ compare btc eth', '$ tax --country=kr', '$ man btc/guide'],
    sectionHeads: { method: '# method', trust: '# trust', korean: '# 한국어' },
    sectionBody: {
      method:
        'Daily closes from Binance public API. Buys placed at each scheduled close. Fees, slippage, and taxes are NOT applied to the headline number. Tax estimates live on per-coin pages.',
      trust:
        'Source code is open. Every flag in the URL is reproducible. Open any coin page to see the row of price data behind the result.',
      korean:
        '한국 거주자 양도세 시나리오는 코인별 페이지에서 250만 원 공제 후 22% 분리과세 가정으로 계산됩니다.',
    },
    legendPortfolio: 'portfolio',
    legendInvested: 'invested',
    nowLabel: 'now',
    fallback: 'Could not load live BTC prices. The coin table below still works.',
  },
  ko: {
    subtitle: '정직하고 빠르고 재현 가능합니다 · 바이낸스 일별 종가 · 모든 가정을 공개합니다',
    promptHint: '# ↑ 키로 이전 명령 · 어떤 플래그든 클릭해 편집 · ⇥ 키로 코인 자동완성',
    resolved: (n: number, freq: string, from: string, to: string) =>
      `→ 해석됨 · ${n}회 ${freq} 매수 · ${from} → ${to}`,
    portfolioLabel: '포트폴리오_가치',
    roiLabel: '수익률 대비',
    suggestions: ['$ dca --coin=eth', '$ dca --coin=sol --from=2021-01-01', '$ compare btc eth', '$ tax --country=kr', '$ man btc/guide'],
    sectionHeads: { method: '# 방법', trust: '# 신뢰', korean: '# 세금' },
    sectionBody: {
      method:
        '바이낸스 공개 API의 일별 종가를 사용합니다. 예약된 종가에 매수가 체결됩니다. 수수료, 슬리피지, 세금은 헤드라인 숫자에 포함되지 않으며, 세금 시나리오는 코인별 페이지에서 별도로 계산합니다.',
      trust:
        '소스 코드는 공개되어 있고, URL의 모든 플래그가 그대로 재현 가능합니다. 어떤 코인 페이지든 들어가서 매수마다의 가격 데이터를 확인할 수 있습니다.',
      korean:
        '한국 거주자 양도세 시나리오는 한국어 코인 페이지(`/ko/btc/tax` 등)에서 250만 원 공제 후 22% 분리과세 가정으로 계산됩니다.',
    },
    legendPortfolio: '포트폴리오',
    legendInvested: '투자원금',
    nowLabel: '현재',
    fallback: '실시간 BTC 가격을 불러오지 못했습니다. 아래 코인 테이블은 정상 동작합니다.',
  },
} as const

const FREQ_LABEL = {
  en: { daily: 'daily', weekly: 'weekly', monthly: 'monthly' },
  ko: { daily: '일별', weekly: '주별', monthly: '월별' },
} as const

interface CoinExplorerHomeProps {
  data: HomeData
  lang?: 'en' | 'ko'
}

export default function CoinExplorerHome({ data, lang = 'en' }: CoinExplorerHomeProps) {
  const copy = COPY[lang]
  return (
    <PageShell tab="home" lang={lang}>
      <Crumb path={lang === 'ko' ? '/ko' : '/'} />
      <AsciiHeader lines={HOME_ASCII} subtitle={copy.subtitle} />

      {data.btc ? (
        <HomeCalculator btc={data.btc} lang={lang} />
      ) : (
        <Panel>
          <div style={{ color: 'var(--loss)', fontSize: 13 }}>{copy.fallback}</div>
        </Panel>
      )}

      <CoinTable rows={data.rows} lang={lang} />

      <HR label={lang === 'ko' ? 'about · 면책 · 방법' : 'about · disclaimer · methods'} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 28,
          fontSize: 12.5,
          color: 'var(--fg-2)',
          lineHeight: 1.65,
        }}
      >
        <div>
          <div style={{ color: 'var(--accent)', marginBottom: 4 }}>{copy.sectionHeads.method}</div>
          {copy.sectionBody.method}
        </div>
        <div>
          <div style={{ color: 'var(--accent)', marginBottom: 4 }}>{copy.sectionHeads.trust}</div>
          {copy.sectionBody.trust}
        </div>
        <div>
          <div style={{ color: 'var(--accent)', marginBottom: 4 }}>{copy.sectionHeads.korean}</div>
          {copy.sectionBody.korean}
        </div>
      </div>
    </PageShell>
  )
}

function HomeCalculator({ btc, lang }: { btc: HomeBtcResult; lang: 'en' | 'ko' }) {
  const copy = COPY[lang]
  const freqLabel = FREQ_LABEL[lang][btc.frequency]
  const isProfit = btc.result.roi >= 0
  const delta = btc.result.currentValue - btc.result.totalInvested

  return (
    <Panel>
      <Prompt
        cmd="dca"
        args={[
          ['--coin', btc.coin.slug],
          ['--amount', btc.amount],
          ['--freq', btc.frequency],
          ['--from', btc.effectiveStartDate],
        ]}
      />
      <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{copy.promptHint}</div>

      <div
        style={{
          marginTop: 18,
          borderTop: '1px dashed var(--border)',
          paddingTop: 16,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
          gap: 32,
          alignItems: 'start',
        }}
      >
        <div>
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>
            {copy.resolved(btc.result.purchases.length, freqLabel, btc.effectiveStartDate, btc.endDate)}
          </div>
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                color: 'var(--muted)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {copy.portfolioLabel}
            </div>
            <HeroNumber value={btc.result.currentValue} />
            <div style={{ marginTop: 8, fontSize: 16, color: isProfit ? 'var(--profit)' : 'var(--loss)' }}>
              {delta >= 0 ? '+' : ''}{formatUsd(delta)}
              <span
                style={{
                  background: isProfit ? 'var(--accent-bg)' : 'rgba(255,92,68,0.12)',
                  padding: '2px 8px',
                  marginLeft: 10,
                  color: isProfit ? 'var(--profit)' : 'var(--loss)',
                }}
              >
                {formatPct(btc.result.roi)}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 10 }}>
                {copy.roiLabel} {formatUsd(btc.result.totalInvested)}
              </span>
            </div>
          </div>
          <MetricGrid btc={btc} lang={lang} />
        </div>
        <div>
          <HeroChart data={btc.series} height={240} />
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--muted)' }}>
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
              {copy.legendPortfolio}
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
              {copy.legendInvested}
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>{copy.nowLabel}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: '1px dashed var(--border)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          fontSize: 12,
        }}
      >
        {copy.suggestions.map((s) => (
          <SuggestionChip key={s} text={s} lang={lang} />
        ))}
      </div>
    </Panel>
  )
}

function HeroNumber({ value }: { value: number }) {
  const formatted = formatUsd(value)
  const decimalIndex = formatted.lastIndexOf('.')
  const integerPart = decimalIndex >= 0 ? formatted.slice(0, decimalIndex) : formatted
  const decimalPart = decimalIndex >= 0 ? formatted.slice(decimalIndex) : ''
  return (
    <div style={{ fontSize: 56, lineHeight: 1, letterSpacing: '-0.02em' }} className="tabular-nums">
      {integerPart}
      <span style={{ color: 'var(--muted)', fontSize: 22 }}>{decimalPart}</span>
    </div>
  )
}

function MetricGrid({ btc, lang }: { btc: HomeBtcResult; lang: 'en' | 'ko' }) {
  const slug = btc.coin.symbol.toLowerCase()
  const totalCoinsLabel = `${slug}_accumulated`
  const entries: Array<[string, string]> = [
    [lang === 'ko' ? '총_투자금' : 'total_invested', formatUsd(btc.result.totalInvested)],
    [totalCoinsLabel, btc.result.totalCoins.toFixed(6)],
    [lang === 'ko' ? '평균_매수단가' : 'avg_buy_price', formatUsd(btc.breakEvenPrice)],
    [lang === 'ko' ? '손익분기' : 'breakeven_price', formatUsd(btc.breakEvenPrice)],
    [lang === 'ko' ? '매수_횟수' : 'n_purchases', String(btc.result.purchases.length)],
    [lang === 'ko' ? '데이터' : 'data_source', 'binance · 1d'],
  ]
  return (
    <div
      className="tabular-nums"
      style={{
        marginTop: 22,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px 24px',
        fontSize: 13,
      }}
    >
      {entries.map(([k, v]) => (
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
  )
}

function SuggestionChip({ text, lang }: { text: string; lang: 'en' | 'ko' }) {
  // Best-effort mapping of `$ dca --coin=X` style suggestions to internal links.
  const basePath = lang === 'ko' ? '/ko' : ''
  let href: string | null = null
  const coinMatch = text.match(/--coin=([a-z0-9]+)/)
  const compareMatch = text.match(/^\$ compare\s+([a-z]+)\s+([a-z]+)/)
  const taxMatch = /tax\b/.test(text)
  const manMatch = text.match(/\$ man\s+([a-z0-9]+)\/guide/)

  if (compareMatch) href = `/${compareMatch[1]}-vs-${compareMatch[2]}`
  else if (taxMatch) href = '/ko/btc/tax'
  else if (manMatch) href = `${basePath}/${manMatch[1]}/guide`
  else if (coinMatch) href = `${basePath}/${coinMatch[1]}`

  const chipStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    color: 'var(--fg-2)',
    padding: '5px 10px',
    background: 'var(--panel-2)',
    fontSize: 12,
  }

  if (!href) {
    return <span style={chipStyle}>{text}</span>
  }
  return (
    <Link href={href} style={chipStyle}>
      {text}
    </Link>
  )
}
