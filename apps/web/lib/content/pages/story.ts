import "server-only";

import { STATIONS } from "@/components/story/stations";
import data from "@/content/pages/story.json";
import { pageContent } from "@/lib/content/strapi-page";

export type StoryPageContent = typeof data;

/**
 * Homepage story copy from Strapi (story-page.content) merged over the bundled defaults.
 * The camera shots live in code, so there are always exactly as many chapters as shots:
 * missing chapters fall back to the defaults and extra ones are ignored.
 */
export async function getStoryPage(): Promise<StoryPageContent> {
  const merged = await pageContent("story-page", data);
  const chapters = STATIONS.map((_, i) => merged.chapters[i] ?? data.chapters[i]).filter(Boolean);
  return { ...merged, chapters };
}
