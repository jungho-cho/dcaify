# DCAify — 내 할일 목록

## 필수 (다음 라운드 우선순위)

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

- [ ] **GA4 이벤트 택소노미 점검**
  - 현재 GA4는 설치되어 있음 (`G-6835L1T846`)
  - `calculator_submit`, `calculator_success`, `comparison_submit`, `search_no_results` 이벤트가 실제로 들어오는지 확인
  - privacy 문서와 실제 추적 이벤트 목록이 계속 일치하는지 점검

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

## 제품 신뢰 / 운영 TODO

- [ ] **한국 가상자산 과세 상태 재검증**
  - 공식 자료 기준으로 시행 시점, 세율, 기본공제, 기준일 재확인
  - 코드의 tax status source-of-truth와 페이지 카피를 같이 업데이트
  - 다음 재검토 날짜도 남기기

- [ ] **핵심 코인 가이드 3~5개 심화**
  - BTC, ETH, SOL 등 상위 진입 코인부터 템플릿형 설명을 더 깊은 intent content로 보강
  - 얇은 SEO 페이지가 아니라 재방문 가능한 신뢰 페이지로 업그레이드
