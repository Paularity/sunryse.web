---
name: strapi-content
description: Strapi 5 content model and Next.js data-fetching conventions for SunRyse. Load before creating or editing Strapi content types, components, seeds, or any fetch from the CMS.
---

# Strapi content model (apps/cms)

## Single types
- **global** — logo, siteName, tagline, phone, email, address, socials[], nav (component), footer (component), seo
- **homepage** — `sections` dynamic zone (see components below)
- **calculator-config** — electricityRate (₱/kWh), peakSunHours, performanceRatio, panelWatt, panelAreaM2,
  costPerKwpGridTie, costPerKwpHybrid, batteryCostPerKwh, exportCreditRate, rateEscalation, degradation,
  gridEmissionFactor, kgCo2PerTree, disclaimer

## Collection types
- **service** — title, slug, category (enum: systems | installation | specialty), icon, image, summary, body (blocks), features[], order
- **solution** — title, slug (residential | commercial | industrial), hero, benefits[], idealFor[], typicalSize, savingsRange, faqs (relation)
- **project** — title, slug, segment, location, sizeKwp, panels, monthlySavings, completedAt, gallery[], summary
- **brand** — name, logo, category (panel | inverter | battery), url, order
- **testimonial** — name, role/location, quote, rating, photo, project (relation)
- **faq** — question, answer, category
- **article** — title, slug, cover, excerpt, body, tags, publishedAt
- **impact-stat** — label, value, suffix, order
- **lead** — name, phone, email, segment, monthlyBill, address, message, calcSnapshot (json), source. Create-only via web API route.

## Dynamic-zone components (`sections.*`)
hero, benefits-strip, logo-marquee, solutions-showcase, services-grid, process-steps, calculator-cta,
solar-vs-grid, impact-stats, projects-gallery, why-us, testimonials, faq, cta-banner.
Each maps 1:1 to a React component in `apps/web/components/sections/<name>.tsx` via a registry.

Field notes: `article.publishedDate` (not `publishedAt`, which Strapi reserves); `testimonial.roleLocation` is one field.
Seed: `pnpm --filter cms seed` (idempotent). Public role gets find/findOne on everything except `lead` (bootstrap in `src/index.ts`).

## Fetching (apps/web) — Next.js 16 Cache Components
- `lib/strapi.ts`: `strapiFetch<T>(path, { query, tags })` is a `'use cache'` function with `cacheLife('hours')` and
  `cacheTag('strapi', ...tags)`; Bearer `STRAPI_TOKEN`; query built with `qs`. Server only (`server-only`).
- Strapi webhook → `app/api/revalidate/route.ts` (header `x-revalidate-secret`) → `revalidateTag(tag, 'max')` (two-arg form).
- Leads: `app/api/leads/route.ts` validates with `lib/lead-schema.ts` (zod) → `strapiCreate('leads', …)`.
- Types: generate with `strapi ts:generate-types`, share via `packages/types`.
- Public read permissions: find/findOne on content types; lead = create only via server route (never expose token to client).
