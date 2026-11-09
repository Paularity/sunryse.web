import "server-only";

import details from "@/content/pages/solution-details.json";
import type { Link, SolutionSlug, Tone } from "@/lib/content/types";

export type SolutionFlowNode = { kind: "sun" | "panel" | "inverter"; title: string; note: string };

export type SolutionDetails = {
  heading: string;
  primaryCta: Link;
  secondaryCta: Link;
  stats: { label: string; value: string; tone: Tone }[];
  systems: {
    eyebrow: string;
    heading: string;
    cards: { title: string; tag: string; featured: boolean; description: string; points: string[]; best: string }[];
  };
  how: {
    eyebrow: string;
    heading: string;
    nodes: SolutionFlowNode[];
    outputs: { title: string; note: string; tone: Tone }[];
  };
  packages: {
    eyebrow: string;
    heading: string;
    lead: string;
    billLabel: string;
    billUnit: string;
    priceLabel: string;
    ctaLabel: string;
    items: { tag: string; kwp: string; bill: string; panels: string; price: string; featured: boolean }[];
  };
  details: { eyebrow: string; heading: string; lead: string; steps: { title: string; description: string }[] };
  benefits: { eyebrow: string; heading: string };
  faq: { eyebrow: string; heading: string };
  reviews: { eyebrow: string; heading: string };
  cta: { heading: string; label: string };
};

const DETAILS = details as unknown as Record<SolutionSlug, SolutionDetails>;

/** Page copy for a solution template (not part of the shared content contract). */
export function getSolutionDetails(slug: string): SolutionDetails | null {
  return DETAILS[slug as SolutionSlug] ?? null;
}

export const SOLUTION_SLUGS = Object.keys(DETAILS) as SolutionSlug[];
