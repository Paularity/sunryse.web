# Screen designs (v5 · Daylight 3D)

Live canvas: https://claude.ai/artifact/TMjxYnHzvpzVKFZdG8pWZC · Audit: ../UX-AUDIT.md

All page boards are fluid (one responsive spec, verified at 390 / 768 / 1024 / 1440: no sideways scroll, notes never cover text).

**v5 adds real-time 3D** on the bright SunRyse brand: a live rooftop scene in the home hero (house, panels, battery, energy flows, sun on an arc), 3D models per solution (house / office / factory), a battery + inverter scene, a live panel array in the calculator, mini models on the quote form, 3D tilt cards and orbit rings.

**Scroll animation:** dashed orange notes on every board say what moves on scroll or hover. The Motion board has the full scroll storyboard (what runs where, as a share of the page) and the 3D build spec. The canvas has nothing to scroll, so boards show each effect at its end state; open a board on its own and scroll to see the CSS scroll timelines run.

| File | Route / purpose |
|---|---|
| Main.dc.html | `/` home (3D hero, solution models, tilt cards, scroll notes, phone sticky bar) |
| Mobile.dc.html | `/` fixed 390px phone comp (same source as Main) |
| MenuMobile.dc.html | full-screen phone menu |
| Navigation.dc.html | desktop Services mega menu |
| Calculator.dc.html | `/calculator` (working formulas, 3D panel array that follows the bill) |
| Solution.dc.html | `/solutions/[slug]` template (Residential, 3D house hero) |
| Service.dc.html | `/services/[slug]` template (Battery storage, 3D battery + inverter hero) |
| Projects.dc.html | `/projects` (depth deck, fanned grid) |
| About.dc.html | `/about` (3D sun with orbit rings) |
| Contact.dc.html | `/contact` 3-step quote form with mini 3D property models |
| Motion.dc.html | v5 scroll storyboard, 3D model kit, build spec, motion recipes, tokens |

| Shared file | What it is |
|---|---|
| fx-layer.css | shared "daylight futurism" layer (logo, header, glass, cards, HUD chips, footer) |
| fx-3d.css | 3D kit: CSS-3D boxes, materials, panels, energy flows, sun arc, tilt cards, orbit rings, scroll-timeline reveals, scroll notes, reduced-motion rules |
| fx-3d-models.mjs | HTML generators for the models (house, battery, building, factory, flows, panels); use the same proportions for the React Three Fiber build |
