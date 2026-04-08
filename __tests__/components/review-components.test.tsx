import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ComparisonSummary from '@/components/ComparisonSummary'
import NoResultsRecovery from '@/components/NoResultsRecovery'
import TaxStatusBanner from '@/components/TaxStatusBanner'

describe('review support components', () => {
  it('renders a calm tax banner with basis date', () => {
    const html = renderToStaticMarkup(<TaxStatusBanner lang="ko" />)

    expect(html).toContain('예정된 한국 가상자산 과세 시나리오')
    expect(html).toContain('2026-04-08')
    expect(html).toContain('2027-01-01')
  })

  it('renders recovery suggestions for no-results states', () => {
    const html = renderToStaticMarkup(
      <NoResultsRecovery
        lang="en"
        query="dogwifhat"
        suggestions={[{ href: '/btc', label: 'Bitcoin calculator' }]}
      />,
    )

    expect(html).toContain('dogwifhat')
    expect(html).toContain('Bitcoin calculator')
  })

  it('renders the full partial-success contract without a verdict', () => {
    const html = renderToStaticMarkup(
      <ComparisonSummary
        leftLabel="Bitcoin"
        rightLabel="Ethereum"
        normalizedStartDate="2021-05-01"
        state="partial"
        partialMessage="Bitcoin loaded, but Ethereum did not."
      />,
    )

    expect(html).toContain('Partial comparison only')
    expect(html).toContain('Bitcoin loaded, but Ethereum did not.')
    expect(html).toContain('2021-05-01')
    expect(html).not.toContain('Shared-window verdict')
  })
})
