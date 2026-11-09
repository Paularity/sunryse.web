import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DetailSkeleton } from "@/components/pages/detail-skeleton";
import { SolutionView } from "@/components/pages/solution/solution-view";
import { getFaqs, getSite, getSolution, getTestimonials } from "@/lib/content";
import { getSolutionDetails, SOLUTION_SLUGS } from "@/lib/content/pages/solution";

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

/** Sync shell: the param-dependent content streams in behind a hero-shaped skeleton, so navigation is instant. */
export default function SolutionPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <SolutionContent params={params} />
    </Suspense>
  );
}

async function SolutionContent({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [solution, faqs, testimonials, site] = await Promise.all([getSolution(slug), getFaqs(), getTestimonials(), getSite()]);
  const details = await getSolutionDetails(slug);
  if (!solution || !details) notFound();

  return <SolutionView solution={solution} details={details} faqs={faqs} testimonials={testimonials} ui={site.ui} />;
}
