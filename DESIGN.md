# Design System — DCAify

## Product Context
- **What this is:** Crypto DCA (Dollar Cost Averaging) calculator with SEO content pages
- **Who it's for:** Korean and English-speaking crypto investors
- **Space/industry:** Crypto finance tools (peers: dcabtc.com, cryptodca.io, coincodex)
- **Project type:** Web app (calculator tool + SEO content)

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian
- **Decoration level:** Minimal — typography and whitespace do the work
- **Mood:** Calm, trustworthy financial tool. Not a trading dashboard, not a crypto casino. The user should feel "this is a serious tool I can trust" within 3 seconds. Long-term investing energy, not day-trading energy.
- **Reference sites:** dcabtc.com (simplicity), wise.com (trustworthy fintech), linear.app (clean dark UI)

## Typography
- **Display/Hero:** Satoshi (Bold 700) — modern geometric sans with personality. Sharper than Inter, more memorable.
  - Load from: `https://api.fontshare.com/v2/css?f[]=satoshi@700&display=swap`
- **Body:** DM Sans (Regular 400, Medium 500) — clean and warm, better letter-spacing than Inter
  - Load from: Google Fonts
- **UI/Labels:** DM Sans (Medium 500)
- **Data/Tables:** Geist Mono (tabular-nums) — already installed via next/font, perfect for aligned numbers
- **Code:** Geist Mono
- **Scale:**
  - xs: 12px / 0.75rem
  - sm: 14px / 0.875rem (labels, muted text)
  - base: 16px / 1rem (body)
  - lg: 18px / 1.125rem (subheadings)
  - xl: 20px / 1.25rem (section titles)
  - 2xl: 24px / 1.5rem (page titles)
  - 3xl: 30px / 1.875rem (hero on mobile)
  - 4xl: 36px / 2.25rem (hero on desktop)
  - 5xl: 48px / 3rem (homepage hero)

## Color
- **Approach:** Restrained — 1 accent + neutrals. Color is rare and meaningful.
- **Background:** #0B0F19 — deep navy, not pure black (warmer, less harsh)
- **Surface:** #141926 — cards, elevated surfaces
- **Border:** #1E293B — slate-800, subtle separation
- **Text primary:** #E2E8F0 — slate-200
- **Text muted:** #64748B — slate-500
- **Text faint:** #475569 — slate-600 (for least important info)
- **Accent:** #38BDF8 — sky-400 (calm sky blue, NOT neon. Differentiates from purple/green crypto norm)
- **Accent hover:** #0EA5E9 — sky-500
- **Semantic:**
  - Profit/Success: #34D399 (emerald-400)
  - Profit bg: #064E3B/20 (emerald-950 at 20% opacity)
  - Loss/Error: #F87171 (red-400)
  - Loss bg: #450A0A/20 (red-950 at 20% opacity)
  - Warning: #FBBF24 (amber-400)
  - Info: #38BDF8 (same as accent)

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:**
  - 2xs: 2px (0.5)
  - xs: 4px (1)
  - sm: 8px (2)
  - md: 16px (4)
  - lg: 24px (6)
  - xl: 32px (8)
  - 2xl: 48px (12)
  - 3xl: 64px (16)
- **Component padding:** Cards: 20-24px. Inputs: 12px horizontal, 8px vertical. Buttons: 12-16px horizontal, 12px vertical.

## Layout
- **Approach:** Grid-disciplined
- **Max content width:** 1024px (max-w-4xl for content, max-w-5xl for comparisons)
- **Grid:** Single column for calculator pages, 2-col for comparisons (lg+), 2-4 col for coin grids
- **Border radius:**
  - sm: 6px (inputs, small buttons)
  - md: 8px (badges, tags)
  - lg: 12px (cards, sections)
  - xl: 16px (hero cards, primary CTAs)
  - full: 9999px (pills, avatar)
- **Note:** NOT using rounded-2xl (16px) for everything. Cards get lg (12px), inputs get sm (6px). Hierarchy matters.

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50ms) short(150ms) medium(250ms)
- **Usage:** Button hover (50ms), skeleton pulse (1s loop), chart entrance (250ms), page transitions (none, too heavy for a tool)

## Component Patterns

### Cards
- Background: var(--surface) #141926
- Border: 1px solid var(--border) #1E293B
- Radius: 12px (lg)
- Padding: 20px
- NO shadow. Border does the separation.

### Buttons
- Primary: bg sky-400, text slate-900, hover sky-500. Radius: 12px.
- Secondary: bg transparent, border slate-700, text slate-200, hover border sky-500. Radius: 12px.
- Ghost: bg transparent, text slate-400, hover text white. No border.

### Inputs
- Background: #0B0F19 (same as page bg, not card bg)
- Border: 1px solid #1E293B
- Radius: 6px (sm)
- Focus: ring-2 ring-sky-500/40 border-sky-500
- Text: slate-200, placeholder: slate-600

### Data Display
- Numbers: Geist Mono, tabular-nums
- Currency: always 2 decimal places
- Percentage: sign prefix (+/-), 2 decimal places
- Profit numbers: emerald-400
- Loss numbers: red-400

## AI Slop Blacklist
Do NOT use:
- Purple/violet/indigo gradients
- 3-column icon-in-circle feature grids
- Centered everything with uniform spacing
- Same border-radius on every element
- Decorative blobs, floating circles, wavy SVG dividers
- Generic hero copy ("Welcome to...", "Unlock the power of...")
- Colored left-border on cards

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-27 | Initial design system | Created by /design-consultation. Industrial/Utilitarian aesthetic, sky-blue accent for trust differentiation, Satoshi + DM Sans typography |
| 2026-03-27 | Sky blue accent over green/purple | Most crypto sites use green or purple accents. Sky blue (#38BDF8) is calmer, more trustworthy, differentiates DCAify as a "long-term investing tool" not a "trading platform" |
| 2026-03-27 | Satoshi for display font | Sharper and more memorable than the Inter/Roboto default. Geometric but with personality. Not overused in crypto space |
