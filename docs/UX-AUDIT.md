# UX audit — SunRyse screens v2 → v3

Method: every board rendered locally at its true width (1440 desktop, 768 tablet, 390 phone), screenshots per section,
plus automated checks per page (horizontal overflow, text < 11px, tap targets < 40px, page height).

## Measurements (before)
| Page @390 | Height | Text < 11px | Taps < 40px | Overflow |
|---|---|---|---|---|
| Home (fluid) | 16,738px | 39 | 13 | none |
| Solution | 7,480px | 25 | 1 | none |
| Service | 5,302px | 10 | 1 | none |
| Projects | 4,488px | 42 | 5 | none |
| About | 6,808px | 9 | 1 | none |
| Contact | 2,050px | 12 | 1 | none |
| Calculator | 2,116px | 21 | 1 | none |
Home @768: 12,278px, hero alone ≈ 1,450px.

## Findings (severity: 🔴 blocks a task · 🟠 hurts conversion/readability · 🟡 polish)
1. 🔴 **No navigation below 1000px** on every page — links hide but no menu button appears (tablet users are stuck).
2. 🔴 **Calculator on phones**: results start ~1,000px below the slider, so users can't see the effect of what they drag.
   Slider-only input is imprecise for large bills.
3. 🟠 **Hero doesn't fit the first screen** (1,161px at 1440×900): the panel field — the signature visual — is below the fold.
   Headline is 4 lines at 100px. On tablet the decorative estimate cards stack under the copy and add ~500px of nothing.
4. 🟠 **Phone hero is half decoration**: the bottom 40% of the first screen is only the sun; the sticky bar covers the panels.
5. 🟠 **Tiny labels**: mono labels at 9–10px across all pages (below 11px legibility floor), 150+ instances.
6. 🟠 **Tap targets < 44px**: header/footer links, filter tabs, chip rows.
7. 🟠 **Missing social proof**: no testimonials anywhere; trust is only self-claimed.
8. 🟠 **Phone pages are too long**: desktop sections simply stack (home 16.7k px). Needs mobile-specific compaction:
   fewer service cards + "view all", vertical timeline, swipe rows, collapsed footer.
9. 🟠 **Contact on phones**: quick alternatives (call / Messenger) sit below a 3-step form — many PH users prefer to message.
   No validation/error states designed.
10. 🟡 **Glyph icons** (₱ ♻ ⚡ ☎ ✉ ⌖ ★ ☾) render as emoji on some devices and look inconsistent → inline stroke SVG icons.
11. 🟡 **Layout holes**: Projects bento leaves an empty cell; Services grid ends with an orphan row of 2.
12. 🟡 **Solutions section**: large dead space under the text; Commercial/Industrial only reachable via scroll-pinning.
13. 🟡 **Cards without affordance**: service cards have no arrow / "learn more" cue.
14. 🟡 **Inconsistent numbers**: hero says payback ≈ 3.6 yrs, the real formula gives 3.5.
15. 🟡 **Visible scrollbars** on horizontal chip rows (Windows).
16. 🟡 **Footer is thin**: no hours, socials, license, or quick contact.

## Decisions (v3)
- **Navigation**: menu button ≤ 1023px on every page; desktop mega-menu for Services (3 groups) and Solutions;
  full-screen mobile menu with grouped links, quick actions (Call, Messenger) and a primary "Get a quote".
- **Hero**: fits 100svh at 1440×900; headline max 84px; one composed estimate card + photo instead of three floats;
  on tablet/phone the decorative cluster becomes a single compact estimate strip under the form; sun moves top-right.
- **Calculator**: ₱ number field + quick presets (₱5k/10k/20k/50k) + slider; sticky results bar on phones;
  "How we calculate" disclosure; CTA carries the numbers into the quote form.
- **Type & touch floor**: labels ≥ 11px; all interactive targets ≥ 44px; section padding `clamp(64px, 9vw, 112px)`.
- **Social proof**: testimonials section on Home, Solution and Service pages (placeholders until real quotes).
- **Phone compaction**: services show 6 + "View all 14"; process → vertical timeline; projects → swipe row;
  footer → stacked groups; chip rows hide scrollbars and show a partial next item as the scroll cue.
- **Contact**: quick-contact actions first on phones; inline validation (name, PH mobile format) with error text.
- **Messaging**: floating "Message us" (Messenger/Viber) on desktop; phone sticky bar = Call · Calculate · Get a quote.
- **Icons**: one inline stroke icon set (lucide-style, 1.75px stroke) everywhere; no emoji/glyph icons.
- **Fill the grid**: Services ends with a 2-column "Not sure what you need?" card; Projects bento gets a "View all" tile.
- **Solutions**: Residential / Commercial / Industrial tabs (work without scroll); pinned scroll stays a desktop enhancement.
- **Mobile comps**: every page board is fluid and verified at 390/768/1440; fixed phone comps for Home and the menu,
  plus a desktop mega-menu board.

## Results (after v3)
| Page | @390 height | @768 height | Text < 11px | Taps < 40px | Overflow |
|---|---|---|---|---|---|
| Home | 11,834px (−29%) | 10,508px (−14%) | 0* | 0 | none |
| Solution | 7,438px | 5,897px | 0 | 0 | none |
| Service | 5,330px | 4,212px | 0 | 0 | none |
| Projects | 4,445px | 4,096px | 0 | 0 | none |
| About | 6,887px | 4,995px | 0 | 0 | none |
| Contact | 2,240px | 1,835px | 0 | 0 | none |
| Calculator | 2,203px | 1,925px | 0 | 0 | none |
*Only the logo lockup and visually-hidden "Learn more" labels on phone service rows.

- Desktop hero now fits 1440×900 (875px) with the panel field visible; tablet hero 1,450 → 755px.
- Calculator: presets + ₱ field + sticky results bar on phones; interaction verified (₱20k → 9.0 kWp, ₱12,319/mo).
- Contact: 3-step flow verified end-to-end, inline validation for name / PH mobile / consent.
