import { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { getKoreanTaxStatus } from '@/lib/tax-status'

export const metadata: Metadata = {
  title: 'DCAify 소개',
  description: 'DCAify는 비트코인, 이더리움 등 29개 이상의 암호화폐 적립식 투자(DCA) 수익을 계산하는 무료 도구입니다.',
}

export default function KoAboutPage() {
  const taxStatus = getKoreanTaxStatus('ko')

  return (
    <>
      <Nav lang="ko" />
      <main className="min-h-screen">
        <div className="max-w-[65ch] mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>DCAify 소개</h1>

          <div className="space-y-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            <p>
              DCAify는 무료 오픈소스 암호화폐 적립식 투자(DCA) 계산기입니다.
              29개 이상의 암호화폐에 대한 DCA 전략의 과거 성과를 정확하게 보여줍니다.
            </p>

            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>사용 방법</h2>
            <p>
              투자 금액, 주기, 기간을 입력하면 총 투자금, 포트폴리오 가치, 수익률,
              시간별 포트폴리오 성장 차트를 확인할 수 있습니다.
              한국 암호화폐 양도소득세를 고려한 손익분기점도 계산합니다.
            </p>

            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>데이터 출처</h2>
            <p>
              모든 가격 데이터는 세계 최대 암호화폐 거래소 중 하나인{' '}
              <a href="https://www.binance.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent)' }}>
                바이낸스 API
              </a>
              에서 직접 가져옵니다. 정확성을 위해 USDT 페어의 일일 종가를 사용합니다.
            </p>

            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>지원 코인</h2>
            <p>
              비트코인(BTC), 이더리움(ETH), 솔라나(SOL), BNB, XRP, 카르다노(ADA),
              도지코인(DOGE) 등 29개 이상의 암호화폐를 지원합니다.{' '}
              <Link href="/ko" className="hover:underline" style={{ color: 'var(--accent)' }}>홈페이지</Link>에서
              전체 목록을 확인하세요.
            </p>

            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>세금 분석</h2>
            <p>
              한국어 버전에서는 예정된 한국 가상자산 과세 시나리오를 반영한
              손익분기점 참고값을 제공합니다. {taxStatus.summary}
            </p>

            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>면책 조항</h2>
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
              DCAify는 정보 제공 목적의 교육 도구입니다. 금융, 투자 또는 세금 조언을
              구성하지 않습니다. 과거 성과는 미래 결과를 보장하지 않습니다.
              암호화폐 투자는 상당한 위험을 수반하며 전액 손실 가능성이 있습니다.
              투자 결정 전 항상 자체 조사를 수행하고 자격 있는 재무 상담사에게 문의하세요.
              세금 계산은 추정치이며, 구체적인 상황에 대해서는 세무 전문가에게 상담하세요.
            </p>

            <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>문의</h2>
            <p>
              질문이나 피드백이 있으시면{' '}
              <a href="mailto:hello@dcaify.com" className="hover:underline" style={{ color: 'var(--accent)' }}>
                hello@dcaify.com
              </a>
              으로 연락해주세요.
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
