import type { Lang } from '@/lib/strings'

export const KOREAN_CRYPTO_TAX = {
  assumedRate: 0.22,
  basicDeductionKrw: 2_500_000,
  expectedStartDate: '2027-01-01',
  basisDate: '2026-04-08',
} as const

export function getKoreanTaxStatus(lang: Lang) {
  if (lang === 'ko') {
    return {
      eyebrow: '예정된 한국 가상자산 과세 시나리오',
      title: '현재 시행 중인 세법이 아니라 예정 기준으로 계산합니다.',
      summary: `DCAify는 ${KOREAN_CRYPTO_TAX.basisDate} 기준으로 알려진 한국 가상자산 과세 프레임을 참고해 손익분기점을 보여줍니다. 예상 세율은 22%(지방소득세 포함), 기본공제는 연 ${KOREAN_CRYPTO_TAX.basicDeductionKrw.toLocaleString('ko-KR')}원, 예상 시행 시점은 ${KOREAN_CRYPTO_TAX.expectedStartDate}입니다.`,
      disclaimer:
        '세법과 시행 시점은 바뀔 수 있습니다. 실제 신고 전에는 국세청 공지와 세무 전문가 의견을 다시 확인하세요.',
      shortLabel: '예상 세금 반영',
      faqLine: `현재 시행 중인 세법이 아니라 ${KOREAN_CRYPTO_TAX.expectedStartDate} 예정 기준으로 계산한 참고용 시나리오입니다.`,
    }
  }

  return {
    eyebrow: 'Estimated Korean crypto tax scenario',
    title: 'This is an estimated future-tax scenario, not active tax law.',
    summary: `DCAify shows a Korean tax-aware break-even using the delayed virtual-asset tax framework known on ${KOREAN_CRYPTO_TAX.basisDate}. The assumed rate is 22%, the annual deduction is KRW ${KOREAN_CRYPTO_TAX.basicDeductionKrw.toLocaleString('en-US')}, and the expected start date is ${KOREAN_CRYPTO_TAX.expectedStartDate}.`,
    disclaimer:
      'Rules and enforcement dates can change. Re-check official guidance before using this for a real filing decision.',
    shortLabel: 'Estimated Korean tax scenario',
    faqLine: `This is a reference scenario based on the expected ${KOREAN_CRYPTO_TAX.expectedStartDate} rollout, not active Korean tax law.`,
  }
}
