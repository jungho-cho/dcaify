export type Lang = 'en' | 'ko'

export interface Strings {
  tagline: (coinName: string) => string
  investmentLabel: string
  frequencyLabel: string
  daily: string
  weekly: string
  monthly: string
  startDate: string
  endDate: string
  calculateBtn: string
  calculating: string
  // Validation
  invalidAmount: string
  startInFuture: string
  endInFuture: string
  endBeforeStart: string
  maxRange: string
  listingDateError: (coinName: string, listingDate: string) => string
  // Status messages
  rateLimited: string
  fetchError: string
  noData: string
  staleWarning: string
  partialWarning: (coinName: string, date: string) => string
  genericError: string
  // Results
  totalInvested: string
  currentValue: string
  returnLabel: string
  accumulated: string
  chartTitle: string
  portfolioValue: string
  breakEvenTitle: string
  breakEvenPrice: string
  breakEvenWithTax: string
  shareBtn: string
  shareText: (coinName: string, amount: string, frequency: string, roi: string, value: string) => string
}

const en: Strings = {
  tagline: (coinName) =>
    `See exactly how much you'd have if you dollar cost averaged into ${coinName}.`,
  investmentLabel: 'Investment per period (USD)',
  frequencyLabel: 'Frequency',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  startDate: 'Start date',
  endDate: 'End date',
  calculateBtn: 'Calculate DCA Returns',
  calculating: 'Calculating…',
  invalidAmount: 'Please enter a valid investment amount greater than 0',
  startInFuture: 'Start date must be in the past',
  endInFuture: 'End date must be in the past',
  endBeforeStart: 'End date must be after start date',
  maxRange: 'Maximum date range is 10 years',
  listingDateError: (coinName, listingDate) =>
    `${coinName} was listed on ${listingDate}. Start date cannot be earlier.`,
  rateLimited: 'Too many requests. Please wait a minute and try again.',
  fetchError: 'Failed to fetch price data. Please try again later.',
  noData: 'No price data available for the selected range.',
  staleWarning: 'Price data may not be up to date due to a temporary data provider issue.',
  partialWarning: (coinName, date) =>
    `No ${coinName} price data before ${date}. Calculation starts from that date.`,
  genericError: 'Something went wrong. Please try again.',
  totalInvested: 'Total Invested',
  currentValue: 'Current Value',
  returnLabel: 'Return',
  accumulated: 'Accumulated',
  chartTitle: 'Portfolio Value Over Time',
  portfolioValue: 'Portfolio Value',
  breakEvenTitle: 'Break-even Analysis',
  breakEvenPrice: 'Break-even Price',
  breakEvenWithTax: 'Break-even (22% tax)',
  shareBtn: 'Share on X / Twitter',
  shareText: (coinName, amount, frequency, roi, value) =>
    `I invested ${amount}/${frequency} in ${coinName} and got ${roi} return (${value}). Check yours at dcaify.com`,
}

const ko: Strings = {
  tagline: (coinName) =>
    `${coinName}에 꾸준히 적립식 투자했다면 지금 얼마가 됐을까요?`,
  investmentLabel: '투자 금액 (USD)',
  frequencyLabel: '투자 주기',
  daily: '매일',
  weekly: '매주',
  monthly: '매달',
  startDate: '시작일',
  endDate: '종료일',
  calculateBtn: 'DCA 수익 계산하기',
  calculating: '계산 중…',
  invalidAmount: '유효한 투자 금액을 입력해주세요 (0보다 커야 합니다)',
  startInFuture: '시작일은 오늘 이전이어야 합니다',
  endInFuture: '종료일은 오늘 이전이어야 합니다',
  endBeforeStart: '종료일은 시작일 이후여야 합니다',
  maxRange: '최대 10년까지 선택 가능합니다',
  listingDateError: (coinName, listingDate) =>
    `${coinName}의 상장일은 ${listingDate}입니다. 시작일은 상장일 이후여야 합니다.`,
  rateLimited: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  fetchError: '가격 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  noData: '선택한 기간의 가격 데이터가 없습니다.',
  staleWarning: '일시적인 데이터 제공 문제로 가격 데이터가 최신이 아닐 수 있습니다.',
  partialWarning: (coinName, date) =>
    `${date} 이전 ${coinName} 가격 데이터가 없습니다. 해당 날짜부터 계산합니다.`,
  genericError: '오류가 발생했습니다. 다시 시도해주세요.',
  totalInvested: '총 투자금',
  currentValue: '현재 가치',
  returnLabel: '수익률',
  accumulated: '보유량',
  chartTitle: '시간별 포트폴리오 가치',
  portfolioValue: '포트폴리오 가치',
  breakEvenTitle: '손익분기점 분석',
  breakEvenPrice: '손익분기 가격',
  breakEvenWithTax: '손익분기 (22% 세금)',
  shareBtn: 'X / 트위터에 공유',
  shareText: (coinName, amount, frequency, roi, value) =>
    `${coinName}에 ${amount}/${frequency} 투자해서 ${roi} 수익 달성 (현재 가치: ${value}). dcaify.com에서 계산해보세요`,
}

const STRINGS: Record<Lang, Strings> = { en, ko }

export function getStrings(lang: Lang): Strings {
  return STRINGS[lang]
}
