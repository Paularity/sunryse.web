# Deployment plan: Vercel (website) + hosted Strapi (CMS)

Status: code changes for deployment done (section 1); nothing deployed yet (Nov 2026). Prices are approximate; confirm them on the providers' own pricing pages.

## The setup

| Part | Where | Why |
|---|---|---|
| Website (`apps/web`, Next.js 16) | **Vercel Pro**, functions in Singapore (`sin1`) | Built by the Next.js team; Cache Components, tag revalidation and image optimisation work as-is. Singapore is closest to Philippine visitors. Hobby is non-commercial only, so a business site needs Pro (≈ $20 per member per month). |
| CMS (`apps/cms`, Strapi 5) | **Railway**, Singapore region (recommended) or **Strapi Cloud** | Strapi needs an always-on server and a database; it cannot run on Vercel. Railway runs it with Postgres for roughly $5–20 a month and never sleeps (the website build reads the CMS, so the CMS must be up). Strapi Cloud is the managed alternative: less to look after, more per month. Its free tier sleeps, so it is not for production. |
| Database | **Postgres** (Railway, same project) | SQLite (today) is a single local file; production needs a real database with backups. |
| Uploaded media | **Cloudinary** (recommended) or a Railway volume | Uploads live on the CMS's disk today. Cloudinary keeps them safe across redeploys and serves them from a CDN (free tier is enough to start). A Railway volume is simpler but has no CDN, and backups are your job. |
| Domain | e.g. `www.<domain>` → Vercel, `cms.<domain>` → Railway | The CMS on its own subdomain keeps the admin separate from the site. |

Accounts: create them under SunRyse's own email (or a team they own) so the business keeps control and billing.

## Free setup (for now, until launch)

Everything below has a free tier, so the site can go online for review and testing without paying. The trade-offs
are real, so switch to the paid setup above before the site goes live for customers.

| Part | Free option | Limits to know |
|---|---|---|
| Website | **Vercel Hobby** (`<project>.vercel.app`) | **Non-commercial use only** under Vercel's terms. Fine for a demo or staging site; a live business site taking leads needs Pro. |
| CMS | **Render** free web service, Singapore | 512 MB RAM and a tenth of a CPU. **Sleeps after 15 minutes** without traffic and takes about a minute to wake. 750 free hours a month covers one always-on service. |
| Database | **Neon** free Postgres, Singapore | Sleeps after 5 minutes but wakes in about a second; around 0.5–1 GB storage, plenty for this site. **Not** Render's free Postgres, which is deleted 30 days after it's created. |
| Media | **Cloudinary** free | Enough for a site this size. |
| Lead emails | **Resend** free | Daily and monthly send caps, far above what a lead form uses. Sending from your own address needs a domain; until then, use Resend's test sender to your own inbox. |
| Keep the CMS awake | **UptimeRobot** (or similar) free monitor | Pings `https://<cms>.onrender.com/_health` every 5 minutes so Render doesn't put Strapi to sleep. |
| Domain | none | Use the free `*.vercel.app` and `*.onrender.com` addresses. |

**Why the CMS keep-awake matters:** the website caches CMS content and refreshes it every few hours or when an edit
is saved. If Strapi is asleep at that moment, the refresh fails. The site then shows the bundled placeholder text
until Strapi answers, and retries within a minute. Keeping Strapi awake avoids that.

**Risks of the free CMS host:**
- **Memory:** 512 MB is tight for Strapi 5, especially for building the admin panel. If a deploy runs out of memory,
  set `NODE_OPTIONS=--max-old-space-size=460`. If it still fails, the free option is Oracle Cloud's Always Free virtual
  machine: plenty of memory and always on, but you run the server yourself (Docker, HTTPS), and sign-up asks for a card.
- **Wake-ups:** if the monitor ever stops, the first request after a sleep takes about a minute.

**Steps** (same as sections 2–6 below, with these swaps):
1. Neon: create a project in Singapore and copy its connection string into `DATABASE_URL` (with `DATABASE_SSL=true`).
2. Render: create a free web service from the repo in Singapore. Build: `pnpm install --frozen-lockfile && pnpm --filter cms build`.
   Start: `pnpm --filter cms start`. Add the CMS environment from section 2, with `PUBLIC_URL=https://<name>.onrender.com`.
3. Copy the content with `strapi transfer`, create the two API tokens, and add the UptimeRobot monitor.
4. Vercel Hobby: import the repo as in section 4, with `STRAPI_URL=https://<name>.onrender.com` and
   `NEXT_PUBLIC_SITE_URL=https://<project>.vercel.app`. Set `WEB_REVALIDATE_URL` on Render to `https://<project>.vercel.app/api/revalidate`.
5. Test as in section 5.

**When going live:** move the website to Vercel Pro, which is a plan change on the same project. Optionally move the
CMS to a paid always-on host (Render's paid tier or Railway). The Neon database and Cloudinary media can stay as they are.

## 1. Code changes before the first deploy ✅

- [x] **Build no longer depends on the CMS.** A failed CMS read is now cached for about a minute instead of seconds
      (`lib/strapi.ts`). Next treated the short cache as live data, so a build with Strapi down failed. Now the build
      pre-renders from the bundled `/content` defaults and pages refresh within a minute once Strapi answers.
      Checked: `STRAPI_URL=http://127.0.0.1:9 pnpm --filter web build` succeeds.
- [x] **Postgres driver:** `pg` added to `apps/cms`.
- [x] **Media on Cloudinary:** `@strapi/provider-upload-cloudinary` is on when `CLOUDINARY_NAME/KEY/SECRET` are set (local
      disk otherwise). The admin's security policy allows `res.cloudinary.com`. The website allows images from your own
      account only, via `CLOUDINARY_CLOUD_NAME`.
- [x] **Public URL:** `PUBLIC_URL` and `IS_PROXIED` in `apps/cms/config/server.ts`.
- [x] **Lead form protection:** a hidden honeypot field on the contact form and the calculator's contact step (bots get an
      "ok" but nothing is saved), and per-visitor rate limits on `/api/leads` (5 new leads per 10 minutes) and
      `/api/leads/:id` (40 updates). The limits live in memory per server instance, so also add a Vercel Firewall
      rate-limit rule for `/api/leads` (Project → Firewall → Rate limiting).
- [x] **Lead emails:** each new lead is emailed through Resend after the visitor gets their answer. Off until
      `RESEND_API_KEY`, `LEAD_NOTIFY_TO` and `LEAD_NOTIFY_FROM` are set (the sender's domain must be verified in Resend).
- [x] **Production API token:** `PRINT_PERMISSIONS=1 pnpm --filter cms setup:web` prints exactly what to tick for the
      "website" token (read everything + Lead create/update) and the read-only "website-preview" token. It touches nothing.
- [x] Example env files: `apps/cms/.env.example` (production section) and `apps/web/.env.example`.

## 2. Set up the CMS (Railway)

- [ ] New Railway project in Singapore: a Postgres service and a Strapi service from this GitHub repo.
- [ ] Strapi service: Node 22, install `pnpm install --frozen-lockfile`, build `pnpm --filter cms build`,
      start `pnpm --filter cms start`, watch paths `apps/cms/**` only (so website commits don't redeploy the CMS).
- [ ] Environment (generate new secrets; never reuse the local ones):
      `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT`, `PUBLIC_URL=https://cms.<domain>`, `IS_PROXIED=true`,
      `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`,
      `DATABASE_CLIENT=postgres`, `DATABASE_URL` (from the Postgres service), `DATABASE_SSL` as Railway requires,
      `CLOUDINARY_NAME` / `CLOUDINARY_KEY` / `CLOUDINARY_SECRET`,
      `WEB_REVALIDATE_URL=https://www.<domain>/api/revalidate`, `WEB_REVALIDATE_SECRET` (same value as the website's `REVALIDATE_SECRET`).
- [ ] First start creates the admin account: use a strong password and 2-person access only.
- [ ] Custom domain `cms.<domain>` on the Strapi service; turn on Railway's Postgres backups.

## 3. Move the content

- [ ] Use `strapi transfer` from the local CMS to production (create a transfer token in the production admin). It copies
      content, media and settings, including your edits made in the admin (team names, the Deye logo, etc.). Re-seeding
      from JSON would lose those. Both sides must run the same Strapi version and schema; the transfer replaces whatever is in production.
- [ ] Afterwards, in the production admin: delete test or dev leads, check the media library loads from Cloudinary, and
      confirm the "Website revalidate" webhook was created (the CMS creates it on start from `WEB_REVALIDATE_URL`).
- [ ] Create the "website" token and the read-only "website-preview" token in the production admin, using the list from
      `PRINT_PERMISSIONS=1 pnpm --filter cms setup:web`. Keep both for the next step.

## 4. Set up the website (Vercel)

- [ ] Import the repo into a Vercel Pro team. Root Directory `apps/web`, framework Next.js, keep "Include files outside
      the root directory" on (pnpm workspace), Node 22.x. pnpm is picked up from `packageManager` and the lockfile.
- [ ] Function region: Singapore (`sin1`).
- [ ] Ignored build step: skip builds when only `apps/cms/**` or `docs/**` changed.
- [ ] Firewall: add a rate-limit rule for `/api/leads` (backs up the in-app limit, which is per server instance).
- [ ] Environment variables:

| Variable | Production | Preview |
|---|---|---|
| `STRAPI_URL` | `https://cms.<domain>` | same CMS (or a staging CMS) |
| `STRAPI_TOKEN` | website token (read + create lead) | **read-only** token, so previews can't create real leads |
| `REVALIDATE_SECRET` | new random value (matches the CMS's `WEB_REVALIDATE_SECRET`) | not needed |
| `NEXT_PUBLIC_SITE_URL` | `https://www.<domain>` | leave unset (sitemap/robots then point at the preview) |
| `CLOUDINARY_CLOUD_NAME` | the Cloudinary account name | same |
| `RESEND_API_KEY`, `LEAD_NOTIFY_TO`, `LEAD_NOTIFY_FROM` | for new-lead emails | not needed (previews can't create leads) |

- [ ] Deploy to the `*.vercel.app` address first and test before the domain moves (section 5).

## 5. Test on the Vercel address before launch

- [ ] Every page loads with CMS content (not the bundled placeholders): home, /pricing, solutions, services, projects,
      about, calculator, contact.
- [ ] Edit something in the admin → the site updates within seconds (webhook → `/api/revalidate`).
- [ ] Submit a test lead from /contact and from the calculator → it appears in the admin and the notification email
      arrives; then delete it.
- [ ] Images load (Cloudinary), the story/3D scene runs on a phone, Lighthouse mobile ≥ 90, no console errors.
- [ ] `/robots.txt` and `/sitemap.xml` point at the real domain (after `NEXT_PUBLIC_SITE_URL` is set).

## 6. Go live

- [ ] Add `www.<domain>` and the bare domain to Vercel (bare → `www` redirect); add the DNS records Vercel shows.
      Point `cms.<domain>` at Railway.
- [ ] Confirm HTTPS on both, then submit the sitemap in Google Search Console and set up the Google Business Profile link.
- [ ] Turn on Vercel Web Analytics and Speed Insights; add an uptime check for `https://cms.<domain>/_health`.

## 7. After launch

- **Content changes:** editors work in the admin; the site refreshes itself through the webhook. No redeploy needed.
- **Code changes:** push to `main` → Vercel deploys the website (and Railway the CMS, only when `apps/cms` changed).
  Pull requests get preview links automatically.
- **Schema changes** (new content types or fields): deploy the CMS first, then the website, and update the API
  token's permissions for any new type.
- **Rollback:** Vercel "Instant Rollback" for the website; Railway redeploys an earlier CMS build; Postgres backups for data.
- **Upgrades:** keep Strapi patched (security releases), and Next.js / dependencies monthly.

## Rough monthly cost

| Item | Approx. |
|---|---|
| Vercel Pro (1 member) | ≈ $20 + usage beyond the included amounts |
| Railway (Strapi + Postgres) | ≈ $5–20 by usage |
| Cloudinary | free tier to start |
| Domain | ≈ $10–20 a year |
| Strapi Cloud instead of Railway | more per month; check strapi.io/pricing-cloud (third-party figures disagree) |

## Decisions needed from SunRyse

- [ ] The domain name, and who owns it (registrar access for DNS).
- [ ] Railway (cheaper, more control) or Strapi Cloud (managed, more per month).
- [ ] Which email receives new-lead notifications.
- [ ] Who gets admin access to the CMS and to Vercel.
