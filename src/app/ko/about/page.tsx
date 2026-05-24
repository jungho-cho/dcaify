import { Metadata } from 'next'
import AboutContent from '@/components/AboutContent'
import Crumb from '@/components/terminal/Crumb'
import PageShell from '@/components/terminal/PageShell'

export const metadata: Metadata = {
  title: 'DCAify 소개',
  description:
    'DCAify는 비트코인, 이더리움 등 29개 이상의 암호화폐 적립식 투자(DCA) 수익을 계산하는 무료 도구입니다.',
}

export default function KoAboutPage() {
  return (
    <PageShell tab="about" lang="ko">
      <Crumb path="/ko/about" />
      <AboutContent lang="ko" />
    </PageShell>
  )
}
