import { Section } from "@/components/fx";
import type { HomeContent, Solution } from "@/lib/content/types";

import { SolutionsTabs } from "./solutions-tabs";

export function SolutionsSection({ content, solutions }: { content: HomeContent["solutions"]; solutions: Solution[] }) {
  return (
    <Section id="solutions" tone="grid" labelledBy="solutions-heading">
      <SolutionsTabs content={content} solutions={solutions} />
    </Section>
  );
}
