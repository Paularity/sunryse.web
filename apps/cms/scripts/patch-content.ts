/**
 * Patch specific CMS fields without overwriting whole entries (safe for content edited in the admin):
 *   pnpm --filter cms patch:content scripts/patches/<file>.json [backupDir]
 *
 * Patch file shape:
 *   { "global.ui": { "<label key>": "<text>" },
 *     "homepage": { "<section component, e.g. sections.solar-vs-grid>": { "<field>": "<text>" } } }
 * A JSON backup of every entry it touches is written first (default: ./patch-backups).
 */
import { compileStrapi, createStrapi } from '@strapi/strapi';
import fs from 'node:fs';
import path from 'node:path';

type Patch = { 'global.ui'?: Record<string, string>; homepage?: Record<string, Record<string, unknown>> };

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
