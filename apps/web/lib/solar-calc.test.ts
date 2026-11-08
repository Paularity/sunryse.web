import { describe, expect, it } from "vitest";
import { calculateSolar, formatPeso } from "./solar-calc";

describe("calculateSolar", () => {
  it("sizes a ₱10k residential grid-tie system like the approved design", () => {
    const r = calculateSolar({ monthlyBill: 10_000, segment: "residential", systemType: "grid-tie" });
    expect(r.systemKwp).toBe(4.5);
    expect(r.panels).toBe(8);
    expect(Math.round(r.monthlySavings)).toBe(6159);
    expect(r.systemCost).toBe(270_000);
    expect(r.paybackYears).toBeCloseTo(3.54, 1);
    expect(r.batteryKwh).toBe(0);
    expect(r.cumulative).toHaveLength(25);
  });

  it("adds a battery and costs more for hybrid", () => {
    const grid = calculateSolar({ monthlyBill: 10_000, segment: "residential", systemType: "grid-tie" });
    const hybrid = calculateSolar({ monthlyBill: 10_000, segment: "residential", systemType: "hybrid" });
    expect(hybrid.batteryKwh).toBeGreaterThan(0);
    expect(hybrid.systemCost).toBeGreaterThan(grid.systemCost);
  });

  it("caps the system to the available roof area", () => {
    const r = calculateSolar({ monthlyBill: 50_000, segment: "commercial", systemType: "grid-tie", roofAreaM2: 26 });
    expect(r.roofLimited).toBe(true);
    expect(r.panels).toBe(10);
    expect(r.roofAreaM2).toBeLessThanOrEqual(26);
  });

  it("never returns a system smaller than 1 kWp and handles a zero bill", () => {
    const r = calculateSolar({ monthlyBill: 0, segment: "residential", systemType: "grid-tie" });
    expect(r.systemKwp).toBe(1);
    expect(r.billReduction).toBe(0);
  });

  it("keeps bill reduction within 0–100%", () => {
    const r = calculateSolar({ monthlyBill: 3_000, segment: "industrial", systemType: "grid-tie" });
    expect(r.billReduction).toBeGreaterThan(0);
    expect(r.billReduction).toBeLessThanOrEqual(1);
  });
});

describe("formatPeso", () => {
  it("formats with peso sign and thousands separators", () => {
    expect(formatPeso(6159.4)).toBe("₱6,159");
  });
});
