import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SolutionView } from "@/components/pages/solution/solution-view";
import { getFaqs, getSolution, getTestimonials } from "@/lib/content";
import { getSolutionDetails, SOLUTION_SLUGS } from "@/lib/content/pages/solution";

// Statically generated per slug; a blocking navigation is fine for these detail pages.
export const instant = false;

type Params = { slug: string };

export function generateStaticParams() {
  return SOLUTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const solution = await getSolution(slug);
  if (!solution) return {};
  return {
    title: `${solution.title} solar`,
    description: solution.summary,
    alternates: { canonical: `/solutions/${solution.slug}` },
    openGraph: { title: `${solution.title} solar | SunRyse`, description: solution.summary, images: [solution.image.src] },
  };
}

export default async function SolutionPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [solution, faqs, testimonials] = await Promise.all([getSolution(slug), getFaqs(), getTestimonials()]);
  const details = getSolutionDetails(slug);
  if (!solution || !details) notFound();

  return <SolutionView solution={solution} details={details} faqs={faqs} testimonials={testimonials} />;
}
