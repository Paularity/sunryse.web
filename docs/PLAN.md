# SunRyse Solar Services — Website Plan

**Goal:** a fast, animated, mobile-first site that turns visitors into quote requests.
**Brand:** SunRyse Solar Services — "Clean Energy • Brighter Tomorrow" (`assets/849605438_…png`).
**Content references:** solarnrg.ph (segments, FAQ, impact counters, calculator entry), blueshift.ph (benefits,
warranties, net-metering steps, solar-vs-grid cost story, monitoring).
**Motion reference:** chaingpt.org (GSAP + ScrollTrigger + ScrambleText + Lenis, grid-line layout, numbered sections,
pinned showcase with a changing 3D object, mono uppercase labels, boxed headline words).

## 1. Creative direction — "Daylight sunrise" (v2)
Bright, sunny pages straight from the brand sheet (sky blue → warm dawn), with ChainGPT's technical structure
and motion on top: grid lines, numbered sections, mono labels, boxed headline words, scroll-scrubbed scenes.
Full-bleed hero: a huge sun with rotating rays rises behind the headline over a perspective field of panels.
Navy is used only for accent bands (impact stats, footer). Sun gradient = action; sky blue = information;
leaf green = savings. Details: `.claude/skills/sunryse-design/SKILL.md`. Screens: `docs/designs/`.

## 2. Sitemap
| Route | Purpose | Main sources |
|---|---|---|
| `/` | Home (sections below) | homepage dynamic zone |
| `/solutions/residential` · `/commercial` · `/industrial` | Segment pages: benefits, typical size, savings range, projects, FAQ | solution |
| `/services` + `/services/[slug]` | 14 services from brand sheet | service |
| `/calculator` | Full savings calculator | calculator-config |
| `/projects` + `/projects/[slug]` | Case studies, filter by segment | project |
| `/brands` | Partner brands: Solis, Deye, SRNE, Dyness, Pylontech, Genixgreen, Hestia, Sunways, Seraphim | brand |
| `/how-it-works` | Process, net metering, warranties, after-sales | homepage parts + faq |
| `/about` | Story, team, licenses, values | global/about |
| `/learn` + `/learn/[slug]` | Articles (net metering, hybrid vs grid-tie…) | article |
| `/faq` | Grouped FAQ | faq |
| `/contact` (Get a Quote) | Lead form + map + contacts | lead, global |
| `/privacy`, `/terms` | Legal | page |

**Services (14):** Solar system design & consultation · Solar panel installation · Hybrid & grid-tie systems ·
Battery storage · Electrical works & protections · Mounting structure installation · Maintenance & troubleshooting ·
Residential · Commercial · Industrial solutions · Solar lighting · Solar water pump · EV charger installation · Solar CCTV.

## 3. Homepage sections (order)
| # | Section | Content | Motion recipe |
|---|---|---|---|
| 00 | Nav + announcement bar | logo, Solutions▾, Services▾, Calculator, Projects, Learn▾, Get Quote | sticky blur, hide on scroll down |
| 01 | Hero "Power your home & business with the sun" | boxed word, sub, CTAs, quick bill input → calculator, rotating status labels | SunriseHero, ScrambleLabel, SplitReveal |
| 02 | Benefits strip | lower bills · clean energy · reliable backup · pro installation · after-sales | stagger fade |
| 03 | Partner marquee | 9 brands | Marquee |
| 04 | Solutions 01/02/03 | Residential / Commercial / Industrial with feature lists + savings range | PinnedShowcase + dot rail |
| 05 | Services grid | 14 cards, tabs: Systems / Installation / Specialty | GlowCard, layout anim on filter |
| 06 | How it works | Consult → Site survey & design → Install → Net-metering paperwork → Monitor & support | HorizontalSteps |
| 07 | Savings calculator | bill slider, segment, grid-tie/hybrid → size, panels, savings, payback, 25-yr, CO₂ | CountUp, chart draw |
| 08 | Solar vs grid | ₱/kWh own solar vs grid; rising-rate chart over 25 yrs | line draw on scroll |
| 09 | Impact counters | kWp installed, projects, MWh generated, trees equivalent | CountUp |
| 10 | Projects | gallery from `assets/` photos, segment filter | image reveal clip-path |
| 11 | Why SunRyse + warranties | quality products, pro team, safe & standard install, after-sales; warranty table | GridLines, stagger |
| 12 | Testimonials | carousel | drag carousel |
| 13 | FAQ | 8 items (types, rainy season, night use, savings, net metering, maintenance, warranty, cost) | accordion |
| 14 | CTA "Inquire now" | quote form (dialog on mobile) | sun glow pulse |
| 15 | Footer | contacts, links, socials, newsletter | — |

Mobile: sticky bottom bar [Calculate] [Get Quote]; pinned sections become stacked; hero uses static poster.

## 4. Architecture
```
sunryse.web/
├─ apps/web        Next.js App Router + Tailwind v4 + shadcn/ui
│  ├─ app/(site)/… routes      ├─ components/ui (shadcn)  ├─ components/sections (CMS-driven)
│  ├─ components/motion        ├─ lib/strapi.ts, lib/solar-calc.ts, lib/gsap.ts
├─ apps/cms        Strapi 5 (content model in .claude/skills/strapi-content)
├─ packages/types  generated Strapi types shared with web
├─ docs/           PLAN.md, designs/
└─ .claude/        skills, agents, commands, hooks
```
- Rendering: SSG + ISR with tag revalidation via Strapi webhook. Calculator is client-side, pure function.
- Leads: `app/api/leads/route.ts` → zod validate → Strapi `lead` (server token) → email notify (Resend) → optional Messenger/Viber link.
- SEO: metadata per route, JSON-LD (LocalBusiness, Service, FAQPage), sitemap.xml, OG images.
- Analytics: Vercel Analytics or GA4 + conversion events (calc_complete, quote_submit).
- Hosting: web on Vercel; Strapi on Railway/Render + Postgres + Cloudinary/S3 media.

## 5. Packages
`next react react-dom typescript tailwindcss@4 shadcn/ui lucide-react` ·
motion: `gsap @gsap/react lenis motion @react-three/fiber @react-three/drei three` ·
forms: `react-hook-form zod @hookform/resolvers` · data: `qs` · charts: `recharts` (shadcn charts) ·
carousel: `embla-carousel-react` (shadcn) · tests: `vitest @testing-library/react playwright` ·
quality: `eslint prettier prettier-plugin-tailwindcss`.

## 6. Claude workflow (token-efficient)
- **CLAUDE.md** kept short; detail lives in 4 skills that load only when relevant:
  `sunryse-design`, `sunryse-motion`, `strapi-content`, `solar-calculator`.
- **Subagents:** `section-builder` (Sonnet), `motion-engineer` (Sonnet), `cms-modeler` (Sonnet), `qa-responsive` (Haiku, read-only).
- **Commands:** `/section <name>`, `/page <route>`, `/cms-type <name>`, `/qa <route>`.
- **MCP (`.mcp.json`):** shadcn (pull components), context7 (current library docs), next-devtools (runtime errors/routes).
- **Hook:** auto-Prettier after each edit (`.claude/hooks/format.mjs`) — needs settings approval, see `docs/claude-settings.proposed.json`.
- **Recommended plugins:** frontend-design (Anthropic), "Skills for Real React Engineers" (GSAP ScrollTrigger/React skills), Design (Anthropic: accessibility review).

## 7. Phases
1. **Design approval** — screens in `docs/designs/` (this step). ✅ before any code.
2. **Scaffold** — pnpm monorepo, Next.js + Tailwind v4 + shadcn theme tokens, Strapi 5 + content types + seed from brand sheet.
3. **Foundation** — layout, nav/footer, Lenis + GSAP setup, motion recipes, section registry.
4. **Home** — sections 01–15, calculator lib + tests.
5. **Inner pages** — solutions, services, projects, calculator, contact, learn, FAQ, about.
6. **Leads & SEO** — form → Strapi + email, JSON-LD, sitemap, OG.
7. **QA & perf** — `/qa` each route, Lighthouse ≥ 90 mobile, reduced-motion pass, Playwright smoke tests.
8. **Launch** — Vercel + Strapi hosting, domain, analytics.

## 8. Open questions for SunRyse
Service area/office address · phone/email/socials · real project list with kWp and photos · warranty terms ·
pricing per kWp and battery for the calculator · licenses (PCAB, etc.) · testimonials · net-metering utility (Meralco or other).
