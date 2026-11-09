import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServiceView } from "@/components/pages/service/service-view";
import { getBrands, getService, getServices } from "@/lib/content";
import { getServiceDetails } from "@/lib/content/pages/service";

// Statically generated per slug; a blocking navigation is fine for these detail pages.
export const instant = false;

type Params = { slug: string };

export async function generateStaticParams() {
  return (await getServices()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return {};
  const { image } = getServiceDetails(service);
  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: `${service.title} | SunRyse`, description: service.summary, images: [image.src] },
  };
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [service, services, brands] = await Promise.all([getService(slug), getServices(), getBrands()]);
  if (!service) notFound();

  // Same category first; top up from the rest so the related grid always ends full.
  const others = services.filter((s) => s.slug !== service.slug);
  const related = [
    ...others.filter((s) => s.category === service.category),
    ...others.filter((s) => s.category !== service.category),
  ].slice(0, 3);

  return <ServiceView service={service} details={getServiceDetails(service)} brands={brands} related={related} />;
}
