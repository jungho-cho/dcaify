import Link from 'next/link'
import { formatPct, formatUsd } from '@/lib/formatters'
import type { ComparisonSeoSnapshot } from '@/lib/dca-scenarios'

interface ComparisonSeoSnapshotViewProps {
  snapshot: ComparisonSeoSnapshot
}

export default function ComparisonSeoSnapshotView({ snapshot }: ComparisonSeoSnapshotViewProps) {
  if (!snapshot.ok) {
    return (
      <section
        className="mb-6 p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}
      >
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {snapshot.leftCoin.name} vs {snapshot.rightCoin.name} DCA Comparison
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Recent comparison data could not be loaded. You can still use the calculator below to run both legs manually.
        </p>
      </section>
    )
  }

  const left = snapshot.left
  const right = snapshot.right
  const winner =
    snapshot.verdict.winner === 'tie'
      ? 'Tie'
      : snapshot.verdict.winner === 'left'
        ? left.coin.name
        : right.coin.name

  return (
    <section className="mb-8 space-y-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase" style={{ color: 'var(--accent)' }}>
          Same plan, two assets
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Bitcoin vs Ethereum DCA Comparison
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          $100/month into Bitcoin vs Ethereum using the same historical DCA window.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Winner</p>
          <p className="text-lg font-bold">{winner}</p>
        </div>
        <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>BTC value</p>
          <p className="text-lg font-bold tabular-nums">{formatUsd(left.defaultScenario.result.currentValue)}</p>
        </div>
        <div className="p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>ETH value</p>
          <p className="text-lg font-bold tabular-nums">{formatUsd(right.defaultScenario.result.currentValue)}</p>
        </div>
      </div>

      <div
        className="overflow-x-auto p-5"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}
      >
        <h2 className="text-xl font-semibold mb-3">Side-by-side scenario table</h2>
        <table className="w-full text-sm">
          <thead style={{ color: 'var(--text-muted)' }}>
            <tr>
              <th className="text-left py-2 pr-4">Window</th>
              <th className="text-left py-2 pr-4">Monthly</th>
              <th className="text-left py-2 pr-4">BTC ROI</th>
              <th className="text-left py-2 pr-4">ETH ROI</th>
              <th className="text-left py-2">Difference</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.scenarioRows.map((row) => (
              <tr key={`${row.label}-${row.amount}`}>
                <td className="py-2 pr-4">{row.label}</td>
                <td className="py-2 pr-4 tabular-nums">{formatUsd(row.amount)}</td>
                <td className="py-2 pr-4 tabular-nums">{formatPct(row.left.result.roi)}</td>
                <td className="py-2 pr-4 tabular-nums">{formatPct(row.right.result.roi)}</td>
                <td className="py-2 tabular-nums">{formatPct(row.left.result.roi - row.right.result.roi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <h2 className="text-xl font-semibold mb-2">When BTC wins and when ETH wins</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Bitcoin tends to be the simpler store-of-value benchmark. Ethereum adds smart-contract ecosystem exposure. This comparison keeps the DCA plan identical so the difference comes from the assets, not from different assumptions.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/btc" style={{ color: 'var(--accent)' }}>BTC calculator</Link>
        <Link href="/eth" style={{ color: 'var(--accent)' }}>ETH calculator</Link>
        <Link href="/btc/guide" style={{ color: 'var(--accent)' }}>BTC guide</Link>
        <Link href="/eth/guide" style={{ color: 'var(--accent)' }}>ETH guide</Link>
      </div>
    </section>
  )
}
