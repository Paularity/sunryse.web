# SunRyse Solar Services — website

Marketing + lead-gen site for SunRyse Solar Services (PH). Tagline: "Clean Energy • Brighter Tomorrow".
Full plan: `docs/PLAN.md`. Screen designs: `docs/designs/` (approved before code).

## Stack
- `apps/web` — Next.js (App Router, RSC, TypeScript strict), Tailwind CSS v4, shadcn/ui
- `apps/cms` — Strapi 5 (Postgres in prod, SQLite locally)
- Motion — GSAP + ScrollTrigger/SplitText/ScrambleText via `@gsap/react`, Lenis smooth scroll, `motion` for micro-interactions, React Three Fiber (hero only, lazy)
- Package manager: pnpm workspaces (`corepack enable` once)

## Commands
- `pnpm dev` (web + cms) · `pnpm --filter web dev` · `pnpm --filter cms develop`
- `pnpm lint` · `pnpm typecheck` · `pnpm --filter web build`
- Add UI: `pnpm dlx shadcn@latest add <name>` inside `apps/web` (or use the shadcn MCP)

## Rules (always)
- Mobile-first. Every component must work at 360px, 768px, 1280px+. No horizontal scroll.
- Animations: respect `prefers-reduced-motion`; GSAP only inside `useGSAP` with scope; kill ScrollTriggers on unmount.
- Server Components by default; `"use client"` only for interactive/animated leaves.
- All copy, images, prices and calculator assumptions come from Strapi — never hardcode content in components.
- Use design tokens (`--sun-*`, `--sky-*`, `--navy-*`, `--leaf-*`) — no raw hex in components.
- Images via `next/image`; 3D/heavy code via `next/dynamic` with a static fallback.

## Load the matching skill before working on
- UI/sections/tokens → `sunryse-design` · animation → `sunryse-motion`
- Strapi types/fetching → `strapi-content` · calculator → `solar-calculator`

## Token-saving workflow
- Use slash commands: `/section`, `/page`, `/cms-type`, `/qa`.
- Delegate mechanical work to subagents (`section-builder`, `cms-modeler`, `motion-engineer`, `qa-responsive`).
- Look up library APIs with the context7 MCP instead of guessing; pull shadcn components via the shadcn MCP.
- Read only the files you need; don't re-read files after editing.
