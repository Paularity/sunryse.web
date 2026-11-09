import "server-only";

import data from "@/content/pages/projects.json";
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

export const getProjectsPage = async () => data as ProjectsPage;
