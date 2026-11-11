import type { CalcConfig } from "@/lib/solar-calc";
/**
 * Content contract for the whole site. Components only ever receive these shapes.
 * Data comes from Strapi (mapped in ./from-strapi.ts) and falls back to /content/*.json.
 *
 * Rich headings: `*word*` → glowing frame, `~word~` → sun gradient, `^word^` → sky gradient.
 */

export type IconName =
  | "trending-down" | "leaf" | "battery" | "wrench" | "headset" | "sun" | "zap" | "home" | "building"
  | "factory" | "clipboard-check" | "solar-panel" | "shield-check" | "frame" | "lightbulb" | "droplet"
  | "plug" | "cctv" | "award" | "users" | "check" | "phone" | "mail" | "map-pin" | "message" | "clock"
  | "trees" | "gauge" | "calculator" | "file-text" | "activity" | "banknote" | "credit-card" | "landmark" | "wallet";

export type Link = { label: string; href: string };
export type Img = { src: string; alt: string };
export type Feature = { title: string; description?: string; icon?: IconName; tone?: Tone };
/** Brand tones used for icon tiles, chips and dots. */
export type Tone = "sun" | "amber" | "sky" | "leaf" | "flame" | "navy";

/** Short interface labels (buttons, chips, form fields). Keys are fixed; values are editable in Strapi (global.ui). */
export type UiLabels = Record<string, string>;

export type Site = {
  ui: UiLabels;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  serviceArea: string;
  hours: string;
  license: string;
  messengerUrl: string;
  socials: { platform: "facebook" | "instagram" | "messenger" | "viber" | "tiktok"; url: string; label: string }[];
  announcement: { text: string; longText: string; link: Link };
  nav: (Link & { menu?: "solutions" | "services" })[];
  quoteCta: Link;
  footer: { blurb: string; columns: { title: string; links: Link[] }[]; copyright: string; legal: Link[] };
};

export type ServiceCategory = "systems" | "installation" | "specialty";
export type Service = {
  slug: string;
  title: string;
  summary: string;
  category: ServiceCategory;
  icon: IconName;
  order: number;
};

export type SolutionSlug = "residential" | "commercial" | "industrial";
export type Solution = {
  slug: SolutionSlug;
  title: string;
  tag: string;
  summary: string;
  typicalSize: string;
  sizeMeter: number; // 0–100, decorative
  metricLabel: string;
  metricValue: string;
  metricMeter: number;
  features: string[];
  image: Img;
  caption: string;
};

export type Project = {
  slug: string;
  title: string;
  segment: SolutionSlug;
  location: string;
  sizeKwp: string;
  system: string;
  completed: string;
  image: Img;
};

export type Testimonial = { quote: string; name: string; roleLocation: string; rating: number; initial: string; tone: Tone };
/* ── Pricing (Strapi: solar-package, add-on, payment-option; copy in pricing-page) ── */
export type PackageSystemType = "grid-tie" | "hybrid" | "off-grid";
/** A standard system with an all-in "starts at" price (null = "Ask for price"). kWp = panelCount × panelWatt. */
export type Package = {
  name: string;
  slug: string;
  systemType: PackageSystemType;
  segment: SolutionSlug;
  inverterKw: number;
  panelCount: number;
  panelWatt: number;
  kwp: number;
  batteryKwh?: number;
  batterySpec?: string;
  expandableTo?: number;
  bestFor: string;
  price: number | null;
  badge?: string;
  featured: boolean;
  image?: Img;
};
export type AddOn = { name: string; spec: string; description: string; price: number | null; priceFrom: boolean; unit: string };
export type PaymentKind = "cash" | "card" | "bank-loan" | "gov-loan" | "in-house";
/** Term and rate stay null while they depend on the lender. */
export type PaymentOption = {
  title: string;
  kind: PaymentKind;
  icon: IconName;
  tone: Tone;
  description: string;
  highlight: string;
  termMonths: number | null;
  annualRate: number | null;
  downPaymentPct: number | null;
  requirements: string[];
  ctaLabel?: string;
};

/** About-page team card; without a photo the card shows the initials on a tinted background. */
export type TeamMember = { name: string; role: string; initial: string; tone: Tone; photo?: Img };
export type Faq = { question: string; answer: string; category?: string };
/** A brand partner; with a logo uploaded it shows the logo, otherwise the name. */
export type Brand = { name: string; category: "panel" | "inverter" | "battery"; logo?: Img };
export type ImpactStat = { value: string; label: string; icon: IconName; tone: Tone };
export type Step = { title: string; description: string; tone: Tone };
export type Warranty = { item: string; years: string };

/** Calculator settings (see lib/solar-calc.ts for what each one does) plus copy for the page. */
export type CalculatorConfig = CalcConfig & { disclaimer: string; presets: number[] };

/* ── Home page (Strapi single type "homepage", dynamic zone in this order) ── */
export type HomeContent = {
  hero: {
    status: string;
    tagline: string;
    heading: string;
    subheading: string;
    billLabel: string;
    billDefault: number;
    cta: Link;
    trust: string[];
    estimateLabel: string;
    image: Img;
    imageCaption: string;
    liveChip: string;
  };
  benefits: Feature[];
  marquee: { label: string };
  solutions: { eyebrow: string; heading: string };
  services: { eyebrow: string; heading: string; lead: string; featuredSlugs: string[]; ctaHeading: string; ctaLabel: string };
  process: { eyebrow: string; heading: string; chip: string; steps: Step[] };
  calculator: { eyebrow: string; heading: string; lead: string; chips: string[]; ctaLabel: string };
  solarVsGrid: { eyebrow: string; heading: string; lead: string; gridLabel: string; gridValue: string; solarLabel: string; solarValue: string; note: string; chartLabel: string };
  impact: { eyebrow: string };
  projects: { eyebrow: string; heading: string; ctaLabel: string; allLabel: string; allCount: string };
  testimonials: { eyebrow: string; heading: string; rating: string; reviewsLabel: string };
  why: { eyebrow: string; heading: string; items: Feature[]; warrantyLabel: string; warrantyNote: string };
  faq: { eyebrow: string; heading: string; lead: string; openFirst: boolean };
  cta: { chip: string; heading: string; lead: string; formLabel: string; submitLabel: string; replyNote: string };
};
