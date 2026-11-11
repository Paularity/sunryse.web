import { describe, expect, it } from "vitest";

import type { Package } from "@/lib/content/types";

import { fill, groupPackages, pickPackages, unnumbered } from "./pricing";

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
});
