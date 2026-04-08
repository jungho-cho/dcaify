export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function sanitize(params: AnalyticsParams): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined),
  ) as Record<string, string | number | boolean>
}

export function trackEvent(name: string, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, sanitize(params))
}
