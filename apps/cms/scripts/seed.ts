/**
 * Idempotent seed. Single source of truth: apps/web/content/*.json (+ images in apps/web/public/images).
 *   pnpm --filter cms seed                 create what is missing, never touch existing entries
 *   SEED_FORCE=1 pnpm --filter cms seed    also overwrite existing entries from the JSON defaults
 *   SEED_FORCE_ONLY=calculator-config pnpm --filter cms seed   overwrite only the listed single types
 */
import fs from 'node:fs';
import path from 'node:path';
import { createStrapi, compileStrapi } from '@strapi/strapi';

const WEB = path.join(__dirname, '..', '..', 'web');
const read = (n: string) => JSON.parse(fs.readFileSync(path.join(WEB, 'content', `${n}.json`), 'utf8'));
const FORCE = process.env.SEED_FORCE === '1';
const FORCE_ONLY = (process.env.SEED_FORCE_ONLY ?? '').split(',').map((s) => s.trim()).filter(Boolean);
/** SEED_PRUNE=1 also deletes collection entries that are no longer in the content files. */
const PRUNE = process.env.SEED_PRUNE === '1';

type Img = { src: string; alt: string };
const texts = (list: string[] = []) => list.map((value) => ({ value }));
const link = (l: { label: string; href: string; menu?: string }) => ({
  label: l.label,
  href: l.href,
  ...(l.menu ? { menu: l.menu } : {}),
});

/* ── media: one library file per distinct (src, alt) so alt text stays per use ── */
function makeMedia(strapi: any) {
  const seen = new Map<string, string[]>();
  const cache = new Map<string, number>();
  return async (img: Img): Promise<number> => {
    const key = `${img.src}|${img.alt}`;
    if (cache.has(key)) return cache.get(key)!;
    const alts = seen.get(img.src) ?? [];
    if (!alts.includes(img.alt)) alts.push(img.alt);
    seen.set(img.src, alts);
    const idx = alts.indexOf(img.alt);
    const ext = path.extname(img.src);
    const base = path.basename(img.src, ext);
    const name = idx === 0 ? `${base}${ext}` : `${base}-${idx + 1}${ext}`;
    let file = await strapi.db.query('plugin::upload.file').findOne({ where: { name } });
    if (!file) {
      const filepath = path.join(WEB, 'public', img.src);
      const size = fs.statSync(filepath).size;
      const mimetype = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      const uploaded = await strapi.plugin('upload').service('upload').upload({
        data: { fileInfo: { name, alternativeText: img.alt } },
        files: { filepath, originalFilename: name, mimetype, size },
      });
      file = uploaded[0];
      console.log(`uploaded ${name}`);
    }
    cache.set(key, file.id);
    return file.id;
  };
}

/* ── upsert helpers ── */
async function upsertSingle(strapi: any, uid: string, data: any, publish: boolean) {
  const status = publish ? { status: 'published' } : {};
  const existing = await strapi.documents(uid).findFirst();
  const force = FORCE || FORCE_ONLY.some((name) => uid.endsWith(`.${name}`));
  if (existing && !force) return console.log(`skip ${uid}`);
  if (existing) await strapi.documents(uid).update({ documentId: existing.documentId, data, ...status });
  else await strapi.documents(uid).create({ data, ...status });
  console.log(`${existing ? 'updated' : 'created'} ${uid}`);
}

async function upsertCollection(strapi: any, uid: string, items: any[], key: string) {
  let created = 0;
  let updated = 0;
  for (const data of items) {
    const found = await strapi.documents(uid).findFirst({ filters: { [key]: data[key] } });
    if (found && !FORCE) continue;
    if (found) {
      await strapi.documents(uid).update({ documentId: found.documentId, data, status: 'published' });
      updated++;
    } else {
      await strapi.documents(uid).create({ data, status: 'published' });
      created++;
    }
  }
  let pruned = 0;
  if (PRUNE) {
    const keep = new Set(items.map((i) => String(i[key])));
    for (const doc of await strapi.documents(uid).findMany({ fields: [key], limit: 1000 })) {
      if (!keep.has(String(doc[key]))) {
        await strapi.documents(uid).delete({ documentId: doc.documentId });
        pruned++;
      }
    }
  }
  console.log(`${uid}: created ${created}, updated ${updated}, skipped ${items.length - created - updated}${PRUNE ? `, pruned ${pruned}` : ""}`);
}

async function main() {
  const appContext = await compileStrapi();
  const strapi = await createStrapi(appContext).load();
  strapi.log.level = 'error';
  const media = makeMedia(strapi);

  try {
    const site = read('site');
    const h = read('home');
    const services = read('services');
    const solutions = read('solutions');
    const faqs = read('faqs');
    const brands = read('brands');
    const calculator = read('calculator');
    const collections = read('collections');
    const serviceDetails = read('pages/service-details');
    const solutionDetails = read('pages/solution-details');

    // Global
    await upsertSingle(strapi, 'api::global.global', {
      ui: site.ui ?? {},
      siteName: site.name,
      tagline: site.tagline,
      phone: site.phone,
      email: site.email,
      address: site.address,
      serviceArea: site.serviceArea,
      hours: site.hours,
      license: site.license,
      messengerUrl: site.messengerUrl,
      socials: site.socials,
      announcement: { text: site.announcement.text, longText: site.announcement.longText, link: link(site.announcement.link) },
      nav: { links: site.nav.map(link) },
      quoteCta: link(site.quoteCta),
      footer: {
        blurb: site.footer.blurb,
        copyright: site.footer.copyright,
        columns: site.footer.columns.map((c: any) => ({ title: c.title, links: c.links.map(link) })),
        legal: site.footer.legal.map(link),
      },
    }, true);

    // Homepage: dynamic zone, one component per section, in page order
    const sections = [
      {
        __component: 'sections.hero', status: h.hero.status, tagline: h.hero.tagline, heading: h.hero.heading,
        subheading: h.hero.subheading, billLabel: h.hero.billLabel, billDefault: h.hero.billDefault, cta: link(h.hero.cta),
        trust: texts(h.hero.trust), estimateLabel: h.hero.estimateLabel, image: await media(h.hero.image),
        imageCaption: h.hero.imageCaption, liveChip: h.hero.liveChip,
      },
      { __component: 'sections.benefits-strip', items: h.benefits },
      { __component: 'sections.logo-marquee', heading: h.marquee.label },
      { __component: 'sections.solutions-showcase', ...h.solutions },
      {
        __component: 'sections.services-grid', eyebrow: h.services.eyebrow, heading: h.services.heading,
        subheading: h.services.lead, featuredSlugs: texts(h.services.featuredSlugs), ctaHeading: h.services.ctaHeading,
        ctaLabel: h.services.ctaLabel,
      },
      { __component: 'sections.process-steps', ...h.process },
      {
        __component: 'sections.calculator-cta', eyebrow: h.calculator.eyebrow, heading: h.calculator.heading,
        subheading: h.calculator.lead, chips: texts(h.calculator.chips), ctaLabel: h.calculator.ctaLabel,
      },
      {
        __component: 'sections.solar-vs-grid', eyebrow: h.solarVsGrid.eyebrow, heading: h.solarVsGrid.heading,
        subheading: h.solarVsGrid.lead, gridLabel: h.solarVsGrid.gridLabel, gridValue: h.solarVsGrid.gridValue,
        solarLabel: h.solarVsGrid.solarLabel, solarValue: h.solarVsGrid.solarValue, note: h.solarVsGrid.note,
        chartLabel: h.solarVsGrid.chartLabel,
      },
      { __component: 'sections.impact-stats', ...h.impact },
      { __component: 'sections.projects-gallery', ...h.projects },
      { __component: 'sections.testimonials', ...h.testimonials },
      { __component: 'sections.why-us', ...h.why },
      {
        __component: 'sections.faq', eyebrow: h.faq.eyebrow, heading: h.faq.heading, subheading: h.faq.lead,
        openFirst: h.faq.openFirst,
      },
      {
        __component: 'sections.cta-banner', chip: h.cta.chip, heading: h.cta.heading, subheading: h.cta.lead,
        formLabel: h.cta.formLabel, submitLabel: h.cta.submitLabel, replyNote: h.cta.replyNote,
      },
    ];
    await upsertSingle(strapi, 'api::homepage.homepage', { sections }, true);

    // Calculator
    const { presets, ...calc } = calculator;
    await upsertSingle(
      strapi,
      'api::calculator-config.calculator-config',
      { ...calc, presets: presets.map((amount: number) => ({ amount })) },
      false,
    );

    // Collections
    await upsertCollection(
      strapi,
      'api::service.service',
      services.map((sv: any) => ({ ...sv, details: serviceDetails.services?.[sv.slug] ?? null })),
      'slug',
    );

    const solutionData = [];
    for (const { image, ...s } of solutions) {
      solutionData.push({ ...s, features: texts(s.features), image: await media(image), details: solutionDetails[s.slug] ?? null });
    }
    await upsertCollection(strapi, 'api::solution.solution', solutionData, 'slug');

    const projectData = [];
    for (const [i, { image, ...p }] of (collections.projects as any[]).entries()) {
      projectData.push({ ...p, order: i + 1, image: await media(image) });
    }
    await upsertCollection(strapi, 'api::project.project', projectData, 'slug');

    const ordered = (list: any[]) => list.map((x, i) => ({ ...x, order: i + 1 }));
    await upsertCollection(strapi, 'api::testimonial.testimonial', ordered(collections.testimonials), 'quote');
    await upsertCollection(strapi, 'api::faq.faq', ordered(faqs), 'question');
    await upsertCollection(strapi, 'api::brand.brand', ordered(brands), 'name');
    await upsertCollection(strapi, 'api::impact-stat.impact-stat', ordered(collections.impact), 'label');
    await upsertCollection(strapi, 'api::warranty.warranty', ordered(collections.warranty), 'item');

    // Page copy (JSON per page; the web app merges it over its bundled defaults key by key)
    for (const [uid, file] of [
      ['api::about-page.about-page', 'pages/about'],
      ['api::projects-page.projects-page', 'pages/projects'],
      ['api::calculator-page.calculator-page', 'pages/calculator'],
      ['api::contact-page.contact-page', 'pages/contact'],
    ] as const) {
      await upsertSingle(strapi, uid, { content: read(file) }, false);
    }
    await upsertSingle(strapi, 'api::service-defaults.service-defaults', { content: serviceDetails.defaults }, false);
  } finally {
    await strapi.destroy();
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
