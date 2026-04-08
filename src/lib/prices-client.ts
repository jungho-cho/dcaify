import { categorizePriceApiError, type CalculatorErrorCategory } from '@/lib/calculator-errors'
import type { PriceApiErrorResponse, PricesResponse } from '@/types/prices'

export type PriceRangeResult =
  | { ok: true; data: PricesResponse }
  | {
      ok: false
      category: CalculatorErrorCategory
      payload: PriceApiErrorResponse | null
    }

export async function fetchPricesForRange(params: {
  coinId: string
  from: string
  to: string
}): Promise<PriceRangeResult> {
  const qs = new URLSearchParams(params)
  const response = await fetch(`/api/prices?${qs.toString()}`)

  if (response.ok) {
    return { ok: true, data: (await response.json()) as PricesResponse }
  }

  let payload: PriceApiErrorResponse | null = null
  try {
    payload = (await response.json()) as PriceApiErrorResponse
  } catch {
    payload = null
  }

  return {
    ok: false,
    category: categorizePriceApiError(response.status, payload),
    payload,
  }
}
