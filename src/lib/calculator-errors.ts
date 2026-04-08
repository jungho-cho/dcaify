import type { Lang } from '@/lib/strings'
import type { PriceApiErrorResponse } from '@/types/prices'

export type CalculatorErrorCategory =
  | 'validation_error'
  | 'request_error'
  | 'rate_limited'
  | 'upstream_unavailable'
  | 'no_data'
  | 'partial_data'
  | 'unknown'

export function categorizePriceApiError(
  status: number,
  payload?: PriceApiErrorResponse | null,
): CalculatorErrorCategory {
  if (status === 429 || payload?.code === 'rate_limited') return 'rate_limited'
  if (status >= 500 || payload?.code === 'upstream_unavailable') return 'upstream_unavailable'
  if (status === 400) return 'request_error'
  return 'unknown'
}

export function getCalculatorErrorMessage(
  category: CalculatorErrorCategory,
  lang: Lang,
  payload?: PriceApiErrorResponse | null,
): string {
  if (lang === 'ko') {
    switch (category) {
      case 'rate_limited':
        return '요청이 잠시 몰렸습니다. 1분 정도 뒤에 다시 시도해주세요.'
      case 'request_error':
        return payload?.code === 'before_listing'
          ? '선택한 시작일보다 늦게 상장된 코인입니다. 더 최근 날짜로 비교해주세요.'
          : '입력한 기간이나 코인 설정을 다시 확인해주세요.'
      case 'upstream_unavailable':
        return '가격 데이터 제공처가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.'
      case 'no_data':
        return '선택한 기간에 사용할 수 있는 가격 데이터가 없습니다.'
      case 'partial_data':
        return '일부 기간 데이터가 없어 첫 사용 가능한 날짜부터 계산했습니다.'
      default:
        return '오류가 발생했습니다. 다시 시도해주세요.'
    }
  }

  switch (category) {
    case 'rate_limited':
      return 'Requests are temporarily throttled. Please try again in about a minute.'
    case 'request_error':
      return payload?.code === 'before_listing'
        ? 'That date range starts before one of the coins was listed. Choose a later shared date.'
        : 'Please double-check the date range and coin selection.'
    case 'upstream_unavailable':
      return 'The price-data provider is temporarily unavailable. Please try again shortly.'
    case 'no_data':
      return 'No price data is available for that range.'
    case 'partial_data':
      return 'Some earlier data was missing, so the calculation starts from the first available date.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
