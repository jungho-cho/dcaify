import { formatPct, formatUsd } from '@/lib/formatters'
import type { ComparisonVerdict } from '@/lib/result-interpretation'

interface ComparisonSummaryProps {
  leftLabel: string
  rightLabel: string
  normalizedStartDate?: string | null
  state: 'success' | 'partial' | 'error'
  verdict?: ComparisonVerdict | null
  partialMessage?: string | null
}

export default function ComparisonSummary({
  leftLabel,
  rightLabel,
  normalizedStartDate,
  state,
  verdict,
  partialMessage,
}: ComparisonSummaryProps) {
  if (state === 'error') {
    return (
      <section className="space-y-2 rounded-[var(--radius-lg)] border border-red-500/30 bg-red-950/20 p-5 text-sm text-red-300">
        <h2 className="text-lg font-semibold text-[var(--text)]">Comparison unavailable right now</h2>
        <p>Both comparison legs failed, so we are not showing a verdict. Try a shorter range or retry in a minute.</p>
      </section>
    )
  }

  if (state === 'partial') {
    return (
      <section className="space-y-2 rounded-[var(--radius-lg)] border border-amber-500/30 bg-amber-950/20 p-5 text-sm text-amber-200">
        <h2 className="text-lg font-semibold text-[var(--text)]">Partial comparison only</h2>
        <p>{partialMessage ?? `One side loaded, but the other did not. We are showing what worked and hiding the verdict.`}</p>
        {normalizedStartDate && <p>Shared comparison window starts on {normalizedStartDate}.</p>}
      </section>
    )
  }

  if (!verdict) return null

  const headline =
    verdict.winner === 'tie'
      ? `${leftLabel} and ${rightLabel} are effectively tied over this shared window.`
      : verdict.winner === 'left'
        ? `${leftLabel} came out ahead of ${rightLabel}.`
        : `${rightLabel} came out ahead of ${leftLabel}.`

  const detail =
    verdict.primaryMetric === 'roi'
      ? `The gap is ${formatPct(Math.abs(verdict.roiDelta))} in return, with a ${formatUsd(Math.abs(verdict.currentValueDelta))} difference in ending value.`
      : `Returns were nearly tied, but ending value differed by ${formatUsd(Math.abs(verdict.currentValueDelta))}.`

  return (
    <section className="space-y-2 rounded-[var(--radius-lg)] border border-sky-400/20 bg-sky-400/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Shared-window verdict</p>
      <h2 className="text-xl font-semibold text-[var(--text)]">{headline}</h2>
      <p className="text-sm text-[var(--text-muted)]">{detail}</p>
      {normalizedStartDate && (
        <p className="text-xs text-[var(--text-faint)]">
          Shared comparison started on {normalizedStartDate} because that is the first date both coins have usable data.
        </p>
      )}
    </section>
  )
}
