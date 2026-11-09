import { Section } from "@/components/fx";
import type { HomeContent, Service, UiLabels } from "@/lib/content/types";

import { ServicesDeck } from "./services-deck";
import { ServicesFeatured } from "./services-featured";

export function ServicesSection({ content, services, ui, showAll }: { content: HomeContent["services"]; services: Service[]; ui: UiLabels; showAll?: boolean }) {
  const featured = content.featuredSlugs
    .map((slug) => services.find((s) => s.slug === slug))
    .filter((s): s is Service => Boolean(s))
    .slice(0, 3);

  return (
    <Section id="services" tone="dark" labelledBy="sv-h">
      <ServicesDeck
        eyebrow={content.eyebrow}
        heading={content.heading}
        lead={content.lead}
        ctaHeading={content.ctaHeading}
        ctaLabel={content.ctaLabel}
        services={services}
        ui={ui}
        featuredSlugs={featured.map((s) => s.slug)}
        featured={<ServicesFeatured items={featured} ui={ui} />}
        showAll={showAll}
      />
    </Section>
  );
}
