import "server-only";

import site from "@/content/site.json";
import home from "@/content/home.json";
import services from "@/content/services.json";
import solutions from "@/content/solutions.json";
import faqs from "@/content/faqs.json";
import brands from "@/content/brands.json";
import calculator from "@/content/calculator.json";
import collections from "@/content/collections.json";

import { fromStrapi } from "./from-strapi";
import type {
  Brand,
  CalculatorConfig,
  Faq,
  HomeContent,
  ImpactStat,
  Project,
  Service,
  Site,
  Solution,
  SolutionSlug,
  TeamMember,
  Testimonial,
  Warranty,
} from "./types";

export type * from "./types";

/**
 * Content getters. Strapi is the source of truth when STRAPI_URL is set and reachable;
 * otherwise the defaults in /content are used (same shapes), so pages always render.
 */
async function withFallback<T>(load: () => Promise<T | null>, fallback: T): Promise<T> {
  if (!process.env.STRAPI_URL) return fallback;
  try {
    return (await load()) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Fix common slips in links entered in the CMS: a stray "#" before a web address ("#https://…") is removed,
 * and placeholders ("#", empty, bare text) come back as "" so callers can fall back or hide the link.
 */
export function cleanUrl(url?: string | null): string {
  const v = (url ?? "").trim().replace(/^#+(?=https?:\/\/)/i, "");
  return /^(https?:\/\/|mailto:|tel:|\/)/i.test(v) ? v : "";
}

const defaults = site as Site;
const defaultHref = (label: string, list: { label: string; href: string }[]) =>
  cleanUrl(list.find((l) => l.label === label)?.href);

/** Site settings; interface labels merge key by key so a partly edited set never leaves gaps. Links are cleaned (see cleanUrl). */
export const getSite = async (): Promise<Site> => {
  const s = await withFallback(fromStrapi.site, defaults);
  const socials = s.socials.map((x) => ({ ...x, url: cleanUrl(x.url) })).filter((x) => x.url);
  // "Message us": Messenger if set, else the Facebook page, else the quote form.
  const messengerUrl =
    cleanUrl(s.messengerUrl) ||
    socials.find((x) => x.platform === "messenger")?.url ||
    socials.find((x) => x.platform === "facebook")?.url ||
    "/contact";
  const legal = s.footer.legal
    .map((l) => ({ ...l, href: cleanUrl(l.href) || defaultHref(l.label, defaults.footer.legal) }))
    .filter((l) => l.href);
  const columns = s.footer.columns.map((col) => ({
    ...col,
    links: col.links.map((l) => ({ ...l, href: cleanUrl(l.href) })).filter((l) => l.href),
  }));
  return {
    ...s,
    socials,
    messengerUrl,
    footer: { ...s.footer, legal, columns },
    ui: { ...defaults.ui, ...(s.ui ?? {}) },
  };
};
export const getHome = () => withFallback(fromStrapi.home, home as HomeContent);
export const getServices = () =>
  withFallback(fromStrapi.services, services as Service[]).then((list) => [...list].sort((a, b) => a.order - b.order));
export const getService = async (slug: string) => (await getServices()).find((s) => s.slug === slug) ?? null;
export const getSolutions = () => withFallback(fromStrapi.solutions, solutions as Solution[]);
export const getSolution = async (slug: string) =>
  (await getSolutions()).find((s) => s.slug === (slug as SolutionSlug)) ?? null;
export const getProjects = () => withFallback(fromStrapi.projects, collections.projects as Project[]);
export const getTestimonials = () => withFallback(fromStrapi.testimonials, collections.testimonials as Testimonial[]);
export const getTeam = () => withFallback(fromStrapi.team, collections.team as TeamMember[]);
export const getFaqs = () => withFallback(fromStrapi.faqs, faqs as Faq[]);
export const getBrands = () => withFallback(fromStrapi.brands, brands as Brand[]);
export const getImpact = () => withFallback(fromStrapi.impact, collections.impact as ImpactStat[]);
export const getWarranty = () => withFallback(fromStrapi.warranty, collections.warranty as Warranty[]);
export const getCalculatorConfig = () => withFallback(fromStrapi.calculator, calculator as CalculatorConfig);
