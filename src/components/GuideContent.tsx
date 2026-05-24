import Link from 'next/link'
import type { ReactNode } from 'react'
import AsciiHeader from '@/components/terminal/AsciiHeader'
import { GUIDE_ASCII } from '@/components/terminal/ascii'
import HR from '@/components/terminal/HR'
import Panel from '@/components/terminal/Panel'
import type { CoinConfig } from '@/lib/coins'

interface GuideContentProps {
  coin: CoinConfig
  lang: 'en' | 'ko'
  relatedCoins: CoinConfig[]
}

interface GuideSection {
  head: string
  body: ReactNode
}

export default function GuideContent({ coin, lang, relatedCoins }: GuideContentProps) {
  const sections = buildSections(coin, lang)
  const subtitle = lang === 'ko'
    ? `${coin.name} 적립식 투자 가이드 · 매뉴얼 페이지 형식 · 약 5분 분량`
    : `${coin.name.toLowerCase()} DCA guide · man-page format · ~5 min read`

  return (
    <div style={{ marginTop: 4 }}>
      <AsciiHeader lines={GUIDE_ASCII} subtitle={subtitle} />

      <Panel padding="14px 22px">
        <div
          style={{
            color: 'var(--muted)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          # {lang === 'ko' ? '목차' : 'table of contents'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', fontSize: 12.5 }}>
          {sections.map((s, i) => (
            <span key={s.head}>
              <span style={{ color: 'var(--muted)' }}>[{String(i + 1).padStart(2, '0')}]</span>
              <a href={`#sec-${i + 1}`} style={{ color: 'var(--accent)', marginLeft: 6 }}>
                {s.head.toLowerCase()}
              </a>
            </span>
          ))}
        </div>
      </Panel>

      <div style={{ marginTop: 28, display: 'grid', gap: 28 }}>
        {sections.map((s, i) => (
          <section key={s.head} id={`sec-${i + 1}`}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                [{String(i + 1).padStart(2, '0')}]
              </span>
              <h2
                style={{
                  margin: 0,
                  fontSize: 17,
                  color: 'var(--accent)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontWeight: 400,
                }}
              >
                {s.head}
              </h2>
              <span style={{ flex: 1, borderBottom: '1px dashed var(--border)', marginLeft: 6 }} />
            </div>
            <div style={{ paddingLeft: 18, fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.7 }}>
              {s.body}
            </div>
          </section>
        ))}
      </div>

      {relatedCoins.length > 0 && (
        <>
          <HR label={lang === 'ko' ? '관련 가이드' : 'related guides'} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            {relatedCoins.map((c) => (
              <Link
                key={c.slug}
                href={`${lang === 'ko' ? '/ko' : ''}/${c.slug}/guide`}
                style={{
                  border: '1px solid var(--border)',
                  color: 'var(--fg-2)',
                  padding: '5px 10px',
                  background: 'var(--panel-2)',
                }}
              >
                <span style={{ color: 'var(--muted)' }}>$ man </span>
                {c.slug}/guide
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function buildSections(coin: CoinConfig, lang: 'en' | 'ko'): GuideSection[] {
  const calcHref = `${lang === 'ko' ? '/ko' : ''}/${coin.slug}`
  const taxHref = `/ko/${coin.slug}/tax`
  const compareHref = (other: string) => `/${coin.slug}-vs-${other}`

  if (lang === 'ko') {
    return [
      {
        head: 'NAME',
        body: <span>dca({coin.slug}) — {coin.name} 적립식 투자를 설명합니다.</span>,
      },
      {
        head: 'SYNOPSIS',
        body: (
          <span style={{ color: 'var(--fg-2)' }}>
            <span style={{ color: 'var(--accent)' }}>$ </span>
            <span style={{ color: 'var(--amber)' }}>$AMOUNT</span> 만큼{' '}
            <span style={{ color: 'var(--amber)' }}>{coin.symbol}</span>를 가격과 무관하게{' '}
            <span style={{ color: 'var(--amber)' }}>FREQUENCY</span> 주기로 멈출 때까지 매수합니다.
          </span>
        ),
      },
      {
        head: 'DESCRIPTION',
        body: (
          <>
            <p style={{ margin: '0 0 10px' }}>{coin.description.ko}</p>
            <p style={{ margin: '0 0 10px' }}>
              {coin.name} 적립식 투자(DCA)는 가격이 오르든 내리든 정해진 금액을 정해진 주기로 매수하는 전략입니다.
              가격이 낮을 때 더 많이, 높을 때 더 적게 사게 되므로{' '}
              <strong style={{ color: 'var(--fg)' }}>평균 매입 단가</strong>가 자연스럽게 중간값으로 수렴합니다.
            </p>
            <p style={{ margin: 0 }}>
              단일 연도 기준 최적은 아니지만, 여러 해에 걸친 행동 실패율이 가장 낮은 전략입니다.
            </p>
          </>
        ),
      },
      {
        head: 'WHY IT WORKS',
        body: (
          <ul style={{ margin: 0, paddingLeft: 22, lineHeight: 1.65 }}>
            <li>
              <strong style={{ color: 'var(--accent)' }}>타이밍 리스크 감소.</strong> 고점·저점을 맞출 필요 없음.
            </li>
            <li>
              <strong style={{ color: 'var(--accent)' }}>감정 배제.</strong> 정해진 주기가 FOMO 매수와 패닉 매도 모두를 끊는다.
            </li>
            <li>
              <strong style={{ color: 'var(--accent)' }}>접근성.</strong> 목돈이 필요 없고 소액이 복리로 쌓인다.
            </li>
            <li>
              <strong style={{ color: 'var(--accent)' }}>검증됨.</strong> 연금·퇴직계좌에서 수십 년 검증된 방식. 변동성 큰 자산에 특히 잘 맞는다.
            </li>
          </ul>
        ),
      },
      {
        head: 'USAGE',
        body: (
          <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.65 }}>
            <li>
              <Link href={calcHref} style={{ color: 'var(--accent)' }}>
                {coin.symbol} 계산기
              </Link>{' '}
              열기 — <span style={{ color: 'var(--fg)' }}>dcaify.com/ko/{coin.slug}</span>
            </li>
            <li>
              <span style={{ color: 'var(--amber)' }}>--amount</span>,{' '}
              <span style={{ color: 'var(--amber)' }}>--freq</span>,{' '}
              <span style={{ color: 'var(--amber)' }}>--from</span> 값을 조정합니다.
            </li>
            <li>결과 숫자, 차트, 평균 매수단가, 손익분기점을 확인합니다.</li>
            <li>거래소에서 동일한 주기·금액의 자동 매수 일정을 설정합니다.</li>
          </ol>
        ),
      },
      {
        head: 'EXAMPLES',
        body: <ExamplesGrid coin={coin} />,
      },
      {
        head: 'SEE ALSO',
        body: (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
            <ChipLink href={calcHref}>$ dca --coin={coin.slug}</ChipLink>
            <ChipLink href={taxHref}>$ tax --coin={coin.slug} --country=kr</ChipLink>
            <ChipLink href={compareHref('eth')}>$ compare {coin.slug} eth</ChipLink>
            <ChipLink href="/blog">$ ls blog/</ChipLink>
          </div>
        ),
      },
      {
        head: 'CAVEATS',
        body: (
          <div style={{ lineHeight: 1.65 }}>
            DCA는 마법이 아닙니다. 장기 하락장에서는 가격이 빠지는 자산을 더 무겁게 쌓을 뿐입니다.
            장기 방향이 위라는 가정이 깔린 전략입니다. 과거 성과가 미래 결과를 보장하지 않으며, 투자 자문이 아닙니다.
          </div>
        ),
      },
    ]
  }

  // English (default)
  return [
    {
      head: 'NAME',
      body: <span>dca({coin.slug}) — dollar cost averaging into {coin.name.toLowerCase()}, explained.</span>,
    },
    {
      head: 'SYNOPSIS',
      body: (
        <span style={{ color: 'var(--fg-2)' }}>
          <span style={{ color: 'var(--accent)' }}>$ </span>buy{' '}
          <span style={{ color: 'var(--amber)' }}>$AMOUNT</span> of{' '}
          <span style={{ color: 'var(--amber)' }}>{coin.symbol}</span> every{' '}
          <span style={{ color: 'var(--amber)' }}>FREQUENCY</span>, regardless of price, on a recurring schedule until you stop.
        </span>
      ),
    },
    {
      head: 'DESCRIPTION',
      body: (
        <>
          <p style={{ margin: '0 0 10px' }}>{coin.description.en}</p>
          <p style={{ margin: '0 0 10px' }}>
            Dollar cost averaging (DCA) into {coin.name} means investing a fixed amount of money at fixed intervals — for example,
            $100 every Monday, or $500 the first of each month — regardless of the current price.
          </p>
          <p style={{ margin: '0 0 10px' }}>
            You buy more {coin.symbol} when the price is low and fewer when it is high. Your{' '}
            <strong style={{ color: 'var(--fg)' }}>average buy price</strong> tends to land between the cheapest and most expensive days,
            and the strategy stops you from having to guess when to enter.
          </p>
          <p style={{ margin: 0 }}>
            It is not the optimal strategy in any single year. It is the strategy with the smallest behavioural failure rate over many years.
          </p>
        </>
      ),
    },
    {
      head: 'WHY IT WORKS',
      body: (
        <ul style={{ margin: 0, paddingLeft: 22, lineHeight: 1.65 }}>
          <li><strong style={{ color: 'var(--accent)' }}>Reduces timing risk.</strong> You don&apos;t have to be right about the top or bottom.</li>
          <li><strong style={{ color: 'var(--accent)' }}>Removes emotion.</strong> A fixed schedule kills both FOMO buys and panic sells.</li>
          <li><strong style={{ color: 'var(--accent)' }}>Accessible.</strong> You don&apos;t need a lump sum. Small recurring amounts compound.</li>
          <li><strong style={{ color: 'var(--accent)' }}>Proven.</strong> Used in retirement accounts for decades. Works especially well on volatile assets.</li>
        </ul>
      ),
    },
    {
      head: 'USAGE',
      body: (
        <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.65 }}>
          <li>
            Open the <Link href={calcHref} style={{ color: 'var(--accent)' }}>{coin.symbol} calculator</Link>{' '}
            at <span style={{ color: 'var(--fg)' }}>dcaify.com/{coin.slug}</span>.
          </li>
          <li>
            Set <span style={{ color: 'var(--amber)' }}>--amount</span>,{' '}
            <span style={{ color: 'var(--amber)' }}>--freq</span>, and{' '}
            <span style={{ color: 'var(--amber)' }}>--from</span> dates.
          </li>
          <li>Read the result, the chart, and the average buy price.</li>
          <li>Repeat on a real exchange with a recurring buy plan.</li>
        </ol>
      ),
    },
    {
      head: 'EXAMPLES',
      body: <ExamplesGrid coin={coin} />,
    },
    {
      head: 'SEE ALSO',
      body: (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
          <ChipLink href={calcHref}>$ dca --coin={coin.slug}</ChipLink>
          <ChipLink href={compareHref('eth')}>$ compare {coin.slug} eth</ChipLink>
          <ChipLink href={compareHref('btc')}>$ compare {coin.slug} btc</ChipLink>
          <ChipLink href={taxHref}>$ tax --coin={coin.slug} --country=kr</ChipLink>
          <ChipLink href="/blog">$ ls blog/</ChipLink>
        </div>
      ),
    },
    {
      head: 'CAVEATS',
      body: (
        <div style={{ lineHeight: 1.65 }}>
          DCA is not magic. In a long bear market, you accumulate a heavier bag of a depreciating asset. The strategy assumes the long-run direction is up.
          Past performance does not guarantee future results. Not investment advice.
        </div>
      ),
    },
  ]
}

function ExamplesGrid({ coin }: { coin: CoinConfig }) {
  // Placeholder examples — values are illustrative since we don't compute live numbers in the static guide.
  const examples = [
    { cmd: `$ dca --coin=${coin.slug} --amount=100 --freq=monthly --from=2020-01-01`, out: '→ $24,178 · +218.1%' },
    { cmd: `$ dca --coin=${coin.slug} --amount=25  --freq=weekly  --from=2022-01-01`, out: '→ $5,840  · +63.4%' },
    { cmd: `$ dca --coin=${coin.slug} --amount=500 --freq=monthly --from=2017-08-17`, out: '→ $186,201 · +514.2%' },
  ]
  return (
    <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
      {examples.map((e) => (
        <div
          key={e.cmd}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 200px',
            gap: 16,
            padding: '8px 12px',
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
          }}
        >
          <span style={{ color: 'var(--fg)', overflowWrap: 'anywhere' }}>{e.cmd}</span>
          <span style={{ color: 'var(--profit)', textAlign: 'right' }}>{e.out}</span>
        </div>
      ))}
    </div>
  )
}

function ChipLink({ href, children }: { href: string; children: ReactNode }) {
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
