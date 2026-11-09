import { BenefitsDock } from "@/components/sections/home/benefits";
import { BrandRail } from "@/components/sections/home/brand-rail";
import { CalculatorTeaser } from "@/components/sections/home/calculator-teaser";
import { FaqSection } from "@/components/sections/home/faq";
import { HeroSection } from "@/components/sections/home/hero";
import { ImpactBand } from "@/components/sections/home/impact";
import { ProcessSection } from "@/components/sections/home/process";
import { ProjectsBento } from "@/components/sections/home/projects";
import { QuoteCta } from "@/components/sections/home/quote-cta";
import { ServicesSection } from "@/components/sections/home/services";
import { SolarVsGrid } from "@/components/sections/home/solar-vs-grid";
import { SolutionsSection } from "@/components/sections/home/solutions";
import { TestimonialsSection } from "@/components/sections/home/testimonials";
import { WhySection } from "@/components/sections/home/why";
import {
  getBrands, getCalculatorConfig, getFaqs, getHome, getImpact, getProjects, getServices, getSite, getSolutions, getTestimonials, getWarranty,
} from "@/lib/content";
import { calculateSolar } from "@/lib/solar-calc";

export default async function HomePage() {
  const [site, home, services, solutions, projects, testimonials, faqs, brands, impact, warranty, config] = await Promise.all([
    getSite(), getHome(), getServices(), getSolutions(), getProjects(), getTestimonials(), getFaqs(), getBrands(), getImpact(), getWarranty(), getCalculatorConfig(),
  ]);
  const estimate = calculateSolar({ monthlyBill: home.hero.billDefault, segment: "residential", systemType: "grid-tie" }, config);

  return (
    <>
      <HeroSection hero={home.hero} estimate={estimate} />
      <BenefitsDock items={home.benefits} />
      <BrandRail label={home.marquee.label} brands={brands} />
      <SolutionsSection content={home.solutions} solutions={solutions} />
      <ServicesSection content={home.services} services={services} />
      <ProcessSection content={home.process} />
      <CalculatorTeaser content={home.calculator} config={config} />
      <SolarVsGrid content={home.solarVsGrid} config={config} />
      <ImpactBand content={home.impact} stats={impact} />
      <ProjectsBento content={home.projects} projects={projects.slice(0, 4)} />
      <TestimonialsSection content={home.testimonials} testimonials={testimonials} />
      <WhySection content={home.why} warranty={warranty} />
      <FaqSection content={home.faq} faqs={faqs} messengerUrl={site.messengerUrl} />
      <QuoteCta content={home.cta} site={site} />
    </>
  );
}
