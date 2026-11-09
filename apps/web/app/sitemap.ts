import type { MetadataRoute } from "next";

import { getServices, getSolutions } from "@/lib/content";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, solutions] = await Promise.all([getServices(), getSolutions()]);
  const page = (path: string, priority: number) => ({ url: `${SITE}${path}`, changeFrequency: "monthly" as const, priority });
  return [
    page("/", 1),
    page("/calculator", 0.9),
    page("/services", 0.8),
    page("/contact", 0.9),
    ...solutions.map((s) => page(`/solutions/${s.slug}`, 0.8)),
    ...services.map((s) => page(`/services/${s.slug}`, 0.7)),
    page("/projects", 0.6),
    page("/about", 0.5),
  ];
}
