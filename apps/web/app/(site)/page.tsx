import { BenefitsDock } from "@/components/sections/home/benefits";
import { BrandRail } from "@/components/sections/home/brand-rail";
import { CalculatorTeaser } from "@/components/sections/home/calculator-teaser";
import { HeroConfigurator } from "@/components/sections/home/configurator/hero-configurator";
import { FaqSection } from "@/components/sections/home/faq";
import { ImpactBand } from "@/components/sections/home/impact";
import { ProcessSection } from "@/components/sections/home/process";
import { ProjectsBento } from "@/components/sections/home/projects";
import { QuoteCta } from "@/components/sections/home/quote-cta";
import { ServicesSection } from "@/components/sections/home/services";
import { SolarVsGrid } from "@/components/sections/home/solar-vs-grid";
import { SolutionsSection } from "@/components/sections/home/solutions";
import { TestimonialsSection } from "@/components/sections/home/testimonials";
import { WhySection } from "@/components/sections/home/why";
import { StoryExperience, type StoryCopy } from "@/components/story/story-experience";
import story from "@/content/pages/story.json";
import {
  getBrands,
  getCalculatorConfig,
  getFaqs,
  getHome,
  getImpact,
  getProjects,
  getServices,
  getSite,
  getSolutions,
  getTestimonials,
  getWarranty,
} from "@/lib/content";

export default async function HomePage() {
  const [site, home, services, solutions, projects, testimonials, faqs, brands, impact, warranty, config] =
    await Promise.all([
      getSite(),
      getHome(),
      getServices(),
      getSolutions(),
      getProjects(),
      getTestimonials(),
      getFaqs(),
      getBrands(),
      getImpact(),
      getWarranty(),
      getCalculatorConfig(),
    ]);

  return (
    <>
      {/* Opening: scroll through "a day on solar", then try it with your own bill. */}
      <StoryExperience story={story as StoryCopy} config={config} />
      <HeroConfigurator id="configurator" hero={home.hero} config={config} ui={site.ui} intro={story.configurator} />
      <BenefitsDock items={home.benefits} ui={site.ui} />
      <BrandRail label={home.marquee.label} brands={brands} />
      <SolutionsSection content={home.solutions} solutions={solutions} ui={site.ui} />
      <ServicesSection content={home.services} services={services} ui={site.ui} />
      <ProcessSection content={home.process} ui={site.ui} />
      <CalculatorTeaser content={home.calculator} config={config} ui={site.ui} />
      <SolarVsGrid content={home.solarVsGrid} config={config} ui={site.ui} />
      <ImpactBand content={home.impact} stats={impact} />
      <ProjectsBento content={home.projects} projects={projects.slice(0, 4)} ui={site.ui} />
      <TestimonialsSection content={home.testimonials} testimonials={testimonials} />
      <WhySection content={home.why} warranty={warranty} />
      <FaqSection content={home.faq} faqs={faqs} messengerUrl={site.messengerUrl} ui={site.ui} />
      <QuoteCta content={home.cta} site={site} />
    </>
  );
}
