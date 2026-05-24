'use client'

import { useEffect, useRef } from 'react'

/**
 * Hydrate state from the current URL on mount.
 * Returns a Map of param -> value for the calling component to use during initial setState calls.
 * Safe at SSR time (returns empty); only reads window in the browser.
 */
export function readUrlParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

/**
 * Sync a flat set of string values to the URL via history.replaceState.
 * Skips entries that equal the provided default (keeps the URL tidy) or are empty strings.
 * Uses replaceState so the browser back button stays clean.
 */
export function useUrlSync(values: Record<string, string>, defaults: Record<string, string>): void {
  const isFirstRun = useRef(true)
  // Re-run whenever any value changes.
  const serialized = JSON.stringify(values)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isFirstRun.current) {
      // The hydration pass already read the URL — don't echo back the same params on first mount.
      isFirstRun.current = false
      return
    }
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(values)) {
      if (v === '' || v === undefined || v === null) continue
      if (v === defaults[k]) continue
      params.set(k, v)
    }
    const qs = params.toString()
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash || ''}`
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(null, '', next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized])
}
