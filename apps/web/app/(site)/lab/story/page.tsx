import type { Metadata } from "next";

import { StoryExperience, type StoryCopy } from "@/components/story/story-experience";
import story from "@/content/pages/story.json";
import { getCalculatorConfig } from "@/lib/content";

// Prototype: kept out of search until it replaces the homepage.
export const metadata: Metadata = {
  title: story.meta.title,
  description: story.meta.description,
  robots: { index: false, follow: false },
};

export default async function Page() {
  const config = await getCalculatorConfig();
  return <StoryExperience story={story as StoryCopy} config={config} />;
}
