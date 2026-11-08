import fs from 'node:fs';
import path from 'node:path';
import { createStrapi, compileStrapi } from '@strapi/strapi';

const dir = path.join(__dirname, '..', 'database', 'seed');
const read = (n: string) => JSON.parse(fs.readFileSync(path.join(dir, `${n}.json`), 'utf8'));

async function seedSingle(strapi: any, uid: string, data: any, publish: boolean) {
  const existing = await strapi.documents(uid).findFirst();
  if (existing) return console.log(`skip ${uid}`);
  await strapi.documents(uid).create({ data, ...(publish ? { status: 'published' } : {}) });
  console.log(`created ${uid}`);
}

async function seedCollection(strapi: any, uid: string, items: any[], key: string, publish = true) {
  let n = 0;
  for (const data of items) {
    const found = await strapi.documents(uid).findFirst({ filters: { [key]: data[key] } });
    if (found) continue;
    await strapi.documents(uid).create({ data, ...(publish ? { status: 'published' } : {}) });
    n++;
  }
  console.log(`${uid}: created ${n}, skipped ${items.length - n}`);
}

async function main() {
  const appContext = await compileStrapi();
  const strapi = await createStrapi(appContext).load();
  strapi.log.level = 'error';
  try {
    await seedSingle(strapi, 'api::global.global', read('global'), true);
    await seedSingle(strapi, 'api::calculator-config.calculator-config', read('calculator-config'), false);
    await seedCollection(strapi, 'api::service.service', read('services'), 'slug');
    await seedCollection(strapi, 'api::solution.solution', read('solutions'), 'slug');
    await seedCollection(strapi, 'api::brand.brand', read('brands'), 'name');
    await seedCollection(strapi, 'api::faq.faq', read('faqs'), 'question');
    await seedCollection(strapi, 'api::impact-stat.impact-stat', read('impact-stats'), 'label');
  } finally {
    await strapi.destroy();
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
