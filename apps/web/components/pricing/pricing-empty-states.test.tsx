import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import collections from "@/content/collections.json";
import pricing from "@/content/pages/pricing.json";
import type { AddOn, Package, PaymentOption } from "@/lib/content/types";

import { AddOnCard, PackageCard } from "./pricing-cards";
import { PackagesTeaser, PaymentsSection } from "./pricing-sections";

const base = { ...(collections.packages[2] as Omit<Package, "kwp">), kwp: 6.45 };

describe("pricing empty states", () => {
  it('shows "Ask for price" when a package or add-on has no price', () => {
    const pkg = renderToStaticMarkup(<PackageCard pkg={{ ...base, price: null }} copy={pricing.packages} />);
    expect(pkg).toContain(pricing.packages.askPriceLabel);
    expect(pkg).not.toContain(pricing.packages.priceLabel);
    const addOn: AddOn = { name: "EV charger", spec: "", description: "", price: null, priceFrom: true, unit: "" };
    const html = renderToStaticMarkup(
      <AddOnCard item={addOn} copy={pricing.addOns} ask={pricing.packages.askPriceLabel} />,
    );
    expect(html).toContain(pricing.packages.askPriceLabel);
    expect(html).not.toContain(pricing.addOns.fromLabel);
  });

  it("shows the price, spec and badge when they are set", () => {
    const html = renderToStaticMarkup(<PackageCard pkg={base} copy={pricing.packages} />);
    expect(html).toContain("₱817,000");
    expect(html).toContain("10 × 645 W panels · 6.45 kWp · 10 kWh battery");
    expect(html).toContain("Popular");
    expect(html).toContain('href="/contact?package=6kw-hybrid"');
  });

  it("renders nothing when there are no packages or payment options", () => {
    expect(renderToStaticMarkup(<PackagesTeaser copy={pricing.packages} packages={[]} />)).toBe("");
    expect(renderToStaticMarkup(<PaymentsSection copy={pricing.payments} options={[]} packages={[]} />)).toBe("");
  });

  it("still offers payment options when no package has a price (no estimate picker)", () => {
    const options = collections.paymentOptions as PaymentOption[];
    const html = renderToStaticMarkup(
      <PaymentsSection copy={pricing.payments} options={options} packages={[{ ...base, price: null }]} />,
    );
    for (const o of options) expect(html).toContain(o.title);
  });
});
