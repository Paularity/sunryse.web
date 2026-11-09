---
name: sunryse-design
description: SunRyse design system — brand tokens, typography, grid, component and responsive rules. Load before building or styling any UI, section, page or shadcn component in apps/web.
---

# SunRyse design system (v4 · daylight futurism)

Concept: **"Daylight sunrise."** Bright, sunny pages straight from the brand sheet (sky blue → warm dawn),
with ChainGPT-style structure on top: thin grid lines, mono labels, numbered sections, boxed headline words,
corner brackets. Dark navy is used only for accent bands: Services "energy deck", impact stats, footer. Brand source: `assets/849605438_…png`.
Approved screens: `docs/designs/`.

## Tokens (`apps/web/app/globals.css`, Tailwind v4 `@theme`)
| Token | Hex | Use |
|---|---|---|
| `--day-50` | `#F7FAFF` | page background |
| `--day-0` | `#FFFFFF` | cards, raised surfaces |
| `--day-100` | `#EAF2FF` | tinted sections, inputs |
| `--dawn-50` | `#FFF6E6` | warm sections (calculator, CTA lead-in) |
| `--navy-900` | `#0B1F4D` | headings, body ink, footer band |
| `--navy-950` | `#071433` | dark accent bands |
| `--muted` | `#4A5A80` | secondary text (≥ 4.5:1 on white) |
| `--sky-600` | `#1553C7` | links, focus ring, info text |
| `--sky-500` | `#1E6FE8` | brand blue ("Ryse"), charts |
| `--sky-200` | `#BFE0FF` | hero sky top |
| `--sun-300` | `#FFC93C` | amber highlight |
| `--sun-500` | `#FF8A00` | primary CTA fill (navy text on it) |
| `--sun-600` | `#FF5A1F` | CTA gradient end |
| `--sun-700` | `#C2410C` | orange **text** on light (eyebrows) |
| `--leaf-600` | `#1E8A3A` | savings text on light |
| `--leaf-500` | `#2DB84C` | eco/success fills |
| `--line` | `rgb(11 31 77 / .10)` | grid lines, dividers |

Gradients: `--grad-sun: linear-gradient(135deg,#FFC93C,#FF8A00 45%,#FF5A1F)`;
`--grad-sky: linear-gradient(135deg,#4A93FF,#1E4FD8)`;
`--grad-dawn` (hero): `linear-gradient(180deg,#9FD0FF,#D7EBFF 38%,#FFF3DC 70%,#FFD48C)`.
Wordmark = "Sun" in sun gradient + "Ryse" in sky gradient. Never put orange text on white below 24px — use `--sun-700`.

shadcn vars: `--background: day-50`, `--foreground: navy-900`, `--card: day-0`, `--primary: sun-500`,
`--primary-foreground: navy-900`, `--secondary: day-100`, `--accent: sky-500`, `--ring: sky-600`, `--border: line`, `--radius: 16px`.
Cards: white, 1px line border, shadow `0 1px 2px rgb(11 31 77/.04), 0 12px 32px -12px rgb(11 31 77/.12)`.

## Type (next/font/google)
- Display: **Space Grotesk** 500–700, tracking -0.035em. H1 `clamp(2.75rem, 6.5vw, 6.25rem)` (hero ≤ 74px).
- Logo wordmark only: **Sora** 800 (`--font-logo`). Never restyle the logo lockup (mark + SunRyse + SOLAR SERVICES).
- Body: **Manrope** 400/500, 16–18px, line-height 1.6.
- Labels/eyebrows/stats: **JetBrains Mono** 500, UPPERCASE, tracking 0.12em, 11–13px.

## Layout
- Container `max-w-[1320px] px-4 sm:px-6 lg:px-10`. 12-col desktop, 4-col mobile.
- 1px `--line` column guides behind sections — hide below `md`.
- Section header: eyebrow (mono, sun-700) + H2 with one **boxed word** + muted intro.
- Corner brackets (orange L-corners) on hero frames, key photos and the calculator.

## Page templates (see docs/designs)
Home · Solution (`/solutions/[slug]`) · Service (`/services/[slug]`) · Projects · About · Contact/Quote (3-step form) · Calculator.
Shared: breadcrumb (mono), page hero (dawn gradient, photo in bracket frame), related cards, CTA band (sun gradient), navy footer.

## Responsive + UX rules (from docs/UX-AUDIT.md — non-negotiable)
- Mobile first; verify 390 / 768 / 1440 for every page: no horizontal scroll, labels ≥ 11px, targets ≥ 44px.
- Navigation: desktop links ≥ `lg`; below that a menu button opens the full-screen menu (never hide links without one).
- Sticky bottom action bar below `lg`: Call · Calculate · Get a quote (page-specific CTA on inner pages).
  Desktop gets a floating "Message us" (Messenger/Viber) button instead.
- Hero must fit 100svh at 1440×900 (headline ≤ 74px); below `lg` the decorative card cluster becomes one estimate strip.
- Section padding `clamp(64px, 9vw, 112px)`; grid items in fluid grids get `min-width: 0`.
- Phone compaction: service cards → compact list rows (show 6 + "View all"), process → vertical timeline,
  projects/testimonials → snap-scroll rows with a partly visible next card, chip rows hide scrollbars.
- Grids end full: add a CTA tile instead of leaving an orphan row or empty bento cell.
- Icons: one inline stroke set (lucide, 1.75 stroke) — never emoji or glyph characters.
- Forms: labels above fields, 16px inputs (no iOS zoom), inline errors with icon + text, PH mobile format hint,
  quick Call/Messenger options shown before long forms on phones.
- Calculator: ₱ number field + presets + slider; results visible while editing (sticky bar on phones).
- Hero 3D/scrub → static poster below `md` or with `prefers-reduced-motion`.

## Services "energy deck" (home, dark band)
- Background navy-950 + sun/sky radial glows + perspective grid floor (`.sv::before/::after`).
- Filter tabs with counts (All 14 · Systems 6 · Installation 5 · Specialty 3); featured row only in "All".
- Featured: Hybrid & grid-tie (2 cols, live energy-flow diagram, values labelled "Illustrative"), Design (roof scan), Battery (charge gauge).
- Module cards: glass on dark, category-colored icon tile (Systems #6FB0FF · Installation #FFB547 · Specialty #5BD97A),
  gradient border + arrow fill on hover. Grid always ends full: the sun-gradient CTA tile spans the leftover columns.
- Phone: featured → snap row (86%), modules → compact rows (4 in "All" + "View all"). Animations stop with reduced motion.

## Daylight futurism layer (v4, every screen)
Source of truth for the boards: `docs/designs/fx-layer.css` (pasted identically into every board). In the app: utilities in `globals.css`.
- **Logo**: one lockup everywhere (sun mark + Sun/Ryse + SOLAR SERVICES). Reversed on dark only via lighter sky gradient. Never redraw it.
- **Header**: one glass bar on every page (logo · Solutions ▾ · Services ▾ · Calculator · Projects · About · Learn · Call · Get a quote); current page = `aria-current` (orange text + glowing underline).
- **Footer**: one 4-column navy footer with glowing top hairline; phone = brand row, 2 link columns, contact row.
- **Eyebrows** get a pulsing dot; **one headline word** gets the glowing frame (`hl`, sun variant `hl-sun`).
- **Cards**: glass-white; linked cards lift 3px and show the gradient ring (`fx-ring`).
- **Status chips** (`fx-hud` + `fx-dot`): "System online", "Live estimate", "Generating · 4.2 kW". Use sparingly, 1–2 per section.
- **Dark accents** for rhythm: bands (`fx-dark`: Services, Impact, inner CTA) and screens inside light sections (`fx-screen`: charts, spec sheets). Never two dark bands in a row.
- **Photos in bracket frames** get a slow scan line + "System online" chip.
- **Motion** is ambient and slow (pulse dots, scan lines, flowing chart dashes, marquee, orbit rings) and stops with reduced motion.
