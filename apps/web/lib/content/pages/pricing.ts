import "server-only";

import data from "@/content/pages/pricing.json";
import { items, mergeContent, pick, type Raw, text } from "@/lib/content/strapi-page";
import { strapiFetch } from "@/lib/strapi";

/** Text for /pricing and the packages / payment sections. The packages, add-ons and payment options themselves come from getPackages / getAddOns / getPaymentOptions. */
export type PricingPage = typeof data;

const POPULATE = {
  seo: true,
  hero: true,
  packages: { populate: { includes: true } },
  addOns: true,
  payments: true,
  cta: true,
};

const PACKAGE_KEYS = [
  "eyebrow", "heading", "lead", "note", "priceLabel", "askPriceLabel", "ctaLabel", "expandableLabel",
  "gridTieLabel", "hybridLabel", "offGridLabel",
];

/** The Pricing page single type mapped to the page shape; missing pieces stay undefined. */
async function fromStrapi(): Promise<unknown> {
  if (!process.env.STRAPI_URL) return null;
  try {
    const { data: p } = await strapiFetch<{ data: Raw | null }>("pricing-page", {
      query: { populate: POPULATE },
      tags: ["pricing-page"],
    });
    if (!p) return null;
    return {
      meta: { title: text(p.seo?.metaTitle), description: text(p.seo?.metaDescription) },
      hero: pick(p.hero, "eyebrow", "heading", "lead"),
      packages: p.packages && {
        ...pick(p.packages, ...PACKAGE_KEYS),
        includes: items(p.packages.includes, (i) => text(i.value)),
      },
      addOns: pick(p.addOns, "eyebrow", "heading", "lead", "ctaLabel", "fromLabel"),
      payments: pick(p.payments, "eyebrow", "heading", "lead", "ctaLabel", "requirementsLabel", "tip", "disclaimer"),
      cta: pick(p.cta, "heading", "label", "href"),
    };
  } catch {
    return null;
  }
}

/** Pricing page fields from Strapi over the bundled defaults; blank fields fall back. */
export const getPricingPage = async (): Promise<PricingPage> => mergeContent(data, await fromStrapi());
