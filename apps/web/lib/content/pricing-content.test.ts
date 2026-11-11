import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import collections from "@/content/collections.json";
import pricingDefaults from "@/content/pages/pricing.json";

// Server-only modules: the marker package and the cached Strapi fetch are replaced with test doubles.
vi.mock("server-only", () => ({}));
const strapiFetch = vi.fn();
vi.mock("@/lib/strapi", () => ({
  strapiFetch: (...args: unknown[]) => strapiFetch(...args),
  strapiMedia: (url?: string | null) => (url ? `http://cms.test${url}` : null),
  StrapiError: class StrapiError extends Error {
    status = 500;
  },
}));

/** Answer each Strapi path with the given body (unknown paths: no entries). */
function cms(routes: Record<string, unknown>) {
  strapiFetch.mockImplementation(async (path: string) => routes[path] ?? { data: [] });
}

beforeEach(() => {
  vi.stubEnv("STRAPI_URL", "http://cms.test");
  strapiFetch.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe("pricing page copy from Strapi", () => {
  it("uses the bundled copy without a CMS", async () => {
    vi.stubEnv("STRAPI_URL", "");
    const { getPricingPage } = await import("./pages/pricing");
    expect(await getPricingPage()).toEqual(pricingDefaults);
    expect(strapiFetch).not.toHaveBeenCalled();
  });

  it("uses filled fields and keeps defaults for blank ones", async () => {
    cms({
      "pricing-page": {
        data: {
          seo: { metaTitle: "Prices", metaDescription: "  " },
          hero: { heading: "New heading", lead: "" },
          packages: { heading: "Our systems", includes: [{ value: "Panels" }, { value: "VAT" }] },
          payments: { ctaLabel: "See if you qualify", applyLabel: null },
        },
      },
    });
    const { getPricingPage } = await import("./pages/pricing");
    const page = await getPricingPage();
    expect(page.meta).toEqual({ title: "Prices", description: pricingDefaults.meta.description });
    expect(page.hero.heading).toBe("New heading");
    expect(page.hero.lead).toBe(pricingDefaults.hero.lead);
    expect(page.packages.heading).toBe("Our systems");
    expect(page.packages.includes).toEqual(["Panels", "VAT"]);
    expect(page.packages.priceLabel).toBe(pricingDefaults.packages.priceLabel);
    expect(page.payments.ctaLabel).toBe("See if you qualify");
    expect(page.payments.applyLabel).toBe(pricingDefaults.payments.applyLabel);
    expect(page.cta).toEqual(pricingDefaults.cta);
  });

  it("falls back to the bundled copy when Strapi fails", async () => {
    strapiFetch.mockRejectedValue(new Error("offline"));
    const { getPricingPage } = await import("./pages/pricing");
    expect(await getPricingPage()).toEqual(pricingDefaults);
  });
});

describe("packages, add-ons and payment options from Strapi", () => {
  it("maps Strapi values to the site's shapes", async () => {
    cms({
      "solar-packages": {
        data: [
          {
            name: "7 kW Hybrid",
            slug: "7kw",
            systemType: "grid_tie",
            segment: "commercial",
            inverterKw: "7",
            panelCount: 11,
            panelWatt: 645,
            batteryKwh: null,
            batterySpec: "",
            expandableTo: null,
            bestFor: "Shops",
            price: null,
            badge: " ",
            featured: true,
            image: { url: "/uploads/p.jpg", alternativeText: "" },
          },
        ],
      },
      "payment-options": {
        data: [
          {
            title: "Loan",
            kind: "bank_loan",
            icon: "",
            tone: null,
            description: "d",
            highlight: "h",
            termMonths: 60,
            annualRate: "8.5",
            downPaymentPct: null,
            requirements: [{ value: "ID" }],
            ctaLabel: "",
          },
        ],
      },
      "add-ons": {
        data: [{ name: "EV charger", spec: null, description: "x", price: 50000, priceFrom: true, unit: "" }],
      },
    });
    const { getAddOns, getPackages, getPaymentOptions } = await import("./index");
    const [pkg] = await getPackages();
    expect(pkg).toMatchObject({
      systemType: "grid-tie",
      segment: "commercial",
      inverterKw: 7,
      kwp: 7.095,
      price: null,
      featured: true,
      image: { src: "http://cms.test/uploads/p.jpg", alt: "7 kW Hybrid" },
    });
    expect(pkg.badge).toBeUndefined();
    expect(pkg.batterySpec).toBeUndefined();
    expect(pkg.batteryKwh).toBeUndefined();
    const [opt] = await getPaymentOptions();
    expect(opt).toMatchObject({
      kind: "bank-loan",
      icon: "wallet",
      tone: "sun",
      annualRate: 8.5,
      downPaymentPct: null,
    });
    expect(opt.requirements).toEqual(["ID"]);
    expect(opt.ctaLabel).toBeUndefined();
    expect(await getAddOns()).toEqual([
      { name: "EV charger", spec: "", description: "x", price: 50000, priceFrom: true, unit: "" },
    ]);
  });

  it("falls back to the bundled lists when Strapi has no entries", async () => {
    cms({});
    const { getAddOns, getPackages, getPaymentOptions } = await import("./index");
    const packages = await getPackages();
    expect(packages.map((p) => p.slug)).toEqual(collections.packages.map((p) => p.slug));
    expect(packages.every((p) => p.kwp > 0)).toBe(true);
    expect((await getAddOns()).length).toBe(collections.addOns.length);
    expect((await getPaymentOptions()).map((o) => o.kind)).toEqual(collections.paymentOptions.map((o) => o.kind));
  });
});
