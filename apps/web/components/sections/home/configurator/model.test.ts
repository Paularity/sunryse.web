import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG } from "@/lib/solar-calc";

import { energyAt, formatHour, size, skyAt, type HeroState } from "./model";

const base: HeroState = {
  bill: 10000,
  segment: "residential",
  battery: false,
  hour: 12,
  brownout: false,
  playing: false,
};
const run = (s: Partial<HeroState>) => {
  const st = { ...base, ...s };
  return energyAt(st, size(st, DEFAULT_CONFIG), DEFAULT_CONFIG);
};

describe("hero energy model", () => {
  it("exports surplus at noon and buys from the grid at night", () => {
    expect(run({ hour: 12 }).exportKw).toBeGreaterThan(0);
    const night = run({ hour: 21 });
    expect(night.solarKw).toBe(0);
    expect(night.importKw).toBeGreaterThan(0);
  });

  it("goes dark in a brownout without a battery (grid-tie shuts off)", () => {
    const e = run({ brownout: true, hour: 12 });
    expect(e.dark).toBe(true);
    expect(e.solarKw).toBe(0);
  });

  it("stays powered in a brownout with a battery and never exports", () => {
    const e = run({ brownout: true, battery: true, hour: 20 });
    expect(e.dark).toBe(false);
    expect(e.exportKw).toBe(0);
    expect(e.importKw).toBe(0);
    expect(e.dischargeKw).toBeGreaterThan(0);
  });

  it("formats hours and blends sky colours", () => {
    expect(formatHour(12)).toBe("12:00 PM");
    expect(formatHour(6.5)).toBe("6:30 AM");
    expect(formatHour(21.75)).toBe("9:45 PM");
    expect(skyAt(12)[0]).toMatch(/^#[0-9a-f]{6}$/);
  });
});
