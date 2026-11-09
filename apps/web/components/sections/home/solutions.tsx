import { Section } from "@/components/fx";
import type { HomeContent, Solution, UiLabels } from "@/lib/content/types";

import { SolutionsTabs } from "./solutions-tabs";

export function SolutionsSection({ content, solutions, ui }: { content: HomeContent["solutions"]; solutions: Solution[]; ui: UiLabels }) {
  return (
    <Section id="solutions" tone="grid" labelledBy="solutions-heading">
      <SolutionsTabs content={content} solutions={solutions} ui={ui} />
    </Section>
  );
}
