interface RecoveryLink {
  href: string
  label: string
}

interface NoResultsRecoveryProps {
  lang: 'en' | 'ko'
  query: string
  suggestions: readonly RecoveryLink[]
  onSuggestionClick?: (href: string) => void
}

export default function NoResultsRecovery({ lang, query, suggestions, onSuggestionClick }: NoResultsRecoveryProps) {
  return (
    <div
      className="space-y-4"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
      }}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
          {lang === 'ko'
            ? `"${query}"와 정확히 일치하는 코인을 찾지 못했습니다.`
            : `We couldn't find a supported coin matching “${query}”.`}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {lang === 'ko'
            ? '영문 심볼(BTC, ETH)이나 대표 코인부터 시작해보세요. 검색이 막혀도 바로 계산을 시작할 수 있게 준비했습니다.'
            : 'Try a ticker like BTC or ETH, or jump into one of the most useful starting points below.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <a
            key={suggestion.href}
            href={suggestion.href}
            onClick={() => onSuggestionClick?.(suggestion.href)}
            className="px-3 py-2 text-sm font-medium"
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg)',
              color: 'var(--text)',
            }}
          >
            {suggestion.label}
          </a>
        ))}
      </div>
    </div>
  )
}
