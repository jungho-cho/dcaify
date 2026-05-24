import Link from 'next/link'
import type { ReactNode } from 'react'
import AsciiHeader from '@/components/terminal/AsciiHeader'
import { ABOUT_ASCII } from '@/components/terminal/ascii'
import HR from '@/components/terminal/HR'
import Panel from '@/components/terminal/Panel'

interface AboutContentProps {
  lang: 'en' | 'ko'
}

interface ChangelogEntry {
  v: string
  d: string
  n: string
}

export default function AboutContent({ lang }: AboutContentProps) {
  const isKo = lang === 'ko'
  const subtitle = isKo
    ? 'dcaify는 무료, 오픈소스 암호화폐 적립식 계산기 · 이 페이지는 colophon'
    : 'dcaify is a free, open-source crypto DCA calculator · this page is the colophon'

  return (
    <div style={{ marginTop: 4 }}>
      <AsciiHeader lines={ABOUT_ASCII} subtitle={subtitle} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 36,
          marginTop: 8,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: 'var(--fg-2)',
            lineHeight: 1.75,
            maxWidth: 680,
          }}
        >
          {isKo ? <KoBody /> : <EnBody />}
        </div>

        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <Panel>
            <PanelHeading text={isKo ? '# colophon' : '# colophon'} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '4px 12px',
                fontSize: 12.5,
              }}
            >
              {[
                ['stack', 'next.js 16 · react 19'],
                ['hosting', 'cloudflare workers'],
                ['data', 'binance public api'],
                ['cache', 'cloudflare kv · 1h'],
                ['typeface', 'JetBrains Mono'],
                ['theme', 'terminal v2'],
                ['source', 'github.com/dcaify'],
                ['license', 'MIT'],
              ].map(([k, v]) => (
                <ColophonRow key={k} k={k} v={v} />
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeading text={isKo ? '# 연락' : '# contact'} />
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              <ContactLine command="mail" target="hello@dcaify.com" href="mailto:hello@dcaify.com" />
              <ContactLine command="open" target="github.com/dcaify" href="https://github.com/dcaify" />
              <ContactLine command="open" target="x.com/dcaify" href="https://x.com/dcaify" />
            </div>
          </Panel>

          <Panel>
            <PanelHeading text={isKo ? '# 범위' : '# coverage'} />
            <div style={{ display: 'grid', gap: 4, fontSize: 12.5 }}>
              <CoverageRow k={isKo ? '코인' : 'coins'} v="29" />
              <CoverageRow k={isKo ? '최초 데이터' : 'earliest data'} v="2017-08-17" />
              <CoverageRow k={isKo ? '언어' : 'languages'} v="en · ko" />
              <CoverageRow k={isKo ? '비교 페이지' : 'comparisons'} v="406 pairs" />
            </div>
          </Panel>
        </div>
      </div>

      <HR label={isKo ? '변경 이력 · 최근 4건' : 'changelog · last 4'} />
      <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
        {CHANGELOG.map((entry) => (
          <ChangelogRow key={entry.v} entry={entry} lang={lang} />
        ))}
      </div>
    </div>
  )
}

const CHANGELOG: ChangelogEntry[] = [
  { v: 'v0.3.1', d: '2026-05-24', n: 'Terminal redesign rolled out. JetBrains Mono everywhere, lime accent, no border-radius.' },
  { v: 'v0.3.0', d: '2026-04-28', n: 'Coin grid redesigned. Sortable by 1y / 3y / 5y DCA return.' },
  { v: 'v0.2.4', d: '2026-04-09', n: 'BTC vs ETH comparison page added. 406 pair pages auto-generated.' },
  { v: 'v0.2.3', d: '2026-03-22', n: 'Korean tax scenario added. Break-even shows pre/post-tax side by side.' },
]

function PanelHeading({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: 'var(--muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 6,
      }}
    >
      {text}
    </div>
  )
}

function ColophonRow({ k, v }: { k: string; v: string }) {
  return (
    <>
      <span style={{ color: 'var(--muted)' }}>{k}</span>
      <span style={{ color: 'var(--fg-2)' }}>{v}</span>
    </>
  )
}

function CoverageRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--muted)' }}>{k}</span>
      <span>{v}</span>
    </div>
  )
}

function ContactLine({ command, target, href }: { command: string; target: string; href: string }) {
  return (
    <div>
      <span style={{ color: 'var(--accent)' }}>$ </span>
      {command}{' '}
      <a href={href} style={{ color: 'var(--fg)' }} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {target}
      </a>
    </div>
  )
}

function ChangelogRow({ entry, lang }: { entry: ChangelogEntry; lang: 'en' | 'ko' }) {
  void lang
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 100px 1fr',
        gap: 16,
        padding: '6px 0',
        borderBottom: '1px solid var(--faint)',
      }}
    >
      <span style={{ color: 'var(--amber)' }}>{entry.v}</span>
      <span style={{ color: 'var(--muted)' }}>{entry.d}</span>
      <span style={{ color: 'var(--fg-2)' }}>{entry.n}</span>
    </div>
  )
}

function H2({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 17,
        color: 'var(--accent)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginTop: 28,
        marginBottom: 12,
        fontWeight: 400,
      }}
    >
      {children}
    </h2>
  )
}

function EnBody() {
  return (
    <>
      <H2># what dcaify is</H2>
      <p>
        A free crypto dollar-cost-averaging calculator that backtests 29 coins using Binance daily closing prices. You enter an amount, a frequency,
        and a date range. We replay the daily prices and tell you what the bag would be worth today.
      </p>
      <p>
        Most DCA calculators stop at a number. DCAify shows the number, the assumptions behind it, and the things deliberately left out. Trust comes
        from what you can verify, not from how confident the headline looks.
      </p>

      <H2># what we deliberately do not do</H2>
      <ul style={{ paddingLeft: 22 }}>
        <li>No price predictions. We backtest, we do not forecast.</li>
        <li>No fees or slippage in the headline number. (Tax scenarios live on their own pages.)</li>
        <li>No &ldquo;score&rdquo; or &ldquo;rating&rdquo; of coins. We show data; you decide.</li>
        <li>No newsletter popups, no exit-intent modals, no &ldquo;you have 1 free check left.&rdquo;</li>
      </ul>

      <H2># korean tax scenarios · 한국어</H2>
      <p>
        한국 거주자를 위한 가상자산 양도세 시나리오를{' '}
        <Link href="/ko/btc/tax" style={{ color: 'var(--accent)' }}>
          별도 페이지
        </Link>
        에서 제공합니다. 연 250만 원 공제 후 22% 분리과세 가정으로 손익분기점과 실수령 수익을 함께 보여줍니다. 시행 시점은 두 차례 유예되었으며, 신고 전 최신 공지를 반드시 확인하세요.
      </p>

      <H2># disclaimer</H2>
      <p style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.7 }}>
        DCAify is an educational tool for informational purposes only. It does not constitute financial, investment, or tax advice. Past performance does not
        guarantee future results. Cryptocurrency investments carry significant risk and you may lose your entire investment. Always do your own research and consult
        a qualified financial or tax advisor before making investment decisions.
      </p>
    </>
  )
}

function KoBody() {
  return (
    <>
      <H2># 이 도구는 무엇인가</H2>
      <p>
        29개 암호화폐의 적립식 투자(DCA) 결과를 바이낸스 일별 종가 데이터로 재현하는 무료 계산기입니다. 금액·주기·기간을 입력하면 그날그날의 가격으로 재구성한 현재 가치를 보여줍니다.
      </p>
      <p>
        대부분의 계산기는 숫자에서 멈춥니다. DCAify는 숫자 옆에 그 숫자가 어떤 가정 위에 만들어졌는지, 무엇을 일부러 빼두었는지를 함께 보여줍니다. 신뢰는 자신감 있는 헤드라인이 아니라 검증 가능한 가정에서 옵니다.
      </p>

      <H2># 이 도구가 하지 않는 것</H2>
      <ul style={{ paddingLeft: 22 }}>
        <li>가격 예측. 백테스트만 하고 미래 예측은 하지 않습니다.</li>
        <li>헤드라인 숫자에 수수료·슬리피지를 포함시키지 않습니다. 세금 시나리오는 별도 페이지.</li>
        <li>코인에 점수나 등급을 매기지 않습니다. 데이터만 보여주고 판단은 사용자가 합니다.</li>
        <li>뉴스레터 팝업, 종료 모달, &ldquo;무료 체크 1회 남음&rdquo; 같은 어둠의 패턴 없음.</li>
      </ul>

      <H2># 한국 세금 시나리오</H2>
      <p>
        한국 거주자를 위한 가상자산 양도세 시나리오를{' '}
        <Link href="/ko/btc/tax" style={{ color: 'var(--accent)' }}>
          별도 페이지
        </Link>
        에서 제공합니다. 연 250만 원 공제 후 22% 분리과세 가정으로 손익분기점과 실수령 수익을 함께 보여줍니다. 시행 시점은 두 차례 유예되었으며, 신고 전 최신 공지를 반드시 확인하세요.
      </p>

      <H2># 면책</H2>
      <p style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.7 }}>
        DCAify는 정보 제공 목적의 교육 도구입니다. 금융, 투자 또는 세금 자문이 아닙니다. 과거 성과가 미래 결과를 보장하지 않으며, 암호화폐 투자에는 큰 손실 위험이 따릅니다. 투자 결정 전 반드시 직접 조사하고 자격 있는 전문가와 상담하세요.
      </p>
    </>
  )
}
