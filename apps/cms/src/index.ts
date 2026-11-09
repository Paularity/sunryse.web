import type { Core } from '@strapi/strapi';

const PUBLIC_READ = [
  'global', 'homepage', 'calculator-config', 'service', 'solution', 'project', 'brand',
  'testimonial', 'faq', 'article', 'impact-stat', 'warranty',
  'about-page', 'projects-page', 'calculator-page', 'contact-page', 'service-defaults',
];

async function grantPublicRead(strapi: Core.Strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  if (!role) return;
  const permQuery = strapi.db.query('plugin::users-permissions.permission');
  for (const name of PUBLIC_READ) {
    const kind = (strapi.contentTypes as unknown as Record<string, { kind?: string }>)[`api::${name}.${name}`]?.kind;
    for (const action of kind === 'singleType' ? ['find'] : ['find', 'findOne']) {
      const key = `api::${name}.${name}.${action}`;
      const exists = await permQuery.findOne({ where: { action: key, role: role.id } });
      if (!exists) await permQuery.create({ data: { action: key, role: role.id } });
    }
  }
}

const WEBHOOK_NAME = 'Website revalidate';
const WEBHOOK_EVENTS = [
  'entry.create', 'entry.update', 'entry.delete', 'entry.publish', 'entry.unpublish',
  'media.create', 'media.update', 'media.delete',
];

/**
 * Keep a webhook that tells the website to refresh its cached content after any edit.
 * Driven by WEB_REVALIDATE_URL + WEB_REVALIDATE_SECRET (apps/cms/.env); skipped when unset.
 */
async function ensureRevalidateWebhook(strapi: Core.Strapi) {
  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.WEB_REVALIDATE_SECRET;
  if (!url || !secret) return;
  const store = strapi.get('webhookStore');
  const runner = strapi.get('webhookRunner');
  const data = { name: WEBHOOK_NAME, url, headers: { 'x-revalidate-secret': secret }, events: WEBHOOK_EVENTS, isEnabled: true };
  const existing = (await store.findWebhooks()).find((w: { name: string }) => w.name === WEBHOOK_NAME);
  if (existing) {
    const updated = await store.updateWebhook(existing.id, data);
    if (updated) runner.update(updated);
  } else {
    runner.add(await store.createWebhook(data));
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicRead(strapi);
    await ensureRevalidateWebhook(strapi);
  },
};
