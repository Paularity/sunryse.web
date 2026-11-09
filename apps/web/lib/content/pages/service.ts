import "server-only";

import { mergeContent, strapiJson } from "@/lib/content/strapi-page";
import raw from "@/content/pages/service-details.json";
import type { Brand, IconName, Img, Link, Service, ServiceCategory, Tone } from "@/lib/content/types";

export type ServiceDetails = {
  heroTitle: string;
  primaryCta: Link;
  secondaryCta: Link;
  image: Img;
  imageCaption: string;
  benefits: { title: string; description: string; icon: IconName; tone: Tone }[];
  included: { eyebrow: string; heading: string; items: string[] };
  sizing?: {
    title: string;
    columns: [string, string, string];
    rows: { goal: string; detail: string; capacity: string; runtime: string }[];
    footnote: string;
  };
  brandCategories: Brand["category"][];
  brandsEyebrow: string;
  stepsEyebrow: string;
  steps: { title: string; description: string; tone: Tone }[];
  ctaHeading: string;
};

const DEFAULTS = raw.defaults as unknown as Record<ServiceCategory, Omit<ServiceDetails, "heroTitle">>;
const OVERRIDES = raw.services as unknown as Record<string, Partial<ServiceDetails>>;

/** "Solar panel installation" → "Solar panel ^installation^" (highlight the last word). */
function defaultHeroTitle(title: string) {
  const i = title.lastIndexOf(" ");
  return i < 0 ? `^${title}^` : `${title.slice(0, i)} ^${title.slice(i + 1)}^`;
}

const fill = (s: string, title: string) => s.replaceAll("{title}", title.toLowerCase());

/**
 * Category defaults merged with the service's own entry (battery storage is fully dedicated).
 * Strapi wins where set: service-defaults.content (per category) and service.details (per service).
 */
export async function getServiceDetails(service: Service): Promise<ServiceDetails> {
  const [cmsDefaults, cmsOwn] = await Promise.all([
    strapiJson("service-defaults", "content", "service-defaults"),
    strapiJson("services", "details", "services", { filters: { slug: { $eq: service.slug } }, fields: ["details"] }),
  ]);
  const base = mergeContent(DEFAULTS, cmsDefaults)[service.category];
  const bundled = { heroTitle: defaultHeroTitle(service.title), ...base, ...OVERRIDES[service.slug] } as ServiceDetails;
  const merged = mergeContent(bundled, cmsOwn);
  return {
    ...merged,
    imageCaption: fill(merged.imageCaption, service.title).replace(/^./, (c) => c.toUpperCase()),
    ctaHeading: fill(merged.ctaHeading, service.title),
  };
}
