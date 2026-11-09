import type { Service, Site } from "@/lib/content/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
/** Placeholder values in [brackets] are left out of structured data. */
const real = (v: string) => (v && !v.startsWith("[") ? v : undefined);

/** LocalBusiness + offered services, rendered once in the site layout. */
export function LocalBusinessJsonLd({ site, services }: { site: Site; services: Service[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Electrician",
    additionalType: "https://schema.org/HomeAndConstructionBusiness",
    name: site.name,
    slogan: site.tagline,
    url: SITE,
    logo: `${SITE}/icon.svg`,
    telephone: real(site.phone),
    email: real(site.email),
    address: real(site.address),
    areaServed: real(site.serviceArea) ?? "Philippines",
    sameAs: site.socials.map((s) => s.url).filter((u) => u.startsWith("http")),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Solar services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.summary, url: `${SITE}/services/${s.slug}` },
      })),
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
