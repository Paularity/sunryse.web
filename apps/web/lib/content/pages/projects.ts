import "server-only";

import data from "@/content/pages/projects.json";
import { pageContent } from "@/lib/content/strapi-page";
import type { Img, Link, Tone } from "@/lib/content/types";

export type ProjectsPage = {
  meta: { title: string; description: string };
  hero: { heading: string; stats: { value: string; label: string }[] };
  featured: {
    chip: string; image: Img; meta: string; title: string; summary: string;
    stats: { label: string; value: string; tone: Tone }[]; cta: Link;
  };
  grid: { total: string; allLabel: string; allNote: string };
  cta: { heading: string; label: string; href: string };
};

/** Copy from Strapi (projects-page.content) merged over the bundled defaults. */
export const getProjectsPage = () => pageContent("projects-page", data as ProjectsPage);
