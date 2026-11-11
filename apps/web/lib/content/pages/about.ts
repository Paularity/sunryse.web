import "server-only";

import data from "@/content/pages/about.json";
import { items, mergeContent, pick, type Raw, text } from "@/lib/content/strapi-page";
import type { IconName, Img, Tone } from "@/lib/content/types";
import { strapiFetch, strapiMedia } from "@/lib/strapi";

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
  /** Copy only; the people are Team member entries (getTeam). */
  team: { eyebrow: string; heading: string; lead: string; photoLabel: string };
};


const POPULATE = {
  seo: true,
  hero: true,
  story: { populate: { image: true, paragraphs: true } },
  mission: true,
  vision: true,
  values: true,
  timeline: { populate: { items: true } },
  team: true,
  credentials: { populate: { items: true } },
  cta: true,
};

/** The About page single type mapped to the page shape; missing pieces stay undefined. */
async function fromStrapi(): Promise<unknown> {
  if (!process.env.STRAPI_URL) return null;
  try {
    const { data: a } = await strapiFetch<{ data: Raw | null }>("about-page", {
      query: { populate: POPULATE },
      tags: ["about-page"],
    });
    if (!a) return null;
    const image = strapiMedia(a.story?.image?.url);
    return {
      meta: { title: text(a.seo?.metaTitle), description: text(a.seo?.metaDescription) },
      hero: pick(a.hero, "heading", "lead"),
      story: a.story && {
        ...pick(a.story, "eyebrow", "heading", "chip"),
        image: image ? { src: image, alt: text(a.story.image.alternativeText) ?? "" } : undefined,
        paragraphs: items(a.story.paragraphs, (p) => text(p.value)),
      },
      mission: pick(a.mission, "label", "text"),
      vision: pick(a.vision, "label", "text"),
      values: items(a.values, (v) => ({ ...pick(v, "title", "icon", "tone"), description: text(v.description) ?? "" })),
      timeline: a.timeline && {
        ...pick(a.timeline, "eyebrow", "heading"),
        items: items(a.timeline.items, (m) => ({ ...pick(m, "year", "title", "tone"), description: text(m.description) ?? "" })),
      },
      team: pick(a.team, "eyebrow", "heading", "lead", "photoLabel"),
      credentials: a.credentials && {
        ...pick(a.credentials, "eyebrow"),
        items: items(a.credentials.items, (c) => ({ ...pick(c, "title"), detail: text(c.detail) ?? "" })),
      },
      brands: { eyebrow: text(a.brandsEyebrow) },
      cta: pick(a.cta, "heading", "label", "href"),
    };
  } catch {
    return null;
  }
}

/** About page fields from Strapi over the bundled defaults: anything left blank falls back, so partial edits never break the page. */
export const getAboutPage = async () => mergeContent(data as AboutPage, await fromStrapi());
