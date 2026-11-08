---
description: Build one homepage/CMS section from the approved design (delegates to section-builder, then motion-engineer if animated)
argument-hint: <section-name> [notes]
---

Build the `$ARGUMENTS` section.

1. Find its spec in `docs/PLAN.md` (Homepage sections) and its screen in `docs/designs/`.
2. Delegate the static, responsive build to the `section-builder` subagent with a 5–10 line brief (props, layout per breakpoint, Strapi component name).
3. If the spec lists an animation recipe, delegate it to `motion-engineer` afterwards.
4. Summarize in ≤5 lines what changed and the route to view it.
