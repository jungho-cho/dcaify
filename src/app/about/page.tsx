import { Metadata } from 'next'
import AboutContent from '@/components/AboutContent'
import Crumb from '@/components/terminal/Crumb'
import PageShell from '@/components/terminal/PageShell'

export const metadata: Metadata = {
  title: 'About DCAify',
  description:
    'DCAify is a free crypto DCA calculator that shows your dollar cost averaging returns for Bitcoin, Ethereum, and 25+ cryptocurrencies.',
}

export default function AboutPage() {
  return (
    <PageShell tab="about">
      <Crumb path="/about" />
      <AboutContent lang="en" />
    </PageShell>
  )
}
