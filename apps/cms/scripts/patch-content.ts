/**
 * Patch specific CMS fields without overwriting whole entries (safe for content edited in the admin):
 *   pnpm --filter cms patch:content scripts/patches/<file>.json [backupDir]
 *
 * Patch file shape:
 *   { "global.ui": { "<label key>": "<text>" },
 *     "homepage": { "<section component, e.g. sections.solar-vs-grid>": { "<field>": "<text>" } },
 *     "global.nav.add": [{ "label": "Pricing", "href": "/pricing", "after": "Calculator" }],
 *     "global.footer.add": [{ "column": "Solutions", "label": "Packages & pricing", "href": "/pricing", "after": "Industrial" }] }
 * Links are only added when no link with the same href is there yet, so a patch can run twice.
 * A JSON backup of every entry it touches is written first (default: ./patch-backups).
 */
import { compileStrapi, createStrapi } from '@strapi/strapi';
import fs from 'node:fs';
import path from 'node:path';

type LinkAdd = { label: string; href: string; after?: string; column?: string };
type Patch = {
  'global.ui'?: Record<string, string>;
  homepage?: Record<string, Record<string, unknown>>;
  'global.nav.add'?: LinkAdd[];
  'global.footer.add'?: LinkAdd[];
};

/** Components are re-sent without their ids (Strapi recreates them), keeping every other field. */
const stripIds = (v: any): any =>
  Array.isArray(v)
    ? v.map(stripIds)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'id').map(([k, x]) => [k, stripIds(x)]))
      : v;

/** Insert a link after the one labelled `after` (or at the end); false when its href is already there. */
function addLink(links: any[], add: LinkAdd) {
  if (links.some((l) => l.href === add.href)) return false;
  const i = add.after ? links.findIndex((l) => l.label === add.after) : -1;
  links.splice(i >= 0 ? i + 1 : links.length, 0, { label: add.label, href: add.href });
  return true;
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: patch:content <patch.json> [backupDir]');
  const patch = JSON.parse(fs.readFileSync(file, 'utf8')) as Patch;
  const backupDir = process.argv[3] ?? 'patch-backups';
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  const strapi = await createStrapi(await compileStrapi()).load();
  try {
    if (patch['global.ui']) {
      const uid = 'api::global.global';
      const g = await strapi.documents(uid).findFirst();
      if (!g) throw new Error('global not found');
      fs.writeFileSync(path.join(backupDir, `global-${stamp}.json`), JSON.stringify(g, null, 2));
      const ui = { ...((g as any).ui ?? {}), ...patch['global.ui'] };
      await strapi.documents(uid).update({ documentId: g.documentId, data: { ui } as any, status: 'published' });
      console.log(`global.ui: ${Object.keys(patch['global.ui']).length} label(s) updated`);
    }
    if (patch['global.nav.add'] || patch['global.footer.add']) {
      const uid = 'api::global.global';
      const g: any = await strapi.documents(uid).findFirst({
        populate: { nav: { populate: { links: true } }, footer: { populate: { columns: { populate: { links: true } }, legal: true, links: true } } },
      } as any);
      if (!g) throw new Error('global not found');
      fs.writeFileSync(path.join(backupDir, `global-links-${stamp}.json`), JSON.stringify(g, null, 2));
      const nav = stripIds(g.nav ?? { links: [] });
      const footer = stripIds(g.footer ?? { columns: [] });
      let added = 0;
      for (const a of patch['global.nav.add'] ?? []) if (addLink((nav.links ??= []), a)) added++;
      for (const a of patch['global.footer.add'] ?? []) {
        const col = (footer.columns ?? []).find((c: any) => c.title === a.column);
        if (col && addLink((col.links ??= []), a)) added++;
        else if (!col) console.warn(`footer column "${a.column}" not found; skipped ${a.href}`);
      }
      if (added) await strapi.documents(uid).update({ documentId: g.documentId, data: { nav, footer } as any, status: 'published' });
      console.log(`global links: ${added} added`);
    }
    if (patch.homepage) {
      const uid = 'api::homepage.homepage';
      const h = await strapi.documents(uid).findFirst({ populate: { sections: { populate: '*' } } as any });
      if (!h) throw new Error('homepage not found');
      fs.writeFileSync(path.join(backupDir, `homepage-${stamp}.json`), JSON.stringify(h, null, 2));
      let changed = 0;
      const sections = ((h as any).sections ?? []).map((s: any) => {
        const p = patch.homepage![s.__component];
        if (!p) return s;
        changed++;
        return { ...s, ...p };
      });
      await strapi.documents(uid).update({ documentId: h.documentId, data: { sections } as any, status: 'published' });
      console.log(`homepage: ${changed} section(s) updated`);
    }
  } finally {
    await strapi.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
