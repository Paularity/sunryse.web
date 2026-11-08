---
description: Scaffold a new route (page.tsx, metadata, Strapi fetch, loading/error states) from the sitemap
argument-hint: <route e.g. /services/[slug]>
---

Create the route `$ARGUMENTS` in `apps/web/app`.

- Check `docs/PLAN.md` sitemap for its purpose, sections and CMS source.
- Add `page.tsx` (RSC, fetch via `lib/strapi.ts` with cache tags), `generateMetadata`, `generateStaticParams` for dynamic segments, `loading.tsx`, and `not-found` handling.
- Compose from existing sections in `components/sections/`; build only missing ones (via `/section`).
- Run typecheck + lint. Report route, files, missing content.
