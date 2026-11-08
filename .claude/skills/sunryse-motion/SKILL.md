---
name: sunryse-motion
description: SunRyse animation system modeled on chaingpt.org — GSAP ScrollTrigger, SplitText, ScrambleText, Lenis, Motion, R3F recipes with React/Next patterns. Load before adding or changing any animation.
---

# Motion system (ChainGPT-inspired)

ChainGPT runs GSAP 3 + ScrollTrigger + ScrambleText + Lenis + Rive and scroll-scrubbed 3D render sequences.
We mirror that with these packages:

| Package | Use |
|---|---|
| `gsap` + `@gsap/react` | timelines, ScrollTrigger pins/scrub, SplitText, ScrambleText (all free) |
| `lenis` | smooth scroll, synced to ScrollTrigger |
| `motion` (`motion/react`) | hover/tap, layout, AnimatePresence, number tweens in UI |
| `@react-three/fiber` + `@react-three/drei` | hero sun orb + panel array (lazy, desktop only) |
| `@rive-app/react-canvas` (optional) | small looping icons |

## Setup
- `components/motion/smooth-scroll.tsx` (client): Lenis instance, `lenis.on('scroll', ScrollTrigger.update)`,
  `gsap.ticker.add(t => lenis.raf(t*1000))`, `gsap.ticker.lagSmoothing(0)`. Disabled when reduced motion.
- `lib/gsap.ts`: register `ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP` once.

## Recipes (each a reusable client component in `components/motion/`)
1. **SunriseHero** — pinned 200vh; scrub timeline raises the sun orb, shifts sky from navy to dawn gradient, panels catch light.
2. **ScrambleLabel** — rotating mono status text ("SIZING YOUR SYSTEM…", "CALCULATING SAVINGS…") via ScrambleText, 2.5s loop.
3. **SplitReveal** — SplitText lines/words, `yPercent:110 → 0`, stagger .06, triggered at `top 80%`.
4. **BoxedWord** — border draws in (clip-path) then word scrambles in.
5. **PinnedShowcase** — left sticky visual swaps per step (01/02/03), right column steps fade/translate; side dot-rail progress.
6. **GridLines** — column guides scale-Y from 0 on first view.
7. **Marquee** — partner logos, CSS infinite translate, pause on hover, duplicate set for seamless loop.
8. **GlowCard** — cursor-follow radial glow (`--x/--y` CSS vars) + slight tilt with `motion`.
9. **CountUp** — impact stats animate when in view (gsap `snap: 1`).
10. **HorizontalSteps** — "How it works" pinned horizontal scroll on `lg+`, vertical list on mobile.

## Rules
- Always `useGSAP(() => {...}, { scope: ref })`; never raw `useEffect` for GSAP.
- `gsap.matchMedia()`: `(min-width: 1024px) and (prefers-reduced-motion: no-preference)` for pins/scrub;
  mobile gets simple fades only.
- Animate only `transform`/`opacity`/`clip-path`. No layout thrash.
- `ScrollTrigger.refresh()` after images/fonts load; never pin inside a transformed parent.
- Budget: hero JS ≤ 120KB gz; R3F loaded with `next/dynamic({ ssr:false })` after first paint.
