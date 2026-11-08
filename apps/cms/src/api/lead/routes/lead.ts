import { factories } from '@strapi/strapi';

// Create-only. No public permission is granted (see bootstrap); the web server route creates leads with an API token.
export default factories.createCoreRouter('api::lead.lead', {
  only: ['create'],
});
