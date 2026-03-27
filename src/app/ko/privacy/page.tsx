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
                <li><strong>페이지 조회:</strong> 방문한 페이지, 유입 경로 URL, 시간을 기록합니다. 이 데이터는 익명이며 IP 주소, 이름 등 개인 식별 정보를 수집하지 않습니다.</li>
                <li><strong>계산기 입력:</strong> 투자 금액, 주기, 기간은 브라우저에서만 처리됩니다. 이 데이터는 서버로 전송되거나 저장되지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>데이터 사용 목적</h2>
              <p>익명 페이지 조회 데이터는 어떤 코인과 기능이 가장 유용한지 파악하여 서비스를 개선하는 데 사용됩니다.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>제3자 서비스</h2>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>바이낸스 API:</strong> 암호화폐 가격 데이터를 바이낸스에서 가져옵니다. 브라우저가 바이낸스와 직접 통신하지 않으며 모든 요청은 서버를 통합니다.</li>
                <li><strong>Vercel:</strong> 사이트는 Vercel에서 호스팅됩니다.</li>
                <li><strong>Supabase:</strong> 익명 분석 데이터가 Supabase에 저장됩니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>쿠키</h2>
              <p>DCAify는 추적용 쿠키를 사용하지 않습니다. 향후 광고를 추가할 경우 해당 서비스에서 자체 쿠키를 설정할 수 있으며, 이 경우 본 방침을 업데이트합니다.</p>
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
