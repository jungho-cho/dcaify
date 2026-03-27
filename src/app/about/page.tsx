import { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'About DCAify',
  description: 'DCAify is a free crypto DCA calculator that shows your dollar cost averaging returns for Bitcoin, Ethereum, and 25+ cryptocurrencies.',
}

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-[65ch] mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-6">About DCAify</h1>

          <div className="space-y-6 text-gray-300 leading-relaxed">
            <p>
              DCAify is a free, open-source crypto dollar cost averaging (DCA) calculator.
              We help investors see exactly how their DCA strategy would have performed
              historically across 29+ cryptocurrencies.
            </p>

            <h2 className="text-xl font-semibold text-white">What We Do</h2>
            <p>
              Enter your investment amount, frequency, and date range — and we show you
              the results: total invested, portfolio value, ROI percentage, and a visual
              chart of your portfolio growth over time. We also calculate break-even prices,
              including Korean tax considerations.
            </p>

            <h2 className="text-xl font-semibold text-white">Our Data</h2>
            <p>
              All price data comes directly from the{' '}
              <a href="https://www.binance.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                Binance API
              </a>
              , one of the world&apos;s largest cryptocurrency exchanges. We use daily closing
              prices (USDT pairs) to ensure accuracy.
            </p>

            <h2 className="text-xl font-semibold text-white">Supported Coins</h2>
            <p>
              We support 29+ cryptocurrencies including Bitcoin (BTC), Ethereum (ETH),
              Solana (SOL), BNB, XRP, Cardano (ADA), Dogecoin (DOGE), and many more.
              Visit our <Link href="/" className="text-blue-400 hover:underline">homepage</Link> to
              see the full list.
            </p>

            <h2 className="text-xl font-semibold text-white">Languages</h2>
            <p>
              DCAify is available in English and Korean (한국어). Our Korean version includes
              tax analysis for the Korean cryptocurrency capital gains tax (22% rate with
              2.5M KRW basic deduction).
            </p>

            <h2 className="text-xl font-semibold text-white">Disclaimer</h2>
            <p className="text-sm text-gray-400">
              DCAify is an educational tool for informational purposes only. It does not
              constitute financial, investment, or tax advice. Past performance does not
              guarantee future results. Cryptocurrency investments carry significant risk
              and you may lose your entire investment. Always do your own research and
              consult a qualified financial advisor before making investment decisions.
              Tax calculations are estimates — consult a tax professional for your specific
              situation.
            </p>

            <h2 className="text-xl font-semibold text-white">Contact</h2>
            <p>
              Questions or feedback? Reach us at{' '}
              <a href="mailto:hello@dcaify.com" className="text-blue-400 hover:underline">
                hello@dcaify.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
