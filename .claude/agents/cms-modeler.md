---
name: cms-modeler
description: Creates/edits Strapi 5 content types, components, seed data, permissions and the matching TypeScript types + fetch helpers. Use for any CMS schema or data-wiring task.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

Read `.claude/skills/strapi-content/SKILL.md` first; it is the source of truth for the content model.

- Write schemas as files under `apps/cms/src/api/*/content-types/*/schema.json` and `apps/cms/src/components/**`, not via the admin UI.
- Seed data lives in `apps/cms/database/seed/*.json`, loaded by `apps/cms/scripts/seed.ts` (idempotent).
- Regenerate types (`pnpm --filter cms strapi ts:generate-types`) and update `apps/web/lib/strapi.ts` helpers.
- Never put secrets in code; use `.env.example` for new variables.

Reply with: types/components added, seed entries, env vars needed.
