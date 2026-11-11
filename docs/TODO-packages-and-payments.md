# TODO: Package pricing and payment options

Reference: devsolutions.com.ph (`#estimator` and the sections around it), reviewed Nov 2026. We borrow the **structure**,
not their copy, prices or look; SunRyse styling follows the `sunryse-design` skill.

## What the reference does
- **Package pricing**: cards grouped by system type ("Hybrid Systems (7)"). Each card has a name (5 kW Hybrid), a spec line
  (panels × watts | kWp | battery kWh), "Expandable up to N panels", a one-line "best for", "Starts at ₱…", a "Popular" badge
  and a "Request quote" button. Above the cards: an "all-in includes…" line plus warranties, and a note that the final quote
  depends on brand, add-ons and a site visit.
- **Add-ons**: extra battery module and extra panels (per pair), each with a price and "Add to quote".
- **Payment options**: 3 cards (Cash / Credit card / GSIS loan), each with an icon, a short description, a highlight
  ("No interest", "Up to 36 months", "5 years • 5% int.") and "Check eligibility". A tip line points to the estimator for
  a monthly payment per financing path.
- The estimator (bill → usage profile → region) recommends a system and price; the quote form asks for the preferred payment.

## What SunRyse has today
- The calculator (`lib/solar-calc.ts` + wizard) builds **3 sized packages from a formula** (≈50/80/105 % of use) with an
  all-in price. There is no fixed catalogue.
- Solution pages have a hard-coded "packages" block (`solution-details.json` → `packages.items`: tag, kWp, bill, panels,
  price placeholder).
- There are no payment or financing options anywhere. Leads have no package, add-on or payment field.
- `CONTENT-NEEDED.md` §4 already asks SunRyse for "starting from" prices and financing partners.

## Decisions needed from SunRyse (before real numbers go live)
- [ ] Real package list per system type (grid-tie / hybrid / off-grid): inverter kW, panel count and watt, battery, price, "expandable to"
- [ ] Are prices VAT-inclusive? Show them publicly, or "Ask for price"?
- [ ] Add-ons offered (extra battery, extra panels, EV charger, monitoring…) and their prices
- [ ] Payment options actually offered: cash, card installment (which banks? 0 %?), bank loan, Pag-IBIG / GSIS, in-house plan
- [ ] Terms per option: months, interest rate, down payment, required documents
- [ ] Disclaimer wording for monthly estimates (illustrative, subject to lender approval)

## Plan

### Phase 1: Content model (Strapi), seeded with placeholders ✅
Done: `solar-package` (shown as "Package"; `package` is a reserved word), `add-on`, `payment-option` and the `pricing-page`
single type with real fields. Homepage section components move to Phase 2, where the sections are built.
Placeholder package prices come from the calculator's price book. They are about 2× the reference site's (6 kW + battery: ₱817k
vs ₱378k) because of ₱58k/kWp and ₱32k/kWh, so SunRyse should confirm both the packages and the calculator price book.
- [x] Collection **package**: name, slug, systemType (grid-tie | hybrid | off-grid), segments (residential/commercial/industrial),
      inverterKw, panelCount, panelWatt, batteryKwh, batterySpec, expandableTo, bestFor, price (₱, empty = "Ask for price"),
      badge ("Popular"), featured, image (optional), order. kWp is computed (panelCount × panelWatt), not typed in.
- [x] Collection **add-on**: name, spec, description, price, priceFrom (bool), unit ("per pair"), order.
- [x] Collection **payment-option**: title, kind (cash | card | loan | gov-loan | in-house), icon, tone, description,
      highlight, termMonths, annualRate, downPaymentPct, requirements (list), ctaLabel, order.
- [x] Copy (headings, "all-in includes", disclaimers) in a `pricing-page` single type with real fields (like About)
- [x] Web: types, `fromStrapi` loaders and `getPackages / getAddOns / getPaymentOptions` with JSON fallbacks in `collections.json`;
      public read and setup:web token permissions; seed.

### Phase 2: Where it shows ✅
Done: `/pricing` (packages grouped by system type with jump chips and counts, "all-in includes" list, add-ons, payment options,
CTA band), in the nav ("Pricing", after Calculator) and the footer, and in the sitemap. On the homepage, after "How it works", there are
two sections: packages (the featured package and its neighbours, plus "See all packages") and payment options. Solution pages use
catalogue packages for their segment, falling back to the old cards when there are none (Industrial today).
Choices: the homepage order is fixed in code, so no new dynamic-zone blocks. The homepage sections reuse the Pricing page text,
the **featured** box picks the homepage row, and homepage eyebrows drop the "[ 01 ]" number so the existing numbering stays.
Nav and footer links were added with `scripts/patches/2026-11-11-pricing-links.json` (patch script now supports links).
- [x] /pricing page, nav, footer, sitemap
- [x] Homepage packages and payment sections
- [x] Solution pages use catalogue packages
- [x] Featured card styling; phone layout checked at 375 px (no sideways scroll, 44 px targets)
- [ ] Short FAQ on /pricing (needs pricing/financing questions in Strapi → FAQ)
- [ ] Opening `/pricing#payments` directly lands at the top (smooth scrolling ignores the hash on load; clicks work). Site-wide, not pricing-only.

### Phase 3: Actions and leads ✅
Done: "Request quote" (`?package=`), "Add to quote" (`?addons=`) and "Ask about this option" (`?payment=&package=`) pre-fill
the contact form, which now has a package choice, a payment choice and add-on checkboxes. Leads store `packageName`,
`addOns` and `preferredPayment` as readable text (source "pricing"). "Check eligibility" opens a side panel with what you need,
a monthly estimate (package × term; "before interest" while the rate is empty), the disclaimer and a link to the contact form.
Placeholder maximum terms: card 24 months, bank loan 60 months (the highlights say the same, in [brackets]).
- [x] Request quote / Add to quote / Ask about this option links pre-fill the contact form
- [x] Contact form: package, payment and add-on choices
- [x] Check eligibility panel with monthly estimate
- [x] Lead fields: Strapi schema, zod (`lead-schema.ts`), `/api/leads` (checked with a test lead, then deleted)
- [ ] Moved to Phase 4: payment choice in the calculator, asked on the result step next to the monthly payments rather than at the first step

### Phase 4: Calculator integration
- [x] `lib/financing.ts` (pure, tested; built in Phase 3 for the panel): monthly payment = P·r / (1 − (1 + r)^−n), 0 % → P / n, down payment, total interest.
- [ ] Proposal: monthly payment per payment option next to the monthly savings ("₱X/month vs saves ₱Y/month").
- [ ] Proposal: "Closest standard package" (nearest catalogue kWp of the same system type) with its "Starts at" price and link.
- [ ] Decide how the catalogue and the formula relate. Proposed: the catalogue is the public "starts at" list and the calculator
      stays the personalised estimate. A test flags catalogue prices more than ~15 % away from the engine price for the same size.
- [ ] Save the selected package and payment in `calcSnapshot`.

### Phase 5: QA
- [ ] Unit tests: financing math, closest-package mapping, CMS fallbacks
- [ ] `/qa /pricing` and the homepage: 360 / 768 / 1280, keyboard and focus, reduced motion
- [ ] Empty states: no price ("Ask for price"), no packages for a type (hide the group), no payment options (hide the section)
- [ ] `CONTENT-NEEDED.md` §4 updated with the package, add-on and financing details above
