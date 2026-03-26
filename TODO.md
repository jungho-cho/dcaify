# DCAify — 내 할일 목록

## 필수 (배포 전 반드시 완료)

- [ ] **CoinGecko API 키 발급**
  - https://www.coingecko.com/en/api 에서 무료 Demo API 키 발급
  - Vercel 환경변수에 `COINGECKO_API_KEY` 추가

- [ ] **Vercel KV 연결**
  - Vercel 대시보드 → Storage → Create KV Database
  - 프로젝트에 연결하면 `KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN` 자동 설정됨

- [ ] **Vercel 배포**
  - `vercel --prod` 또는 GitHub 연결 후 자동 배포
  - 환경변수 확인: `COINGECKO_API_KEY`, KV 관련 변수들

- [ ] **도메인 연결** (선택 — dcaify.com 구매 시)
  - Vercel 대시보드 → Domains → Add domain

## SEO (배포 후 즉시)

- [ ] **Google Search Console 등록**
  - https://search.google.com/search-console
  - 사이트 소유권 확인 후 sitemap.xml 제출: `https://dcaify.com/sitemap.xml`

- [ ] **GA4 설치**
  - Google Analytics 4 속성 생성
  - 측정 ID (`G-XXXXXXXXXX`) 획득
  - `src/app/layout.tsx`에 GA4 스크립트 추가 (또는 `next/script` 사용)

## 수익화 (트래픽 3개월 후)

- [ ] **제휴 마케팅 신청**
  - Binance Affiliate: https://www.binance.com/en/activity/affiliate (팔로워 5k+ 권장)
  - Coinbase Affiliate: https://www.coinbase.com/affiliates (월 방문자 45k+ 권장)
  - Ledger Affiliate: https://affiliate.ledger.com (하드웨어 지갑, 진입 장벽 낮음)

- [ ] **AdSense 신청** (블로그 3-5개 게시물 작성 후)
  - 콘텐츠 충분히 쌓인 후 신청 (계산기만으로는 승인 어려움)

## 콘텐츠 (SEO 트래픽용)

- [ ] 블로그 글 작성: "What is Dollar Cost Averaging? (DCA Explained)"
- [ ] 블로그 글 작성: "Bitcoin DCA Results: $100/month for 5 Years"
- [ ] 블로그 글 작성: "Ethereum DCA Calculator: Historical Returns"
