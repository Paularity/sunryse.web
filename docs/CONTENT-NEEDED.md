# Content needed from SunRyse

Everything the site shows as `[brackets]`, `[TBD]` or `0` is a placeholder. Send these to the dev team (files or a
shared folder is fine). Each item says where it ends up, so it can be entered in Strapi (`apps/cms`) without code changes.

Priority: **P1** = needed before launch · **P2** = needed soon after · **P3** = nice to have.

## 1. Contact and business details — P1
Used in the header, footer, Contact page, phone sticky bar and SEO. Strapi: **Global**.

- [ ] Main phone / mobile number (also: is it on Viber?)
- [ ] Email address for quotes
- [ ] Office address (street, city, province) + Google Maps link
- [ ] Office hours (designs assume `8:00 AM – 5:00 PM`, Mon–Sat?)
- [ ] Service area (cities/provinces you install in)
- [ ] Facebook page URL, Messenger link (`m.me/...`), and any Instagram / TikTok / YouTube
- [ ] Business registration (DTI or SEC no.)
- [ ] Contractor license no. (PCAB) and the registered electrical engineer's name + PRC no. (shown on About as trust proof)
- [ ] Who receives new quote requests (email address and/or Messenger)

## 2. Calculator assumptions — P1
The calculator uses placeholder numbers. Strapi: **Calculator config** (editable any time, no deploy).

| Assumption | Current placeholder | Your value |
|---|---|---|
| Electricity rate | ₱12.50 / kWh | |
| Peak sun hours | 4.5 h/day | |
| Panel wattage used | 620 W | |
| Installed cost, grid-tie | ₱60,000 / kWp | |
| Installed cost, hybrid | ₱75,000 / kWp | |
| Battery cost | ₱28,000 / kWh | |
| Net-metering export credit | ₱6.00 / kWh | |
| Yearly rate increase | 3% | |
| Panel degradation | 0.5% / yr | |
| Daytime use (residential / commercial / industrial) | 60% / 75% / 85% | |

- [ ] Should the site show prices at all, or only "from ₱..." ranges?
- [ ] Wording for the disclaimer under the results

## 3. Proof: numbers, projects, reviews — P1
- [ ] Impact numbers (Strapi: **Impact stats**, currently `0`): projects completed, total kWp installed,
      homes/businesses powered, CO₂ avoided per year
- [ ] Year founded and 3–5 milestones for the About timeline (`[YYYY] — [Short milestone note]`)
- [ ] 6–12 projects (Strapi: **Project**): title, city/province, system size (kWp), type (residential /
      commercial / industrial), grid-tie or hybrid, battery size, month/year done, 2–4 photos each,
      and optionally the before/after monthly bill
- [ ] 3–6 customer testimonials (Strapi: **Testimonial**): customer's real words, name (or initials),
      city, system size, and written OK to publish. Star rating if you have Facebook/Google reviews.

## 4. Services, packages and warranties — P2
Strapi: **Service**, **Solution**, **FAQ**. Drafts already exist for 14 services and 3 solutions; please review them.

- [ ] Confirm the 14 services list (add/remove) and correct the short descriptions
- [ ] Packages (Strapi → **Package**): 12 placeholder packages are seeded, priced from the calculator's price book. Replace them with your real list and "starts at" prices. They currently look about 2× typical market prices, so please also check the calculator's ₱/kWp and ₱/kWh.
- [ ] Add-ons (Strapi → **Add-on**): extra battery, extra panels, EV charger. Prices, or leave blank for "Ask for price"
- [ ] Warranties: panels (product + performance), inverter, battery, workmanship, in years
- [ ] Brands you install (9 seeded: check the list) and official logos for each
- [ ] Typical timeline: site survey → design → permits → install → net-metering (days/weeks per step)
- [ ] Payment options (Strapi → **Payment option**): cash, card installment, bank loan are seeded. Which banks or partners, terms (months), rates, down payment, required documents; add Pag-IBIG / GSIS / in-house if offered
- [ ] Net-metering: do you handle the application with the distribution utility (e.g. Meralco)? How long does it take?
- [ ] Answers to check in the FAQ, especially net metering, brownouts, maintenance, typhoon resistance

## 5. Brand and media — P2
- [ ] Logo as vector (SVG, AI or PDF) — the current one is cut from the brand sheet image
- [ ] Original high-resolution project photos (the site now uses 4 images from the brand sheet)
- [ ] Team photos and names/roles for About (optional)
- [ ] Short drone or install video clips (used for hero/motion sections; optional)

## 6. About copy — P2
- [ ] Mission (placeholder: "Make clean, affordable solar power simple for every Filipino home and business.")
- [ ] Vision (placeholder: "A brighter tomorrow where every rooftop produces its own clean energy.")
- [ ] Short company story (3–5 sentences): who started it, why, where

## 7. Legal and launch — P3
- [ ] Domain name (and who manages DNS)
- [ ] Privacy policy text, or OK to draft one for the quote form (Data Privacy Act consent)
- [ ] Google Business Profile link, Facebook Pixel / Google Analytics IDs if wanted
- [ ] Blog/article topics, if you want a news section at launch
