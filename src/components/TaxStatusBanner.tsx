import type { Lang } from '@/lib/strings'
import { getKoreanTaxStatus } from '@/lib/tax-status'

interface TaxStatusBannerProps {
  lang?: Lang
  compact?: boolean
}

export default function TaxStatusBanner({ lang = 'ko', compact = false }: TaxStatusBannerProps) {
  const copy = getKoreanTaxStatus(lang)

  return (
    <section
      className="space-y-2"
      style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: compact ? '14px 16px' : '20px',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--accent)' }}>
        {copy.eyebrow}
      </p>
      <h2 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text)' }}>
        {copy.title}
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {copy.summary}
      </p>
      {!compact && (
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-faint)' }}>
          {copy.disclaimer}
        </p>
      )}
    </section>
  )
}
