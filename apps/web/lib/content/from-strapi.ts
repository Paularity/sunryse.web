import "server-only";

import { strapiFetch, strapiMedia, StrapiError } from "@/lib/strapi";
import type {
  Brand, CalculatorConfig, Faq, Feature, HomeContent, IconName, Img, ImpactStat, Link, Project, Service, ServiceCategory,
  Site, Solution, SolutionSlug, Step, TeamMember, Testimonial, Tone, Warranty,
} from "./types";

/**
 * Strapi → content-contract mappers. Each returns null when Strapi has no data for it,
 * which makes the getter fall back to /content defaults. A mapper that finds a required
 * piece missing (e.g. an image) throws, which also triggers the fallback.
 * Model: see .claude/skills/strapi-content.
 */
type Loader<T> = () => Promise<T | null>;

/* ── response helpers (Strapi 5 REST is flat: no `attributes` wrapper) ── */
// Raw Strapi JSON is shape-checked field by field in the mappers below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;
type One = { data: Raw | null };
type Many = { data: Raw[] };

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const num = (v: unknown) => Number(v ?? 0);
const optNum = (v: unknown) => (v === null || v === undefined || v === "" ? undefined : Number(v));
const list = (v: unknown): Raw[] => (Array.isArray(v) ? v : []);
const values = (v: unknown) => list(v).map((x) => str(x.value));

function link(l: Raw | null | undefined): Link {
  return { label: str(l?.label), href: str(l?.href) };
}

function img(m: Raw | null | undefined): Img {
  const src = strapiMedia(m?.url);
  if (!src) throw new Error("Strapi entry is missing a required image");
  return { src, alt: str(m?.alternativeText) };
}

function feature(f: Raw): Feature {
  return {
    title: str(f.title),
    ...(f.description ? { description: str(f.description) } : {}),
    ...(f.icon ? { icon: f.icon as IconName } : {}),
    ...(f.tone ? { tone: f.tone as Tone } : {}),
  };
}

const step = (s: Raw): Step => ({ title: str(s.title), description: str(s.description), tone: (s.tone ?? "sun") as Tone });

async function one(path: string, populate: unknown, tag: string): Promise<Raw | null> {
  try {
    const res = await strapiFetch<One>(path, { query: { populate }, tags: [tag] });
    return res.data ?? null;
  } catch (e) {
    if (e instanceof StrapiError && e.status === 404) return null;
    throw e;
  }
}

async function many(path: string, tag: string, populate?: unknown, sort = "order:asc"): Promise<Raw[] | null> {
  const res = await strapiFetch<Many>(path, {
    query: { sort: [sort], pagination: { pageSize: 100 }, ...(populate ? { populate } : {}) },
    tags: [tag],
  });
  return res.data?.length ? res.data : null;
}

/* ── loaders ── */
const site: Loader<Site> = async () => {
  const g = await one(
    "global",
    {
      socials: true,
      nav: { populate: { links: true } },
      quoteCta: true,
      announcement: { populate: { link: true } },
      footer: { populate: { columns: { populate: { links: true } }, legal: true } },
    },
    "global",
  );
  if (!g) return null;
  return {
    ui: g.ui && typeof g.ui === "object" ? (g.ui as Record<string, string>) : {},
    name: str(g.siteName),
    tagline: str(g.tagline),
    phone: str(g.phone),
    email: str(g.email),
    address: str(g.address),
    serviceArea: str(g.serviceArea),
    hours: str(g.hours),
    license: str(g.license),
    messengerUrl: str(g.messengerUrl),
    socials: list(g.socials).map((s) => ({
      platform: s.platform as Site["socials"][number]["platform"],
      url: str(s.url),
      label: str(s.label) || str(s.platform),
    })),
    announcement: {
      text: str(g.announcement?.text),
      longText: str(g.announcement?.longText),
      link: link(g.announcement?.link),
    },
    nav: list(g.nav?.links).map((l) => ({ ...link(l), ...(l.menu ? { menu: l.menu as "solutions" | "services" } : {}) })),
    quoteCta: link(g.quoteCta),
    footer: {
      blurb: str(g.footer?.blurb),
      columns: list(g.footer?.columns).map((c) => ({ title: str(c.title), links: list(c.links).map(link) })),
      copyright: str(g.footer?.copyright),
      legal: list(g.footer?.legal).map(link),
    },
  };
};

const home: Loader<HomeContent> = async () => {
  const d = await one(
    "homepage",
    {
      sections: {
        on: {
          "sections.hero": { populate: { image: true, cta: true, trust: true } },
          "sections.benefits-strip": { populate: { items: true } },
          "sections.logo-marquee": { populate: "*" },
          "sections.solutions-showcase": { populate: "*" },
          "sections.services-grid": { populate: { featuredSlugs: true } },
          "sections.process-steps": { populate: { steps: true } },
          "sections.calculator-cta": { populate: { chips: true } },
          "sections.solar-vs-grid": { populate: "*" },
          "sections.impact-stats": { populate: "*" },
          "sections.projects-gallery": { populate: "*" },
          "sections.testimonials": { populate: "*" },
          "sections.why-us": { populate: { items: true } },
          "sections.faq": { populate: "*" },
          "sections.cta-banner": { populate: "*" },
        },
      },
    },
    "homepage",
  );
  if (!d) return null;
  const sections = list(d.sections);
  const get = (name: string) => {
    const s = sections.find((x) => x.__component === `sections.${name}`);
    if (!s) throw new Error(`Homepage is missing the "${name}" section`);
    return s;
  };

  const hero = get("hero");
  const benefits = get("benefits-strip");
  const marquee = get("logo-marquee");
  const solutions = get("solutions-showcase");
  const services = get("services-grid");
  const process = get("process-steps");
  const calculator = get("calculator-cta");
  const svg = get("solar-vs-grid");
  const impact = get("impact-stats");
  const projects = get("projects-gallery");
  const testimonials = get("testimonials");
  const why = get("why-us");
  const faq = get("faq");
  const cta = get("cta-banner");

  return {
    hero: {
      status: str(hero.status),
      tagline: str(hero.tagline),
      heading: str(hero.heading),
      subheading: str(hero.subheading),
      billLabel: str(hero.billLabel),
      billDefault: num(hero.billDefault),
      cta: link(hero.cta),
      trust: values(hero.trust),
      estimateLabel: str(hero.estimateLabel),
      image: img(hero.image),
      imageCaption: str(hero.imageCaption),
      liveChip: str(hero.liveChip),
    },
    benefits: list(benefits.items).map(feature),
    marquee: { label: str(marquee.heading) },
    solutions: { eyebrow: str(solutions.eyebrow), heading: str(solutions.heading) },
    services: {
      eyebrow: str(services.eyebrow),
      heading: str(services.heading),
      lead: str(services.subheading),
      featuredSlugs: values(services.featuredSlugs),
      ctaHeading: str(services.ctaHeading),
      ctaLabel: str(services.ctaLabel),
    },
    process: {
      eyebrow: str(process.eyebrow),
      heading: str(process.heading),
      chip: str(process.chip),
      steps: list(process.steps).map(step),
    },
    calculator: {
      eyebrow: str(calculator.eyebrow),
      heading: str(calculator.heading),
      lead: str(calculator.subheading),
      chips: values(calculator.chips),
      ctaLabel: str(calculator.ctaLabel),
    },
    solarVsGrid: {
      eyebrow: str(svg.eyebrow),
      heading: str(svg.heading),
      lead: str(svg.subheading),
      gridLabel: str(svg.gridLabel),
      gridValue: str(svg.gridValue),
      solarLabel: str(svg.solarLabel),
      solarValue: str(svg.solarValue),
      note: str(svg.note),
      chartLabel: str(svg.chartLabel),
    },
    impact: { eyebrow: str(impact.eyebrow) },
    projects: {
      eyebrow: str(projects.eyebrow),
      heading: str(projects.heading),
      ctaLabel: str(projects.ctaLabel),
      allLabel: str(projects.allLabel),
      allCount: str(projects.allCount),
    },
    testimonials: {
      eyebrow: str(testimonials.eyebrow),
      heading: str(testimonials.heading),
      rating: str(testimonials.rating),
      reviewsLabel: str(testimonials.reviewsLabel),
    },
    why: {
      eyebrow: str(why.eyebrow),
      heading: str(why.heading),
      items: list(why.items).map(feature),
      warrantyLabel: str(why.warrantyLabel),
      warrantyNote: str(why.warrantyNote),
    },
    faq: {
      eyebrow: str(faq.eyebrow),
      heading: str(faq.heading),
      lead: str(faq.subheading),
      openFirst: faq.openFirst !== false,
    },
    cta: {
      chip: str(cta.chip),
      heading: str(cta.heading),
      lead: str(cta.subheading),
      formLabel: str(cta.formLabel),
      submitLabel: str(cta.submitLabel),
      replyNote: str(cta.replyNote),
    },
  };
};

const services: Loader<Service[]> = async () => {
  const rows = await many("services", "services");
  return (
    rows?.map((s) => ({
      slug: str(s.slug),
      title: str(s.title),
      summary: str(s.summary),
      category: s.category as ServiceCategory,
      icon: (s.icon || "sun") as IconName,
      order: num(s.order),
    })) ?? null
  );
};

const solutions: Loader<Solution[]> = async () => {
  // Solutions have no "order" field; they are created in display order.
  const rows = await many("solutions", "solutions", { image: true, features: true }, "id:asc");
  return (
    rows?.map((s) => ({
      slug: s.slug as SolutionSlug,
      title: str(s.title),
      tag: str(s.tag),
      summary: str(s.summary),
      typicalSize: str(s.typicalSize),
      sizeMeter: num(s.sizeMeter),
      metricLabel: str(s.metricLabel),
      metricValue: str(s.metricValue),
      metricMeter: num(s.metricMeter),
      features: values(s.features),
      image: img(s.image ?? s.hero),
      caption: str(s.caption),
    })) ?? null
  );
};

const projects: Loader<Project[]> = async () => {
  const rows = await many("projects", "projects", { image: true });
  return (
    rows?.map((p) => ({
      slug: str(p.slug),
      title: str(p.title),
      segment: p.segment as SolutionSlug,
      location: str(p.location),
      sizeKwp: str(p.sizeKwp),
      system: str(p.system),
      completed: str(p.completed),
      image: img(p.image),
    })) ?? null
  );
};

const testimonials: Loader<Testimonial[]> = async () => {
  const rows = await many("testimonials", "testimonials");
  return (
    rows?.map((t) => ({
      quote: str(t.quote),
      name: str(t.name),
      roleLocation: str(t.roleLocation),
      rating: num(t.rating),
      initial: str(t.initial) || str(t.name).charAt(0).toUpperCase(),
      tone: (t.tone ?? "sun") as Tone,
    })) ?? null
  );
};

/** "Ryan Christian D. Requina" → "RR": first and last word. */
const initials = (name: string) => {
  const w = name.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
};

const team: Loader<TeamMember[]> = async () => {
  const rows = await many("team-members", "team", { photo: true });
  return (
    rows?.map((m) => {
      const name = str(m.name);
      const photo = strapiMedia(m.photo?.url);
      return {
        name,
        role: str(m.role),
        initial: str(m.initial) || initials(name),
        tone: (m.tone ?? "sun") as Tone,
        // The person's name describes their portrait better than the library's alt text (often a file name).
        ...(photo ? { photo: { src: photo, alt: name } } : {}),
      };
    }) ?? null
  );
};

const faqs: Loader<Faq[]> = async () => {
  const rows = await many("faqs", "faqs");
  return (
    rows?.map((f) => ({
      question: str(f.question),
      answer: str(f.answer),
      ...(f.category ? { category: str(f.category) } : {}),
    })) ?? null
  );
};

const brands: Loader<Brand[]> = async () => {
  const rows = await many("brands", "brands", { logo: true });
  return (
    rows?.map((b) => {
      const logo = strapiMedia(b.logo?.url);
      return {
        name: str(b.name),
        category: b.category as Brand["category"],
        ...(logo ? { logo: { src: logo, alt: str(b.logo?.alternativeText) || str(b.name) } } : {}),
      };
    }) ?? null
  );
};

const impact: Loader<ImpactStat[]> = async () => {
  const rows = await many("impact-stats", "impact");
  return (
    rows?.map((s) => ({
      value: str(s.value),
      label: str(s.label),
      icon: (s.icon || "sun") as IconName,
      tone: (s.tone ?? "sun") as Tone,
    })) ?? null
  );
};

const warranty: Loader<Warranty[]> = async () => {
  const rows = await many("warranties", "warranty");
  return rows?.map((w) => ({ item: str(w.item), years: str(w.years) })) ?? null;
};

const calculator: Loader<CalculatorConfig> = async () => {
  const c = await one("calculator-config", { presets: true }, "calculator");
  if (!c) return null;
  const presets = list(c.presets).map((p) => num(p.amount));
  return {
    electricityRate: num(c.electricityRate),
    peakSunHours: num(c.peakSunHours),
    performanceRatio: num(c.performanceRatio),
    panelWatt: num(c.panelWatt),
    panelAreaM2: num(c.panelAreaM2),
    costPerKwpGridTie: num(c.costPerKwpGridTie),
    costPerKwpHybrid: num(c.costPerKwpHybrid),
    batteryCostPerKwh: num(c.batteryCostPerKwh),
    exportCreditRate: num(c.exportCreditRate),
    rateEscalation: num(c.rateEscalation),
    degradation: num(c.degradation),
    gridEmissionFactor: num(c.gridEmissionFactor),
    kgCo2PerTree: num(c.kgCo2PerTree),
    // Newer settings: missing in older CMS records → the engine falls back to its defaults.
    fixedChargeMonthly: optNum(c.fixedChargeMonthly),
    demandShareCommercial: optNum(c.demandShareCommercial),
    demandShareIndustrial: optNum(c.demandShareIndustrial),
    basePrice: optNum(c.basePrice),
    roofAdderMetal: optNum(c.roofAdderMetal),
    roofAdderTile: optNum(c.roofAdderTile),
    roofAdderShingles: optNum(c.roofAdderShingles),
    roofAdderConcrete: optNum(c.roofAdderConcrete),
    netMeteringFee: optNum(c.netMeteringFee),
    netMeteringCapKw: optNum(c.netMeteringCapKw),
    vatRate: optNum(c.vatRate),
    creditDelayMonths: optNum(c.creditDelayMonths),
    analysisYears: optNum(c.analysisYears),
    batteryUsableShare: optNum(c.batteryUsableShare),
    sunHoursNcr: optNum(c.sunHoursNcr),
    sunHoursLuzon: optNum(c.sunHoursLuzon),
    sunHoursVisayas: optNum(c.sunHoursVisayas),
    sunHoursMindanao: optNum(c.sunHoursMindanao),
    disclaimer: str(c.disclaimer),
    presets,
  };
};

export const fromStrapi: {
  site: Loader<Site>;
  home: Loader<HomeContent>;
  services: Loader<Service[]>;
  solutions: Loader<Solution[]>;
  projects: Loader<Project[]>;
  testimonials: Loader<Testimonial[]>;
  team: Loader<TeamMember[]>;
  faqs: Loader<Faq[]>;
  brands: Loader<Brand[]>;
  impact: Loader<ImpactStat[]>;
  warranty: Loader<Warranty[]>;
  calculator: Loader<CalculatorConfig>;
} = { site, home, services, solutions, projects, testimonials, team, faqs, brands, impact, warranty, calculator };
