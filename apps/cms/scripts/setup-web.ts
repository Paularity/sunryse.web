/**
 * Local wiring between Strapi and the website (run once, or again to rotate the token):
 *   pnpm --filter cms setup:web
 *
 * - Creates (or regenerates) the "website" API token: create/update leads + read content.
 * - Writes STRAPI_URL, STRAPI_TOKEN, REVALIDATE_SECRET and NEXT_PUBLIC_SITE_URL to apps/web/.env.local.
 * - Writes WEB_REVALIDATE_URL and WEB_REVALIDATE_SECRET to apps/cms/.env (Strapi then registers the webhook on start).
 * Secrets are written to the git-ignored env files only and never printed.
 */
import { compileStrapi, createStrapi } from '@strapi/strapi';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const CMS_ENV = path.join(__dirname, '..', '.env');
const WEB_ENV = path.join(__dirname, '..', '..', 'web', '.env.local');
const TOKEN_NAME = 'website';
const READ_TYPES = [
  'global', 'homepage', 'calculator-config', 'service', 'solution', 'project', 'brand', 'testimonial', 'faq',
  'article', 'impact-stat', 'warranty', 'about-page', 'projects-page', 'calculator-page', 'contact-page', 'service-defaults',
];

/** Single types only have "find". */
const SINGLE = new Set(['global', 'homepage', 'calculator-config', 'about-page', 'projects-page', 'calculator-page', 'contact-page', 'service-defaults']);

/** Set KEY=value lines in an env file, keeping everything else as is. */
function setEnv(file: string, values: Record<string, string>) {
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/) : [];
  for (const [key, value] of Object.entries(values)) {
    const i = lines.findIndex((l) => l.startsWith(`${key}=`));
    if (i >= 0) lines[i] = `${key}=${value}`;
    else lines.push(`${key}=${value}`);
  }
  fs.writeFileSync(file, lines.filter((l, i, a) => l !== '' || i < a.length - 1).join('\n') + '\n');
}

const readEnv = (file: string, key: string) =>
  fs.existsSync(file) ? fs.readFileSync(file, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim() : undefined;

async function main() {
  const strapiUrl = process.env.STRAPI_URL ?? 'http://localhost:1337';
  const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000';
  const secret = readEnv(WEB_ENV, 'REVALIDATE_SECRET') || crypto.randomBytes(24).toString('hex');

  const strapi = await createStrapi(await compileStrapi()).load();
  strapi.log.level = 'error';
  try {
    const tokens = strapi.service('admin::api-token');
    const permissions = [
      'api::lead.lead.create',
      'api::lead.lead.update', // calculator: attach the estimate to the lead created at the contact step
      ...READ_TYPES.flatMap((t) => (SINGLE.has(t) ? [`api::${t}.${t}.find`] : [`api::${t}.${t}.find`, `api::${t}.${t}.findOne`])),
    ];
    const existing = await tokens.getByName(TOKEN_NAME);
    let accessKey: string;
    if (existing) {
      await tokens.update(existing.id, { permissions });
      accessKey = (await tokens.regenerate(existing.id)).accessKey;
    } else {
      accessKey = (
        await tokens.create({
          name: TOKEN_NAME,
          description: 'Used by the Next.js website: create quote requests, read content.',
          type: 'custom',
          lifespan: null,
          permissions,
        })
      ).accessKey;
    }

    setEnv(WEB_ENV, { STRAPI_URL: strapiUrl, STRAPI_TOKEN: accessKey, REVALIDATE_SECRET: secret, NEXT_PUBLIC_SITE_URL: siteUrl });
    setEnv(CMS_ENV, { WEB_REVALIDATE_URL: `${siteUrl}/api/revalidate`, WEB_REVALIDATE_SECRET: secret });
    console.log(`API token "${TOKEN_NAME}" ${existing ? 'regenerated' : 'created'}.`);
    console.log(`Wrote apps/web/.env.local and apps/cms/.env (secrets not shown). Restart both dev servers.`);
  } finally {
    await strapi.destroy();
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
