import "server-only";

import data from "@/content/pages/about.json";
import { pageContent } from "@/lib/content/strapi-page";
import type { IconName, Img, Tone } from "@/lib/content/types";

export type AboutPage = {
  meta: { title: string; description: string };
  hero: { heading: string; lead: string };
  story: { eyebrow: string; heading: string; image: Img; chip: string; paragraphs: string[] };
  mission: { label: string; text: string };
  vision: { label: string; text: string };
  values: { title: string; description: string; icon: IconName; tone: Tone }[];
  timeline: { eyebrow: string; heading: string; items: { year: string; title: string; description: string; tone: Tone }[] };
  credentials: { eyebrow: string; items: { title: string; detail: string }[] };
  brands: { eyebrow: string };
  cta: { heading: string; label: string; href: string };
  team: { eyebrow: string; heading: string; lead: string; photoLabel: string; members: { initial: string; name: string; role: string; tone: Tone }[] };
};

/** Copy from Strapi (about-page.content) merged over the bundled defaults. */
export const getAboutPage = () => pageContent("about-page", data as AboutPage);
