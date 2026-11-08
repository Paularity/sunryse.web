import type { Core } from '@strapi/strapi';

const PUBLIC_READ = [
  'global', 'homepage', 'calculator-config', 'service', 'solution', 'project', 'brand',
  'testimonial', 'faq', 'article', 'impact-stat',
];

async function grantPublicRead(strapi: Core.Strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  if (!role) return;
  const permQuery = strapi.db.query('plugin::users-permissions.permission');
  for (const name of PUBLIC_READ) {
    for (const action of ['find', 'findOne']) {
      const key = `api::${name}.${name}.${action}`;
      const exists = await permQuery.findOne({ where: { action: key, role: role.id } });
      if (!exists) await permQuery.create({ data: { action: key, role: role.id } });
    }
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicRead(strapi);
  },
};
