import { describe, expect, it } from "vitest";

import { financeEstimate, monthlyPayment, termChoices } from "./financing";

describe("financing", () => {
  it("splits evenly at 0% or an unknown rate", () => {
    expect(monthlyPayment(240_000, 24)).toBe(10_000);
    expect(monthlyPayment(240_000, 24, 0)).toBe(10_000);
  });

  it("amortises with interest (₱1M, 5 yrs, 10%/yr ≈ ₱21,247)", () => {
    expect(monthlyPayment(1_000_000, 60, 10)).toBeCloseTo(21_247.04, 1);
  });

  it("returns 0 for empty inputs", () => {
    expect(monthlyPayment(0, 12, 5)).toBe(0);
    expect(monthlyPayment(100_000, 0, 5)).toBe(0);
  });

  it("applies the down payment and reports interest", () => {
    const e = financeEstimate({ price: 800_000, months: 36, annualRatePct: 0, downPaymentPct: 20 });
    expect(e.downPayment).toBe(160_000);
    expect(e.financed).toBe(640_000);
    expect(e.monthly).toBeCloseTo(17_777.78, 2);
    expect(e.interest).toBeCloseTo(0, 6);
    const withRate = financeEstimate({ price: 800_000, months: 36, annualRatePct: 9 });
    expect(withRate.interest).toBeGreaterThan(0);
    expect(withRate.total).toBeCloseTo(withRate.monthly * 36, 6);
  });

  it("offers up to four terms ending at the maximum", () => {
    expect(termChoices(60)).toEqual([24, 36, 48, 60]);
    expect(termChoices(24)).toEqual([6, 12, 18, 24]);
    expect(termChoices(12)).toEqual([6, 12]);
    expect(termChoices(null)).toEqual([]);
  });
});
