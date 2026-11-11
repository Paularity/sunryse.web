import { describe, expect, it } from "vitest";

import type { Package } from "@/lib/content/types";

import calculator from "@/content/calculator.json";
import collections from "@/content/collections.json";
import { systemPrice } from "@/lib/solar-calc";

import { closestPackage, fill, groupPackages, pickPackages, unnumbered } from "./pricing";

const pkg = (slug: string, systemType: Package["systemType"], featured = false): Package => ({
  name: slug,
  slug,
  systemType,
  segment: "residential",
  inverterKw: 5,
  panelCount: 8,
  panelWatt: 645,
  kwp: 5.16,
  bestFor: "",
  price: 100_000,
  featured,
});

const list = [
  pkg("h3", "hybrid"),
  pkg("h5", "hybrid"),
  pkg("h6", "hybrid", true),
  pkg("h8", "hybrid"),
  pkg("h10", "hybrid"),
  pkg("g3", "grid-tie"),
  pkg("g5", "grid-tie"),
];
const slugs = (l: Package[]) => l.map((p) => p.slug);

describe("pricing helpers", () => {
  it("fills label templates and keeps unknown placeholders", () => {
    expect(fill("{count} × {watt} W panels", { count: 10, watt: 645 })).toBe("10 × 645 W panels");
    expect(fill("Up to {n} panels", {})).toBe("Up to {n} panels");
  });

  it("drops a leading section number", () => {
    expect(unnumbered("[ 01 ] System packages")).toBe("System packages");
    expect(unnumbered("Ways to pay")).toBe("Ways to pay");
  });

  it("groups by system type in CMS order", () => {
    expect(groupPackages(list).map((g) => [g.type, g.items.length])).toEqual([
      ["hybrid", 5],
      ["grid-tie", 2],
    ]);
  });

  it("centres the teaser row on the featured package", () => {
    expect(slugs(pickPackages(list))).toEqual(["h5", "h6", "h8"]);
  });

  it("starts at the first package when none is featured, and stays inside the list", () => {
    const plain = list.map((p) => ({ ...p, featured: false }));
    expect(slugs(pickPackages(plain))).toEqual(["h3", "h5", "h6"]);
    const last = list.map((p) => ({ ...p, featured: p.slug === "h10" }));
    expect(slugs(pickPackages(last))).toEqual(["h6", "h8", "h10"]);
  });

  it("tops up from other types when the featured type is short", () => {
    const short = [pkg("g3", "grid-tie", true), pkg("h3", "hybrid"), pkg("h5", "hybrid"), pkg("h6", "hybrid")];
    expect(slugs(pickPackages(short))).toEqual(["g3", "h3", "h5"]);
    expect(slugs(pickPackages(short.slice(0, 2)))).toEqual(["g3", "h3"]);
  });

  it("finds the closest package of the same type, preferring the visitor's segment", () => {
    const sized = (
      slug: string,
      type: Package["systemType"],
      kwp: number,
      segment: Package["segment"] = "residential",
    ) => ({
      ...pkg(slug, type),
      kwp,
      segment,
    });
    const cat = [
      { ...sized("h5", "hybrid", 5.16), batteryKwh: 10 },
      { ...sized("h6", "hybrid", 6.45), batteryKwh: 10 },
      sized("g20", "grid-tie", 20.6, "commercial"),
      sized("g5", "grid-tie", 5.16),
    ];
    expect(closestPackage(cat, { systemType: "hybrid", kwp: 6, batteryKwh: 10 })?.slug).toBe("h6");
    expect(closestPackage(cat, { systemType: "hybrid", kwp: 5.8, batteryKwh: 5 })?.slug).toBe("h5");
    // A battery-ready hybrid estimate without a battery has no comparable package here.
    expect(closestPackage(cat, { systemType: "hybrid", kwp: 6 })).toBeNull();
    expect(closestPackage(cat, { systemType: "grid-tie", kwp: 18, segment: "commercial" })?.slug).toBe("g20");
    expect(closestPackage(cat, { systemType: "grid-tie", kwp: 18, segment: "residential" })?.slug).toBe("g5");
    expect(closestPackage(cat, { systemType: "off-grid", kwp: 5 })).toBeNull();
  });
});

/**
 * The bundled package prices ("starts at") should stay close to what the calculator charges for the same system,
 * so the pricing page and the calculator don't contradict each other. Edits made only in Strapi are not covered here.
 */
describe("package prices vs the calculator", () => {
  for (const p of collections.packages) {
    it(`${p.name} is within 15% of the calculator price`, () => {
      const kwp = (p.panelCount * p.panelWatt) / 1000;
      const { price } = systemPrice(
        {
          systemKwp: kwp,
          systemType: p.systemType as "hybrid" | "grid-tie",
          batteryKwh: p.batteryKwh ?? 0,
          netMetering: kwp <= (calculator.netMeteringCapKw ?? 100),
        },
        calculator,
      );
      expect(Math.abs(p.price - price) / price).toBeLessThan(0.15);
    });
  }
});
