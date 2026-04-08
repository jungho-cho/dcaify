import type { Metadata } from 'next'
import CoinExplorerHome from '@/components/CoinExplorerHome'

export const metadata: Metadata = {
  title: 'Crypto DCA Calculator — Trustworthy backtests for 29 coins',
  description:
    'See what consistent Bitcoin, Ethereum, Solana, and 26 more crypto buys would be worth today. DCAify shows the result, the assumptions, and Korean tax-aware scenarios.',
}

export default function HomePage() {
  return <CoinExplorerHome lang="en" />
}
