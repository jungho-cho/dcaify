# Design System — DCAify (Terminal theme)

## Product Context
- **What this is:** Crypto DCA (Dollar Cost Averaging) calculator with SEO content pages
- **Who it's for:** Korean and English-speaking crypto investors
- **Space/industry:** Crypto finance tools (peers: dcabtc.com, cryptodca.io, coincodex)
- **Project type:** Web app (calculator tool + SEO content)

## Aesthetic Direction
- **Direction:** Brutalist / CLI-as-UI. The UI is a terminal session.
- **Decoration level:** Zero. ASCII art for titles, monospace everywhere, sharp 90° corners. No gradients, no rounded buttons, no shadows.
- **Mood:** "honest, fast, reproducible." A serious tool that prints what it knows and admits what it doesn't. Every input is a flag, every result is a line of output.
- **Signature element:** A 6×6 lime square pinned to the top-left of every primary panel — the visual signature of the theme.
- **Reference sites:** Unix man pages, htop, nnn, classic terminal IDEs.

## Typography
- **All text:** JetBrains Mono — loaded via `next/font/google` as `--font-jetbrains-mono`, weights 400/500/600/700.
- **Fallback:** `"JetBrains Mono", ui-monospace, "Menlo", monospace`
- **No separate display font.** "Display" treatment is large monospace + tight letter-spacing (`-0.02em` on hero numbers, `-0.01em` on h1, `+0.06em` UPPERCASE on `# section` headings).
- **Type scale:**

  | Use                          | Size      | Weight | Letter-spacing | Notes                  |
  |------------------------------|-----------|--------|----------------|------------------------|
  | Hero number (homepage)       | 56px      | 400    | -0.02em        | Coin page: 64–72px     |
  | Section h1                   | 30px      | 700    | -0.01em        | Blog post title        |
  | Section h2 (`# UPPERCASE`)   | 17px      | 400    | +0.06em        | Uppercase, lime        |
  | Body                         | 13.5–14px | 400    | normal         | Line-height 1.65–1.75  |
  | Table row                    | 13px      | 400    | normal         |                        |
  | Top bar / labels             | 12px      | 400/500| normal         |                        |
  | Hint text                    | 11px      | 400    | +0.08em        | Uppercase muted        |

## Color

Single-accent (lime) palette on near-black surfaces.

| Token              | Hex                       | Use                                      |
|--------------------|---------------------------|------------------------------------------|
| `--bg`             | `#0A0A0B`                 | Page background (near-black)             |
| `--panel`          | `#101012`                 | Primary panel surface                    |
| `--panel-2`        | `#141416`                 | Nested/secondary surface                 |
| `--panel-3`        | `#181A1D`                 | Tertiary surface                         |
| `--fg`             | `#E6E6E6`                 | Primary text                             |
| `--fg-2`           | `#B5B5B5`                 | Secondary text                           |
| `--muted`          | `#6E6E72`                 | Muted text, labels                       |
| `--faint`          | `#3F3F44`                 | Faint dividers, disabled text            |
| `--border`         | `#26262B`                 | Primary border                           |
| `--border-2`       | `#1D1D21`                 | Subtle border                            |
| `--accent`         | `#B5F23D`                 | Lime — primary CTA, headings, active     |
| `--accent-dim`     | `#7BA526`                 | Hover/pressed accent                     |
| `--accent-bg`      | `rgba(181,242,61,0.10)`   | Accent fill for chips/highlights         |
| `--profit`         | `#B5F23D`                 | Positive numbers (same as accent)        |
| `--loss`           | `#FF5C44`                 | Negative numbers                         |
| `--amber`          | `#F4B942`                 | Editable flag values, warnings, KR tax   |
| `--amber-bg`       | `rgba(244,185,66,0.12)`   | Editable input background                |
| `--cyan`           | `#5BC8DB`                 | Secondary chart color (ETH leg, etc.)    |
| `--violet`         | `#B695F4`                 | Tertiary chart color                     |

## Spacing & layout
- **Base unit:** 4px
- **Container max-width:** 1280px (table layouts need room)
- **Page padding:** `20px 36px 56px`
- **Panel padding:** `18px 22px` (compact: `12–14px`)
- **Section gap:** `28–32px` between major sections
- **Grid gutter:** `8–14px` between panel cards in a row

## Borders & shape
- **No border-radius anywhere.** Buttons, panels, chips, inputs, badges — all sharp 90° corners. Do not soften.
- Default border: `1px solid var(--border)`
- Section divider: `1px dashed var(--border)`
- **Accent corner marker:** A `6×6` lime square pinned to `top:-1px; left:-1px` of every primary panel. Use the `.trm-corner` utility (the marker is rendered via `::before`).

## Motion
- **Cursor blink only.** `@keyframes trmBlink` runs `1s steps(2) infinite` on a 9px-wide lime block after editable values and at the end of `$` prompts. Apply via `.trm-cursor`.
- No hover animations beyond color shifts. Match the global 150ms ease-out transition on `a, button, input, select`.

## Component Patterns

### TopBar
Sticky line at the top of every page. Left: `● dcaify · ~/path · v0.3.1 · main` in muted, lime dot/text on `dcaify`. Right: tab list `[c]oins [d]compare [b]log [t]ax [a]bout` followed by `en|ko` toggle. Bracketed letters are real keyboard shortcuts. Active tab: lime + 600 weight. Bottom border: 1px solid `--border`, padding-bottom 12px.

### AsciiHeader
5–6 line ASCII art block in lime, 11px, line-height 1.0, `<pre>`. Followed by `# subtitle` line in muted 12px. Each page has its own ASCII string — do not regenerate, copy verbatim from the prototypes.

### HR
Section divider: `──── label ──────────  right`. Dashes in faint, label in lime, trailing dashes become a `1px dashed border-top` flex spacer. Optional `right` aligned text in muted.

### Panel
Primary container. `1px solid var(--border)`, `background: var(--panel)`, `padding: 18px 22px`, plus the `.trm-corner` 6×6 lime marker.

### Prompt
A `$ cmd --flag=value --flag=value ▮` line. Lime `$ ` prefix, white command, fg-2 ` --key=`, amber-on-amber-bg ` value `, blinking lime cursor at the end. Args are `[key, value]` tuples; each value can be click-to-edit.

### Footer
EOF strip — `border-top: 1px dashed var(--border)`, `padding-top: 16px`, `font-size: 11px`, faint color, flex justify-between. Left: a page-specific note. Right: `dcaify.com · binance daily closes · open source`.

### Crumb
Single line: `# cwd: /btc/guide` in muted, 12px, top margin 20px.

### Cards & inputs
- **Cards:** background `--panel`, 1px `--border`, no radius, no shadow.
- **Buttons (primary):** background `--accent`, text `--bg`, no radius. Hover: `--accent-dim`.
- **Buttons (secondary/chip):** background `--panel-2`, 1px `--border`, text `--fg-2`. Active: lime border + lime text.
- **Inputs:** background `--panel-2`, 1px `--border`, text `--fg`, placeholder `--muted`. Focus: 2px `--accent` outline.

### Data display
- Numbers: JetBrains Mono (default body font), `tabular-nums`.
- Currency: 2 decimals (`.42` in muted/22px next to the larger integer part on hero numbers).
- Percentage: sign prefix (`+/-`), 2 decimals.
- Profit: `--profit` (lime). Loss: `--loss` (red-orange).
- Hero numbers split the cents into a smaller, muted span — `$24,178.42` renders integer at 56px fg, decimals at 22px muted.

### Sparkline (table)
Unicode block string (`▁▂▃▄▅▆▇█`) — 14 chars wide, `letter-spacing: -0.04em`. Lime for positive 3y DCA, red-orange for negative.

### Charts
Recharts only. Single-color line, area fill at 10% opacity, dashed reference line for cumulative invested, dotted Y-axis grid, hide the X axis except for year labels, no chart background, no default Tooltip styling.

## AI Slop Blacklist
Do NOT use:
- Gradients of any kind. Solid colors only.
- Border-radius. Anywhere. Sharp 90° corners only.
- Drop shadows. Borders do the separation.
- Icon-in-circle feature grids, decorative blobs, wavy dividers.
- Generic hero copy ("Welcome to...", "Unlock the power of...").
- Sky-blue (`#38BDF8`) and emerald (`#34D399`) — those are the old palette and must not return.
- Centered everything. Tables and prompt-style inputs are left-aligned by default.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-27 | Initial design system (sky-blue / Satoshi / DM Sans) | First pass, industrial/utilitarian fintech |
| 2026-05-17 | **Full redesign to Terminal theme** | Replaces sky-blue navy with near-black + lime accent, JetBrains Mono everywhere, ASCII headers, prompt-as-input, no border-radius. Doubles down on "honest, reproducible, no nonsense" positioning. Source: `design_handoff_terminal_redesign` bundle |
| 2026-05-17 | JetBrains Mono for all text (no display font) | "Display" treatment is large monospace with tight letter-spacing. Removes the cognitive cost of mixing typefaces |
| 2026-05-17 | Lime (`#B5F23D`) as single accent | Replaces sky-blue. Same role: signal trust + differentiation in a crypto space dominated by green and purple. Lime reads as "CLI/terminal" not "casino" |
| 2026-05-17 | Container widened from 1024 → 1280px | Sortable coin table + delta tables need horizontal room |
| 2026-05-17 | No border-radius anywhere | Brutalist corners are the visual signature. Soft corners would dilute the terminal aesthetic |
