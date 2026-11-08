---
description: Responsive + accessibility + motion QA on a route (delegates to qa-responsive on Haiku)
argument-hint: <route, default />
---

Make sure the dev server is running (`pnpm --filter web dev`, port 3000). Then delegate to the `qa-responsive` subagent for `http://localhost:3000$ARGUMENTS`. Show its table, then ask which rows to fix.
