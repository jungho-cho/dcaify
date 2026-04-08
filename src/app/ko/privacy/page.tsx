import { Metadata } from 'next'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'DCAify 개인정보처리방침 — 데이터 수집 및 처리 방식 안내.',
}

export default function KoPrivacyPage() {
  return (
    <>
      <Nav lang="ko" />
      <main className="min-h-screen">
        <div className="max-w-[65ch] mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>개인정보처리방침</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-faint)' }}>최종 수정일: 2026년 3월 27일</p>

          <div className="space-y-6 leading-relaxed text-sm" style={{ color: 'var(--text-muted)' }}>
            <section>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>수집하는 정보</h2>
              <p>DCAify는 서비스 운영을 위해 최소한의 데이터를 수집합니다:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>사이트 사용 분석:</strong> Google Analytics 4를 사용해 페이지 조회, 유입 경로, 계산 실행, 비교 실행, 검색 실패 후 복구 클릭 같은 핵심 제품 이벤트를 집계합니다.</li>
                <li><strong>계산기 입력:</strong> 투자 금액, 주기, 기간은 브라우저에서만 처리됩니다. 이 데이터는 서버로 전송되거나 저장되지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>데이터 사용 목적</h2>
              <p>집계된 사용 데이터는 어떤 진입 페이지와 계산 흐름이 실제로 유용한지 파악하여 서비스를 개선하는 데 사용됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>제3자 서비스</h2>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>바이낸스 API:</strong> 암호화폐 가격 데이터를 바이낸스에서 가져옵니다. 브라우저가 바이낸스와 직접 통신하지 않으며 모든 요청은 서버를 통합니다.</li>
                <li><strong>Vercel:</strong> 사이트는 Vercel에서 호스팅됩니다.</li>
                <li><strong>Google Analytics:</strong> 집계형 사용 분석을 위해 GA4를 사용합니다.</li>
                <li><strong>Supabase:</strong> 블로그 콘텐츠 저장에 사용하며, 분석의 기준 시스템은 아닙니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>쿠키</h2>
              <p>DCAify가 계산 입력값을 저장하는 쿠키는 사용하지 않습니다. 다만 Google Analytics는 자체 측정 쿠키 또는 유사 저장소를 사용할 수 있습니다. 향후 광고를 추가하면 해당 서비스 정책에 맞춰 본 방침을 업데이트합니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>데이터 보관 기간</h2>
              <p>익명 페이지 조회 데이터는 분석 목적으로 최대 12개월간 보관된 후 자동 삭제됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>이용자의 권리</h2>
              <p>개인 데이터를 수집하지 않으므로 접근, 수정 또는 삭제할 개인 데이터가 없습니다. 문의사항은 <a href="mailto:hello@dcaify.com" className="hover:underline" style={{ color: 'var(--accent)' }}>hello@dcaify.com</a>으로 연락해주세요.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>방침 변경</h2>
              <p>본 개인정보처리방침은 수시로 변경될 수 있습니다. 변경사항은 이 페이지에 &ldquo;최종 수정일&rdquo;과 함께 게시됩니다.</p>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
