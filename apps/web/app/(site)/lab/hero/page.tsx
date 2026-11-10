import type { Metadata } from "next";

import { HeroLab } from "@/components/hero-lab/hero-lab";
import { BenefitsDock } from "@/components/sections/home/benefits";
import { SolutionsSection } from "@/components/sections/home/solutions";
import { getCalculatorConfig, getHome, getSite, getSolutions } from "@/lib/content";

// Preview of the interactive hero (not linked, not indexed). Promote to the home page once approved.
export const metadata: Metadata = { title: "Hero preview", robots: { index: false, follow: false } };

export default async function HeroLabPage() {
  const [site, home, solutions, config] = await Promise.all([
    getSite(),
    getHome(),
    getSolutions(),
    getCalculatorConfig(),
  ]);
  return (
    <>
      <HeroLab hero={home.hero} config={config} ui={site.ui} />
      <BenefitsDock items={home.benefits} ui={site.ui} />
      <SolutionsSection content={home.solutions} solutions={solutions} ui={site.ui} />
    </>
  );
}
