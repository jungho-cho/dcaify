import type { Metadata } from 'next'
import CoinExplorerHome from '@/components/CoinExplorerHome'
import { getHomeData, type HomeQuery } from '@/lib/home-data'

export const metadata: Metadata = {
  title: 'Crypto DCA Calculator — Trustworthy backtests for 29 coins',
  description:
    'See what consistent Bitcoin, Ethereum, Solana, and 26 more crypto buys would be worth today. DCAify shows the result, the assumptions, and Korean tax-aware scenarios.',
}

export const revalidate = 3600

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function pickString(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams
  const query: HomeQuery = {
    amount: pickString(params.amount),
    frequency: pickString(params.freq) ?? pickString(params.frequency),
    from: pickString(params.from) ?? pickString(params.since),
    to: pickString(params.to),
    coin: pickString(params.coin),
  }
  const data = await getHomeData(query)
  return <CoinExplorerHome lang="en" data={data} />
}
