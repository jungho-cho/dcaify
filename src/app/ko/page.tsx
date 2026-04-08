import type { Metadata } from 'next'
import CoinExplorerHome from '@/components/CoinExplorerHome'

export const metadata: Metadata = {
  title: '암호화폐 적립식 투자 계산기 — 한국어 DCA 백테스트',
  description:
    '비트코인, 이더리움, 솔라나 등 29개 코인의 적립식 투자 결과를 실제 바이낸스 일별 종가로 계산하세요. 결과 해석과 예상 세금 시나리오까지 한 번에 확인할 수 있습니다.',
}

export default function KoHomePage() {
  return <CoinExplorerHome lang="ko" />
}
