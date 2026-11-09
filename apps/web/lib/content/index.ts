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
  Brand, CalculatorConfig, Faq, HomeContent, ImpactStat, Project, Service, Site, Solution, SolutionSlug, Testimonial, Warranty,
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

export const getSite = () => withFallback(fromStrapi.site, site as Site);
export const getHome = () => withFallback(fromStrapi.home, home as HomeContent);
export const getServices = () =>
  withFallback(fromStrapi.services, services as Service[]).then((list) => [...list].sort((a, b) => a.order - b.order));
export const getService = async (slug: string) => (await getServices()).find((s) => s.slug === slug) ?? null;
export const getSolutions = () => withFallback(fromStrapi.solutions, solutions as Solution[]);
export const getSolution = async (slug: string) => (await getSolutions()).find((s) => s.slug === (slug as SolutionSlug)) ?? null;
export const getProjects = () => withFallback(fromStrapi.projects, collections.projects as Project[]);
export const getTestimonials = () => withFallback(fromStrapi.testimonials, collections.testimonials as Testimonial[]);
export const getFaqs = () => withFallback(fromStrapi.faqs, faqs as Faq[]);
export const getBrands = () => withFallback(fromStrapi.brands, brands as Brand[]);
export const getImpact = () => withFallback(fromStrapi.impact, collections.impact as ImpactStat[]);
export const getWarranty = () => withFallback(fromStrapi.warranty, collections.warranty as Warranty[]);
export const getCalculatorConfig = () => withFallback(fromStrapi.calculator, calculator as CalculatorConfig);
