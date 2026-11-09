import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DetailSkeleton } from "@/components/pages/detail-skeleton";
import { ServiceView } from "@/components/pages/service/service-view";
import { getBrands, getService, getServices, getSite } from "@/lib/content";
import { getServiceDetails } from "@/lib/content/pages/service";

type Params = { slug: string };

export async function generateStaticParams() {
  return (await getServices()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return {};
  const { image } = await getServiceDetails(service);
  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: `${service.title} | SunRyse`, description: service.summary, images: [image.src] },
  };
}

/** Sync shell: the param-dependent content streams in behind a hero-shaped skeleton, so navigation is instant. */
export default function ServicePage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ServiceContent params={params} />
    </Suspense>
  );
}

async function ServiceContent({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [service, services, brands, site] = await Promise.all([getService(slug), getServices(), getBrands(), getSite()]);
  if (!service) notFound();

  const details = await getServiceDetails(service);
  // Content can pick the related services; otherwise same category first, topped up so the grid ends full.
  const others = services.filter((s) => s.slug !== service.slug);
  const picked = (details.relatedSlugs ?? []).map((slug) => others.find((s) => s.slug === slug)).filter((s) => s !== undefined);
  const related = (picked.length
    ? picked
    : [...others.filter((s) => s.category === service.category), ...others.filter((s) => s.category !== service.category)]
  ).slice(0, 3);

  return <ServiceView service={service} details={details} brands={brands} related={related} ui={site.ui} />;
}
