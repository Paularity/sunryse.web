# SunRyse website: record of changes

What was built and changed, where it lives, and how to edit it. Covers 10–12 Nov 2026 (commits `142f477` to `e2dac78`
and the deployment that followed), plus a short summary of the earlier foundation work.
Detailed plans: [PLAN.md](PLAN.md), [TODO-packages-and-payments.md](TODO-packages-and-payments.md),
[DEPLOY-PLAN.md](DEPLOY-PLAN.md). Content still needed from SunRyse: [CONTENT-NEEDED.md](CONTENT-NEEDED.md).

## At a glance

| Area | What changed | Where editors change it (Strapi admin) |
|---|---|---|
| Homepage opening | Scroll story "A day on solar" (3D island, sunrise to night) replaces the old hero | **Homepage story** |
| About page | Every section is a regular form field (no JSON); team members with photos; brand logos | **About page**, **Team member**, **Brand** |
| Pricing | New **/pricing** page, homepage packages + payment sections, packages on solution pages | **Package**, **Add-on**, **Payment option**, **Pricing page** |
| Quotes & leads | Pricing buttons pre-fill the contact form; leads record package, add-ons and payment | **Lead** (read only for the website) |
| Calculator | Shows monthly payments vs savings, payment choice, closest standard package | **Calculator page** (text), **Payment option** |
| Contact page | Real Google map of the office; Facebook page name instead of a placeholder | **Global** (address, socials) |
| Deployment | Free hosting: Vercel (website), Render (CMS), Neon (database), Cloudinary (images) | n/a |

## 1. Homepage story: "A day on solar"

A scroll-driven 3D story built only with free tools (Three.js / React Three Fiber, GSAP, Lenis). Seven chapters follow
one day: sunrise, panels, inverter, the grid, an evening brownout (the battery keeps the lights on), businesses, and a
finale that leads into the bill-based configurator below it.

- **Files:** `apps/web/components/story/` (`stations.ts` camera shots and timing, `story-scene.tsx` 3D island,
  `story-experience.tsx` scroll, text and HUD), styles in `app/globals.css`.
- **Behaviour:** each chapter has a camera shot (position, time of day, battery, brownout). The sky, sun and moon follow
  the time, and time only moves forward. Text reveals with SplitText. A HUD shows progress, the clock and the chapter.
- **Fallbacks:** phones get a lighter scene; reduced motion jumps between shots; without WebGL a static version of the
  chapters is shown.
- **Editing:** Strapi → **Homepage story** (one JSON field). There are always 7 chapters (one per camera shot). Text,
  buttons and labels can be edited; missing or broken entries fall back to the bundled text
  (`apps/web/content/pages/story.json`).
- **Links inside the story** (e.g. "Try it with your bill") scroll smoothly through Lenis (`scrollToTarget` in
  `components/motion/smooth-scroll.tsx`).

## 2. About page, team photos and brand logos

- **About page** (single type) now uses real Strapi fields instead of one JSON blob: hero, story (image + paragraphs),
  mission, vision, values, timeline, team section text, credentials, brands label, call to action and SEO.
  Components: `apps/cms/src/components/about/*`. Blank fields fall back to `apps/web/content/pages/about.json`.
- **Team member** (new collection): name, role, **photo**, initials, colour, order. With a photo the card shows it;
  without one it shows the initials. The four real team members were moved over from the old JSON.
- **Brand** logos: upload a logo on a brand and it replaces the brand name on /about, the homepage brand strip and
  service pages (`components/brand-mark.tsx`).

## 3. Pricing and payments (5 phases)

Modelled on the structure of devsolutions.com.ph, in SunRyse's own design and words.

**Content model (Strapi)**

| Type | Fields |
|---|---|
| **Package** (`solar-package`) | name, slug, system type (grid-tie / hybrid / off-grid), segment, inverter kW, panel count and watt, battery kWh and spec, expandable to, best for, price (empty = "Ask for price"), badge, featured, image, order. kWp is calculated. |
| **Add-on** | name, spec, description, price, "from" price, unit, order |
| **Payment option** | title, kind (cash / card / bank loan / gov loan / in-house), icon, colour, description, highlight, max term (months), interest rate, down payment %, requirements, button label |
| **Pricing page** (single) | page text for /pricing and the homepage sections: intro, "all-in includes" list, labels, payment panel text, disclaimer, call to action |

**Where it shows**
- **/pricing**: packages grouped by type with jump chips, "all-in includes" list, add-ons, payment options, CTA band.
  Added to the main menu ("Pricing") and footer ("Packages & pricing"), and the sitemap.
- **Homepage**: after "How it works", a packages section (the **featured** package and its neighbours, plus
  "See all packages") and the payment options.
- **Solution pages**: packages for that segment (Industrial has none yet, so it keeps its old cards).

**Buttons and leads**
- "Request quote", "Add to quote" and "Ask about this option" open the contact form with the package, add-ons and
  payment already filled in (`?package=`, `?addons=`, `?payment=`).
- **Check eligibility** opens a side panel: what you need, a monthly estimate (package × term; "before interest"
  until a rate is set), the disclaimer and a link to the contact form.
- Leads now store **packageName**, **addOns** and **preferredPayment** (readable names), with source "pricing".

**Calculator**
- The result shows **How you could pay**: each option's monthly amount next to the monthly savings ("Covered by your
  savings" or the gap). Picking one saves it to the lead.
- **Closest standard package**: same system type and same battery-or-not, nearest size, with its "starts at" price.
- The calculator's price formula is shared (`systemPrice()`), and a test keeps the bundled package prices within 15 % of it.

**Code:** `apps/web/components/pricing/*`, `app/(site)/pricing/page.tsx`, `lib/pricing.ts`, `lib/financing.ts`,
`lib/content/pages/pricing.ts`, `components/pages/calculator/wizard/proposal.tsx`.

**Placeholders:** 12 packages, 3 add-ons and 3 payment options are seeded with placeholder values. Package prices come
from the calculator's price book and look about **2× market prices**, so SunRyse should confirm both.

## 4. Contact page

- **Map**: a real Google Maps embed of the address in Strapi → Global (113 Riviera Blvd, Angeles, Pampanga), with an
  "Open in Google Maps" button. It loads only when scrolled near and needs no API key. A "[placeholder]" address shows
  the old drawing instead.
- **Messenger**: shows the Facebook page name from Strapi socials ("Sunryse Solar Services") instead of "[Facebook page]".
- Add-on checkboxes have proper labels for screen readers.

## 5. Production readiness (code)

- **Build no longer needs the CMS**: a failed CMS read is cached for about a minute (it was seconds, which Next treated
  as live data and failed the build). With the CMS down, pages build from the bundled defaults and refresh once it answers.
- **CMS**: Postgres driver (`pg`); uploads go to **Cloudinary** when its keys are set (local disk otherwise); the admin
  may show Cloudinary images; `PUBLIC_URL` and `IS_PROXIED` for hosting behind a proxy.
- **Website**: images allowed only from the configured Cloudinary account (`CLOUDINARY_CLOUD_NAME`).
- **Lead spam protection**: a hidden honeypot field on the contact form and calculator (bots get "ok", nothing is
  saved) and per-visitor limits (5 new leads / 10 min, 40 updates / 10 min). Limits are per server instance.
- **Lead emails**: each new lead can be emailed via Resend after the visitor gets their answer. Off until
  `RESEND_API_KEY`, `LEAD_NOTIFY_TO` and `LEAD_NOTIFY_FROM` are set.
- **Token helper**: `PRINT_PERMISSIONS=1 pnpm --filter cms setup:web` prints the exact permissions for the production
  "website" token and a read-only "website-preview" token. It changes nothing.
- **Env templates**: `apps/cms/.env.example`, `apps/web/.env.example` (no secrets).

## 6. Deployment (free setup, 11–12 Nov 2026)

| Part | Service | Address / notes |
|---|---|---|
| Website | Vercel (Hobby), project `sunryse` | https://sunryse.vercel.app |
| CMS | Render free web service `sunryse-cms`, Singapore | https://sunryse-cms.onrender.com (admin at `/admin`) |
| Database | Neon free Postgres, project `sunryse`, Singapore | direct connection, SSL verified |
| Images | Cloudinary free | all 99 uploaded files moved there |
| Keep-awake | UptimeRobot free monitor "SunRyse CMS" | pings `/_health` every 5 min |

**What was done**
1. Secrets generated into git-ignored files `apps/cms/.env.render` and `apps/web/.env.vercel` (never committed or shared).
2. Neon database created and tested.
3. Cloudinary account created and tested.
4. Strapi deployed on Render. Two fixes were needed (both now in the plan):
   - Node 22.12's corepack can't download pnpm ("Cannot find matching keyid"). Build installs pnpm with npm instead,
     and the service starts with `cd apps/cms && npm run start`.
   - Building the admin panel needs more memory than the 460 MB cap for the running server, so the build command sets
     `NODE_OPTIONS=--max-old-space-size=3072` for the build only.
5. Local content copied with `strapi transfer` (770 items, 14.3 MB). The transfer token was deleted afterwards.
6. "website" API token created; it reads all content and can create/update leads but not list them.
7. UptimeRobot monitor added.
8. Website imported into Vercel (Root Directory `apps/web`) and live with CMS content and Cloudinary images.

**Build and start commands (Render)**
```
Build: npm install -g pnpm@10.34.9 && pnpm install --frozen-lockfile && NODE_OPTIONS=--max-old-space-size=3072 pnpm --filter cms build
Start: cd apps/cms && npm run start
Health check path: /_health
```

**Still to do**
- [ ] Vercel: `NEXT_PUBLIC_SITE_URL=https://sunryse.vercel.app` (Production, type Config), Function Region Singapore, redeploy.
- [ ] Render: `WEB_REVALIDATE_URL=https://sunryse.vercel.app/api/revalidate` (creates the refresh webhook on restart).
- [ ] Test: an admin edit appears on the site within seconds; a test lead from /contact and the calculator arrives.
- [ ] Remove test leads copied from local (6 from the team + "Test Lead (Claude QA)"; check Florence Pamintuan).
- [ ] Move `www.sunryse.ph` from the portfolio project to `sunryse` when ready to go live.
- [ ] Before taking real customer leads: upgrade Vercel to Pro (Hobby is non-commercial only).
- [ ] Optional: Resend for lead emails, Vercel firewall rate-limit rule for `/api/leads`.

## Environment variables (names only)

| Variable | Where | Purpose |
|---|---|---|
| `STRAPI_URL` | Vercel | CMS address |
| `STRAPI_TOKEN` | Vercel (Secret) | "website" API token |
| `REVALIDATE_SECRET` | Vercel (Secret) | shared with the CMS webhook |
| `NEXT_PUBLIC_SITE_URL` | Vercel (Production) | public site address (sitemap, robots, links) |
| `CLOUDINARY_CLOUD_NAME` | Vercel | allow images from this Cloudinary account |
| `RESEND_API_KEY`, `LEAD_NOTIFY_TO`, `LEAD_NOTIFY_FROM` | Vercel (optional) | new-lead emails |
| `NODE_ENV`, `NODE_VERSION`, `HOST`, `IS_PROXIED`, `NODE_OPTIONS` | Render | runtime settings |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY` | Render | Strapi secrets |
| `DATABASE_CLIENT`, `DATABASE_URL`, `DATABASE_SSL`, `DATABASE_SSL_REJECT_UNAUTHORIZED` | Render | Neon Postgres |
| `CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET` | Render | media uploads |
| `PUBLIC_URL` | Render | CMS public address |
| `WEB_REVALIDATE_URL`, `WEB_REVALIDATE_SECRET` | Render | webhook that refreshes the website after edits |

## Useful commands

```
pnpm dev                                         # website (3000) + CMS (1337) locally
pnpm --filter web test                           # 63 unit tests
pnpm --filter cms seed                           # fill an empty CMS from apps/web/content/*.json
SEED_FORCE_ONLY=pricing-page pnpm --filter cms seed   # overwrite only the listed types
pnpm --filter cms setup:web                      # local API token + env files
PRINT_PERMISSIONS=1 pnpm --filter cms setup:web  # list production token permissions
pnpm --filter cms patch:content scripts/patches/<file>.json <backupDir>   # field-level CMS edits (backs up first)
STRAPI_URL=http://127.0.0.1:9 pnpm --filter web build                      # prove the build works with the CMS down
```

## Tests and checks

63 unit tests (Vitest): calculator engine, financing math, pricing helpers and package price check, CMS fallbacks for
the Pricing page and pricing lists, empty states, lead spam guard, lead email, story camera timing. Pages were checked
at 360 / 768 / 1280 px (no sideways scroll, text ≥ 11 px, 44 px tap targets, one h1, labelled controls) and by keyboard.

## Known limitations

- Placeholder content remains (prices, financing terms and rates, office hours, some copy); see CONTENT-NEEDED.md.
- Package prices and the calculator price book look about 2× market prices; to be confirmed by SunRyse.
- Render free tier: 512 MB memory; relies on the UptimeRobot monitor to stay awake.
- Site-wide: breadcrumb "Home" links are small tap targets; radio-style choices move with Tab, not arrow keys;
  opening a `#section` link directly lands at the top of the page (clicks work).
- The lead rate limit is per server instance; add Vercel's firewall rule for a firm limit.

## Earlier foundation (9–10 Nov 2026)

Monorepo scaffold (Next.js + Strapi), designs v4 and v5 ("Daylight 3D"), the website built from the designs and wired
to Strapi end to end, the interactive solar configurator hero, the Blueshift-style calculator with contact details
first, warranties and calculator defaults (placeholders), animated 3D roof pickers, and Privacy / Terms pages.

## Commits

| Commit | Change |
|---|---|
| `142f477` | Scrollytelling prototype at /lab/story |
| `676e326` | Story tuning: sunrise in frame, text reveals, chapter numbers, night office windows |
| `64ff8b9` | Homepage opens with the story |
| `55fe58b` | Story text editable in Strapi ("Homepage story") |
| `2c35b20` | About page Strapi fields, team photos, brand logos |
| `cc56495` | Pricing phase 1: content model |
| `a350cf8` | Pricing phase 2: /pricing, homepage sections, solution packages |
| `6a52b48` | Pricing phase 3: quote links, eligibility panel, lead fields |
| `a0289bb` | Pricing phase 4: payments and closest package in the calculator |
| `c692d94` | Pricing phase 5: QA, tests, accessibility fixes |
| `3253baf` | Deploy prep: offline-safe build, Postgres + Cloudinary, spam guard, lead emails |
| `b20f0f6` | Contact: real office map and Facebook page name |
| `e2dac78` | Deploy plan: free setup until launch |
