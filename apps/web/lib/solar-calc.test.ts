import { describe, expect, it } from "vitest";

import {
  appliancesKwhPerMonth,
  backupHours,
  calculateSolar,
  DEFAULT_CONFIG,
  estimate,
  formatPeso,
  planPackages,
  simulateDay,
  usageFromBill,
  withDefaults,
} from "./solar-calc";

const C = DEFAULT_CONFIG;

describe("usage from the bill", () => {
  it("takes fixed charges out before converting pesos to kWh", () => {
    const u = usageFromBill({ segment: "residential", monthlyBill: 10_000 }, C);
    expect(u.monthlyKwh).toBeCloseTo((10_000 - C.fixedChargeMonthly) / C.electricityRate, 5);
    expect(u.fixedCharges).toBeCloseTo(C.fixedChargeMonthly, 5);
  });

  it("treats part of a business bill as demand charges solar can't cut", () => {
    const u = usageFromBill({ segment: "commercial", monthlyBill: 50_000 }, C);
    expect(u.fixedCharges).toBeCloseTo(50_000 * C.demandShareCommercial + C.fixedChargeMonthly, 3);
  });

  it("accepts kWh instead of pesos and adds planned appliances", () => {
    const added = appliancesKwhPerMonth([{ key: "aircon", size: 0, qty: 1, hours: 8 }]);
    expect(added).toBeCloseTo(0.75 * 8 * 30, 5); // 1.0 HP for 8 h ≈ 180 kWh/month (Blueshift shows 179)
    const u = usageFromBill({ segment: "residential", monthlyKwh: 500, addedKwhPerMonth: added }, C);
    expect(u.monthlyKwh).toBeCloseTo(680, 5);
  });
});

describe("hour-by-hour day", () => {
  it("conserves energy: load = self-use + imports, production = self-use + exports + stored", () => {
    const d = simulateDay({ dailyKwh: 25, dailySolarKwh: 20, periods: ["evening"], batteryKwh: 10, usableShare: 0.9 });
    expect(d.direct + d.fromBattery + d.imported).toBeCloseTo(25, 5);
    expect(d.direct + d.exported).toBeLessThanOrEqual(20 + 1e-9);
  });

  it("uses more solar directly when the busy period is daytime", () => {
    const eve = estimate({ segment: "residential", monthlyBill: 10_000, systemKwp: 5, usage: ["evening"] }, C);
    const day = estimate({ segment: "residential", monthlyBill: 10_000, systemKwp: 5, usage: ["daytime"] }, C);
    expect(day.selfUseShare).toBeGreaterThan(eve.selfUseShare);
    expect(day.monthlySavings).toBeGreaterThan(eve.monthlySavings);
  });

  it("a battery moves evening use onto solar", () => {
    const none = estimate({ segment: "residential", monthlyBill: 10_000, systemKwp: 6, usage: ["evening"] }, C);
    const bat = estimate(
      { segment: "residential", monthlyBill: 10_000, systemKwp: 6, usage: ["evening"], batteryKwh: 10 },
      C,
    );
    expect(bat.selfUseShare).toBeGreaterThan(none.selfUseShare);
    expect(bat.systemType).toBe("hybrid");
    expect(bat.price).toBeGreaterThan(none.price);
  });
});

describe("price and payback", () => {
  it("builds the price from line items plus VAT", () => {
    const e = estimate({ segment: "residential", monthlyBill: 10_000, systemKwp: 6.2, roof: "tile" }, C);
    const subtotal = e.priceLines.filter((l) => l.key !== "vat").reduce((a, l) => a + l.amount, 0);
    expect(e.price).toBe(Math.round(subtotal * (1 + C.vatRate)));
    expect(e.priceLines.find((l) => l.key === "mounting")!.amount).toBeCloseTo(e.systemKwp * C.roofAdderTile, 5);
  });

  it("never saves more than the energy charges and reports extra credits as surplus", () => {
    const e = estimate({ segment: "residential", monthlyBill: 3_000, systemKwp: 12 }, C);
    expect(e.newBill).toBeGreaterThanOrEqual(e.fixedCharges - 1e-6);
    expect(e.surplusCredit).toBeGreaterThan(0);
  });

  it("drops net metering above the cap", () => {
    const e = estimate({ segment: "industrial", monthlyBill: 500_000, systemKwp: 150 }, C);
    expect(e.netMetering).toBe(false);
    expect(e.priceLines.find((l) => l.key === "netMetering")!.amount).toBe(0);
  });

  it("lands in Blueshift's published range for a ₱10k home (4–6 yr payback; battery systems ≈ ₱3–5/kWh)", () => {
    const grid = planPackages({ segment: "residential", monthlyBill: 10_000 }, C).find((p) => p.recommended)!.estimate;
    expect(grid.paybackYears!).toBeGreaterThan(4);
    expect(grid.paybackYears!).toBeLessThan(6);
    const hybrid = planPackages({ segment: "residential", monthlyBill: 10_000, batteryKwh: 10 }, C).find(
      (p) => p.recommended,
    )!.estimate;
    expect(hybrid.solarCostPerKwh).toBeGreaterThan(3);
    expect(hybrid.solarCostPerKwh).toBeLessThan(5);
    expect(hybrid.cheaperThanGrid).toBeGreaterThan(0.6);
  });
});

describe("packages", () => {
  it("offers three distinct sizes with exactly one recommended", () => {
    const list = planPackages({ segment: "residential", monthlyBill: 3_000 }, C);
    expect(new Set(list.map((p) => p.estimate.panels)).size).toBe(3);
    expect(list.filter((p) => p.recommended)).toHaveLength(1);
    expect(list[0].estimate.panels).toBeLessThan(list[2].estimate.panels);
  });
});

describe("compatibility estimate (home hero / teaser)", () => {
  it("returns the recommended package and costs more as hybrid", () => {
    const grid = calculateSolar({ monthlyBill: 10_000, segment: "residential", systemType: "grid-tie" });
    const hybrid = calculateSolar({ monthlyBill: 10_000, segment: "residential", systemType: "hybrid" });
    expect(grid.batteryKwh).toBe(0);
    expect(hybrid.batteryKwh).toBeGreaterThan(0);
    expect(hybrid.systemCost).toBeGreaterThan(grid.systemCost);
    expect(grid.cumulative).toHaveLength(withDefaults(C).analysisYears);
  });

  it("caps the system to the available roof area", () => {
    const r = calculateSolar({ monthlyBill: 50_000, segment: "commercial", systemType: "grid-tie", roofAreaM2: 26 });
    expect(r.roofLimited).toBe(true);
    expect(r.panels).toBe(10);
  });

  it("handles a zero bill and keeps bill reduction within 0–100 %", () => {
    expect(calculateSolar({ monthlyBill: 0, segment: "residential", systemType: "grid-tie" }).billReduction).toBe(0);
    const r = calculateSolar({ monthlyBill: 3_000, segment: "industrial", systemType: "grid-tie" });
    expect(r.billReduction).toBeGreaterThan(0);
    expect(r.billReduction).toBeLessThanOrEqual(1);
  });
});

describe("helpers", () => {
  it("estimates backup hours for essentials", () => {
    expect(backupHours(0, 800, C)).toBe(0);
    expect(backupHours(10, 800, C)).toBeGreaterThan(10);
  });
  it("formats pesos", () => {
    expect(formatPeso(6159.4)).toBe("₱6,159");
  });
});
