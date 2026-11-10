---
name: solar-calculator
description: Method, defaults and UX for the SunRyse solar calculator (Blueshift-style process: contact step, bill/kWh + planned appliances, usage times, roof, region, packages, battery, all-in proposal). Load before touching calculator logic, UI, leads or its tests.
---

# Solar calculator

Engine: `apps/web/lib/solar-calc.ts` (pure, no React, Vitest in `lib/solar-calc.test.ts`).
Wizard: `apps/web/components/pages/calculator/calculator-wizard.tsx` (+ `wizard/parts.tsx`, `wizard/proposal.tsx`).
Settings come from Strapi `calculator-config` (fallback `content/calculator.json`); copy from `calculator-page.content.wizard`.
All numbers are **placeholders until SunRyse confirms them**. Missing CMS values fall back to `DEFAULT_CONFIG` via `withDefaults`.

**Current defaults = Blueshift's public data** (user's instruction, Nov 2026): Canadian Solar 645 W panel (2.7 m²), grid ₱12.65/kWh
(from their appliance estimate), hybrid battery-ready inverter by default, 30-year horizon (panel warranty). Price book
(₱58k/kWp hybrid, ₱50k/kWp grid-tie, ₱32k/kWh battery, before VAT) is *calibrated to* their published results, not copied:
₱10k home ≈ 5.7 yr payback; with 10 kWh battery ≈ ₱3.6/kWh, 71 % cheaper. Do not lift constants from their site code.
CMS copy patches: `pnpm --filter cms patch:content scripts/patches/<file>.json <backupDir>` (field-level, backs up first).

## Process (modelled on blueshift.ph/solar-pricing)
0. **Contact first** (SunRyse requirement): name, PH mobile, optional email, city, Data Privacy Act consent →
   `POST /api/leads` (stage `calculator-started`), id kept in localStorage (`sunryse.calc.contact`, 30 days; "Not you?" clears it).
1. Home / Business / Industrial → 2. Existing / Under construction → 3. Bill in ₱ or kWh (+ optional planned appliances;
   "no bill yet" / under construction → appliance builder) → 4. Busy periods (morning/daytime/evening/night, multi)
   → 5. Roof (metal/tile/shingles/concrete) → 6. Region (NCR, Luzon, Visayas, Mindanao) → 7. Packages (3, one recommended)
   → 8. Battery (homes only) → Proposal. The proposal `PATCH /api/leads/:id` (stage `estimate-ready`, `calcSnapshot`);
   if the first save failed it `POST`s the full lead instead.

## Method
```
bill split   energy₱ = bill·(1 − demandShare) − fixedCharge     (demandShare: 0 home, 15 % business, 25 % industrial)
usage        monthlyKwh = energy₱ / rate  (or kWh input) + planned appliances (kW × qty × h/day × 30)
day model    24 h: usage curve (busy periods ×3 weight) vs solar curve (sin bell 6:00–18:00, kWp × PSH(region) × PR)
             battery charges from surplus, discharges into deficits (usable 90 %, 95 % one-way efficiency)
monthly      self-use, export, import = day × 30.4
savings      min(self-use·rate + export·exportCredit (net metering ≤ cap kW), energy₱)   surplus credit reported separately
price        (base + kWp·(perKwp[grid-tie|hybrid] + roofAdder) + battery·₱/kWh + net-metering fee) × (1 + VAT)
years        savings × (1+escalation)^(y−1) × (1−degradation)^(y−1); year 1 loses export credits for creditDelayMonths
outputs      payback (interpolated), lifetime & net savings, ROI, solar ₱/kWh = price / lifetime kWh, % cheaper than grid, CO₂
packages     ≈50 % / 80 % / 105 % of monthly use, rounded to whole panels; recommended = balanced unless its payback is >10 % slower
```
`calculateSolar()` (home hero, teaser) returns the recommended package with default usage — same engine, same numbers.

## Calibration check (tests)
₱10k home, no battery → payback 4–6 yrs; with a 10 kWh battery → ≈ ₱3.5–4/kWh and ~70 % cheaper than the grid
(Blueshift publishes ₱4/kWh, 71 %, 4–6 yr payback). A 1 HP aircon at 8 h/day ≈ 180 kWh/month (Blueshift: 179).

## UX rules
Big tappable answer cards (radio/checkbox roles), focus moves to each new question, progress bar, Back on every step,
44 px targets, ₱ inputs with `inputMode="numeric"`, live roof + price preview on desktop, disclaimer under results.
Never block the visitor if the lead save fails — show a note once and continue.
