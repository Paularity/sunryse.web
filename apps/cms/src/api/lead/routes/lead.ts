import { factories } from '@strapi/strapi';

// Create + update only. No public permission is granted (see bootstrap); the web server routes create a lead
// at the calculator's contact step and attach the estimate later, using the website API token.
export default factories.createCoreRouter('api::lead.lead', {
  only: ['create', 'update'],
});
