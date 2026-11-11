---
name: strapi-content
description: Strapi 5 content model and Next.js data-fetching conventions for SunRyse. Load before creating or editing Strapi content types, components, seeds, or any fetch from the CMS.
---

# Strapi content model (apps/cms)

## Contract
`apps/web/lib/content/types.ts` is the contract. `apps/web/lib/content/from-strapi.ts` maps Strapi -> those shapes
(null when empty -> falls back to `apps/web/content/*.json`). Rich-heading strings keep `*x*` / `~x~` / `^x^` markers.

## Single types
- **global** — siteName, tagline, phone, email, address, serviceArea, hours, license, messengerUrl, logo, socials[] (platform,url,label),
  announcement {text,longText,link}, nav {links[] (label,href,menu?)}, quoteCta (link),
  footer {blurb, columns[] {title, links[]}, legal[] links, copyright}, seo
- **homepage** — `sections` dynamic zone, one component per home section, in page order:
  hero (status, tagline, heading, subheading, billLabel, billDefault, cta, trust[], estimateLabel, image, imageCaption, liveChip),
  benefits-strip (items[]), logo-marquee (heading = marquee label), solutions-showcase, services-grid (featuredSlugs[] + ctaHeading/ctaLabel),
  process-steps (chip, steps[] tone), calculator-cta (chips[]), solar-vs-grid, impact-stats, projects-gallery, testimonials,
  why-us (items[], warrantyLabel/Note), faq (openFirst), cta-banner (chip, formLabel, submitLabel, replyNote). `subheading` = contract `lead`.
- **calculator-config** — rates/assumptions (decimals) + disclaimer + `presets[]` (shared.amount-item)

## Collection types (sorted by `order`)
- **service** — title, slug, category (systems|installation|specialty), icon (IconName string), summary, order
- **solution** — slug (residential|commercial|industrial), title, tag, summary, typicalSize, sizeMeter, metricLabel/Value/Meter, features[], caption, image
- **project** — slug, title, segment, location, sizeKwp (TEXT, e.g. "12 kWp"), system, completed (text), image, order
- **testimonial** — quote, name, roleLocation, rating, initial, tone, order
- **impact-stat** — label, value (TEXT, e.g. "[000]+"), icon, tone, order
- **warranty** — item, years (text), order
- **faq** — question, answer, category, order · **brand** — name, category (panel|inverter|battery), order
- **article** — title, slug, cover, excerpt, body, tags, publishedDate (not `publishedAt`)
- **lead** — create-only via web API route; never publicly readable

## Shared components
link (label, href, newTab, menu?), feature-item (title, description, icon, tone), text-item (value), amount-item (amount),
step, social, announcement, footer-column, footer, nav, seo. Tone enum: sun|amber|sky|leaf|flame|navy.

## Seed
`pnpm --filter cms seed` reads `apps/web/content/*.json` (single source of truth) and uploads `apps/web/public/images/**` to the media
library (one file per distinct src+alt so alt text is per use). Idempotent: existing entries are skipped. `SEED_FORCE=1 pnpm --filter cms seed`
overwrites existing entries from the JSON. Public role gets find/findOne on everything except `lead` (bootstrap in `src/index.ts`).
After schema edits: `pnpm --filter cms strapi ts:generate-types`.

## Fetching (apps/web) — Next.js 16 Cache Components
- `lib/strapi.ts`: `strapiFetch<T>(path, { query, tags })` is a `'use cache'` function with `cacheLife('hours')` and
  `cacheTag('strapi', ...tags)`; Bearer `STRAPI_TOKEN`; query built with `qs`. Server only (`server-only`).
- Strapi webhook → `app/api/revalidate/route.ts` (header `x-revalidate-secret`) → `revalidateTag(tag, 'max')` (two-arg form).
- Leads: `app/api/leads/route.ts` validates with `lib/lead-schema.ts` (zod) → `strapiCreate('leads', …)`.
- Types: generate with `strapi ts:generate-types`, share via `packages/types`.
- Public read permissions: find/findOne on content types; lead = create only via server route (never expose token to client).

## Website wiring (v4)
- **Env**: `pnpm setup` (or `pnpm --filter cms setup:web`) creates the "website" API token (create lead + read content); re-run it after adding a content type: it updates permissions and keeps the key (`ROTATE_TOKEN=1` for a new one). A running Strapi caches token permissions, so restart it after; restart the web dev server to drop cached failed reads and writes `apps/web/.env.local` (STRAPI_URL, STRAPI_TOKEN, REVALIDATE_SECRET, NEXT_PUBLIC_SITE_URL) and `apps/cms/.env` (WEB_REVALIDATE_URL, WEB_REVALIDATE_SECRET). Secrets are never printed. Without STRAPI_URL the site renders the bundled defaults.
- **Refresh**: on start Strapi keeps a webhook "Website revalidate" (entry/media events) → `/api/revalidate` with header `x-revalidate-secret`; the route clears the `strapi` cache tag (all CMS reads).
- **Page copy**: single types `about-page`, `projects-page`, `calculator-page`, `contact-page`, `story-page` (homepage scrollytelling: chapters in camera order, always 7, see `lib/content/pages/story.ts`), `service-defaults` each hold a `content` JSON (seeded from `apps/web/content/pages/*.json`); `solution.details` and `service.details` hold per-entry detail copy; `global.ui` holds interface labels. The web merges these over the bundled defaults key by key (`lib/content/strapi-page.ts` `mergeContent`): unknown keys are dropped, wrong types ignored, so partial edits never break a page.
- **Leads**: `/api/leads` validates with zod and creates a `lead` with the server token (fields include roofType, calcSnapshot, source; `status` defaults to "new" for the sales workflow). Public role cannot read leads.
