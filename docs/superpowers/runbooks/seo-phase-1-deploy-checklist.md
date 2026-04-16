# SEO Phase 1 Deploy Checklist

Follow this after merging the Phase 1 branch and deploying to production.

## 0. Prerequisite: Cloudflare DNS / proxy

Before the rest of this checklist, confirm that `www.dcaify.com` actually reaches the Pages deployment. The 301 middleware only fires for requests that are routed to the Worker.

- [ ] In the Cloudflare dashboard → DNS, confirm `www.dcaify.com` is a CNAME (or ALIAS) pointing to the Pages project and is proxied (orange cloud). If the record is absent or DNS-only (grey cloud), the middleware will never see `www` traffic and the 301 smoke check below will either fail with connection refused or return an unexpected status.
- [ ] Both `dcaify.com` and `www.dcaify.com` should be listed as custom domains on the Pages project (Cloudflare Pages → project → Custom domains).

## 1. Post-deploy smoke checks (within 1 hour)

- [ ] `curl -sI https://www.dcaify.com/btc` → status `301`, `location: https://dcaify.com/btc`
- [ ] `curl -sI https://www.dcaify.com/` → status `301`, `location: https://dcaify.com/`
- [ ] `curl -s https://dcaify.com/matic | grep 'meta name="robots"'` → shows `noindex`
- [ ] `curl -s https://dcaify.com/btc | grep 'meta name="robots"'` → either no `robots` meta OR `index, follow` (not `noindex`)
- [ ] `curl -s https://dcaify.com/sitemap.xml | grep -c '<url>'` → `53`
- [ ] `curl -s https://dcaify.com/ko/btc/tax | grep 'meta name="robots"'` → shows `noindex`

## 2. Google Search Console

- [ ] Re-register the site as a **Domain property** (`dcaify.com`) — this replaces any existing URL-prefix property and consolidates `www`, non-`www`, http, https under one property. Keep the old URL-prefix property for at least 4 weeks for historical comparison.
- [ ] Resubmit `https://dcaify.com/sitemap.xml` on the Domain property.
- [ ] Do NOT request manual indexing of individual URLs in Phase 1 — content is unchanged and the manual-request quota is better saved for Phase 2.

## 3. Measurement (set a weekly reminder)

- [ ] **Week +1:** Coverage report should show `Valid` count stable or rising and `Discovered — currently not indexed` falling as Google re-crawls and drops the removed URLs.
- [ ] **Week +2:** Indexed URLs should start trending toward the ~50 indexable set. Log the numbers in the runbook for weekly comparison.
- [ ] **Week +3:** If `Valid` count remains under 15 by this point, investigate: check rendered HTML of a sample coin page for the `<meta robots>` tag, verify the sitemap is fetchable, confirm the domain property sees both `www` and apex hits before the 301.

## 4. Go/no-go for Phase 2

Phase 2 begins when:
- (a) The site has been stable for at least 7 days post-Phase-1 deploy, AND
- (b) Indexed count ≥ 10, OR at minimum not trending down.

If indexed count is falling at Week +2, do not proceed to Phase 2 — first diagnose why the cleanup is hurting instead of helping.
