/**
 * SunRyse solar estimate — pure functions, no React.
 *
 * Follows the Blueshift-style process (blueshift.ph/solar-pricing):
 *   bill → usage (₱ or kWh, + planned appliances) → when you use power → roof → location
 *   → packages (sized options, one recommended) → battery → one all-in price with payback.
 *
 * How it works
 * - The bill is split into energy charges (which solar can cut) and fixed / demand charges (which it can't).
 * - A typical day is simulated hour by hour: a usage curve shaped by the busy periods you pick, against a
 *   solar curve from your region's sun hours. That gives self-used, exported and (with a battery) stored kWh.
 * - Exports earn the net-metering credit (systems up to the net-metering cap only).
 * - Price = base + per-kWp equipment & install (grid-tie or hybrid) + roof mounting + battery + net-metering
 *   processing, then VAT.
 * - Savings grow with rate escalation and shrink with panel degradation; payback allows for the months before
 *   net-metering credits start.
 * All numbers are placeholders until SunRyse confirms them; at runtime they come from Strapi `calculator-config`.
 */

export type Segment = "residential" | "commercial" | "industrial";
export type SystemType = "grid-tie" | "hybrid";
export type UsagePeriod = "morning" | "daytime" | "evening" | "night";
export type RoofType = "metal" | "tile" | "shingles" | "concrete";
export type Region = "ncr" | "luzon" | "visayas" | "mindanao";

export type CalcConfig = {
  electricityRate: number; // ₱/kWh, all-in energy rate
  peakSunHours: number; // fallback when no region is given
  performanceRatio: number;
  panelWatt: number;
  panelAreaM2: number;
  costPerKwpGridTie: number; // ₱ per kWp before VAT (equipment + installation)
  costPerKwpHybrid: number;
  batteryCostPerKwh: number; // ₱ per kWh before VAT
  exportCreditRate: number; // ₱/kWh credited for exported energy (net metering)
  rateEscalation: number; // per year, e.g. 0.03
  degradation: number; // per year, e.g. 0.005
  gridEmissionFactor: number; // kg CO2 per kWh
  kgCo2PerTree: number;
  // Blueshift-style price book and bill model (optional in older CMS data; defaults below)
  fixedChargeMonthly?: number; // ₱/month supply + metering, not reduced by solar
  demandShareCommercial?: number; // share of a business bill that is demand charges
  demandShareIndustrial?: number;
  basePrice?: number; // ₱ mobilisation, permits, monitoring setup (before VAT)
  roofAdderMetal?: number; // ₱ per kWp for mounting on each roof type
  roofAdderTile?: number;
  roofAdderShingles?: number;
  roofAdderConcrete?: number;
  netMeteringFee?: number; // ₱ processing, guarantee and documents
  netMeteringCapKw?: number; // above this, no net metering credit
  vatRate?: number;
  creditDelayMonths?: number; // months before net-metering credits start
  analysisYears?: number;
  batteryUsableShare?: number;
  sunHoursNcr?: number;
  sunHoursLuzon?: number;
  sunHoursVisayas?: number;
  sunHoursMindanao?: number;
};

export const DEFAULT_CONFIG: Required<CalcConfig> = {
  electricityRate: 12.65, // Meralco-level all-in rate (as used in Blueshift's appliance estimates)
  peakSunHours: 4.5,
  performanceRatio: 0.8,
  panelWatt: 645, // Canadian Solar TOPBiHiKu6 645 W (Blueshift's default panel)
  panelAreaM2: 2.7,
  // Price book calibrated to Blueshift's published results (₱4/kWh ≈ 71 % cheaper with a battery, 4–6 yr payback)
  costPerKwpGridTie: 50_000,
  costPerKwpHybrid: 58_000,
  batteryCostPerKwh: 32_000,
  exportCreditRate: 6,
  rateEscalation: 0.03,
  degradation: 0.005,
  gridEmissionFactor: 0.71,
  kgCo2PerTree: 21,
  fixedChargeMonthly: 60,
  demandShareCommercial: 0.15,
  demandShareIndustrial: 0.25,
  basePrice: 20_000,
  roofAdderMetal: 0,
  roofAdderTile: 4_000,
  roofAdderShingles: 3_000,
  roofAdderConcrete: 6_000,
  netMeteringFee: 15_000,
  netMeteringCapKw: 100,
  vatRate: 0.12,
  creditDelayMonths: 3,
  analysisYears: 30, // panel performance warranty
  batteryUsableShare: 0.9,
  sunHoursNcr: 4.5,
  sunHoursLuzon: 4.6,
  sunHoursVisayas: 4.8,
  sunHoursMindanao: 5.0,
};

/** Fill any missing settings from the defaults (older CMS records). */
export function withDefaults(config: CalcConfig): Required<CalcConfig> {
  const out = { ...DEFAULT_CONFIG } as Record<string, number>;
  for (const [k, v] of Object.entries(config)) if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  return out as Required<CalcConfig>;
}

/* ───────────── usage ───────────── */

const DAYS_PER_MONTH = 30.4;

/** Busy periods used when the visitor doesn't pick any. */
export const DEFAULT_USAGE: Record<Segment, UsagePeriod[]> = {
  residential: ["morning", "evening"],
  commercial: ["daytime"],
  industrial: ["daytime"],
};

const periodOf = (h: number): UsagePeriod =>
  h >= 5 && h < 10 ? "morning" : h >= 10 && h < 16 ? "daytime" : h >= 16 && h < 21 ? "evening" : "night";

/** 24 hourly weights (sum 1) for the busy periods picked. */
export function usageCurve(periods: UsagePeriod[]) {
  const busy = new Set(periods);
  const w = Array.from({ length: 24 }, (_, h) => (busy.has(periodOf(h)) ? 3 : 1));
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / sum);
}

/** 24 hourly solar weights (sum 1): sunrise 6:00, sunset 18:00. */
export const SOLAR_CURVE = (() => {
  const s = Array.from({ length: 24 }, (_, h) => Math.max(0, Math.sin((Math.PI * (h + 0.5 - 6)) / 12)));
  const sum = s.reduce((a, b) => a + b, 0);
  return s.map((x) => x / sum);
})();

export const sunHours = (region: Region | undefined, c: Required<CalcConfig>) =>
  region === "ncr"
    ? c.sunHoursNcr
    : region === "luzon"
      ? c.sunHoursLuzon
      : region === "visayas"
        ? c.sunHoursVisayas
        : region === "mindanao"
          ? c.sunHoursMindanao
          : c.peakSunHours;

/** Simulate one typical day (twice, so the battery starts from its overnight level). */
export function simulateDay({
  dailyKwh,
  dailySolarKwh,
  periods,
  batteryKwh,
  usableShare,
}: {
  dailyKwh: number;
  dailySolarKwh: number;
  periods: UsagePeriod[];
  batteryKwh: number;
  usableShare: number;
}) {
  const load = usageCurve(periods).map((w) => w * dailyKwh);
  const solar = SOLAR_CURVE.map((w) => w * dailySolarKwh);
  const cap = batteryKwh * usableShare;
  const eff = 0.95; // one-way charge / discharge efficiency
  let soc = 0;
  let out = { direct: 0, fromBattery: 0, exported: 0, imported: 0 };
  for (let pass = 0; pass < 2; pass++) {
    out = { direct: 0, fromBattery: 0, exported: 0, imported: 0 };
    for (let h = 0; h < 24; h++) {
      const direct = Math.min(load[h], solar[h]);
      let surplus = solar[h] - direct;
      let deficit = load[h] - direct;
      if (cap > 0 && surplus > 0) {
        const charge = Math.min(surplus, (cap - soc) / eff);
        soc += charge * eff;
        surplus -= charge;
      }
      if (cap > 0 && deficit > 0) {
        const discharge = Math.min(deficit, soc * eff);
        soc -= discharge / eff;
        deficit -= discharge;
        out.fromBattery += discharge;
      }
      out.direct += direct;
      out.exported += surplus;
      out.imported += deficit;
    }
  }
  return out;
}

/* ───────────── estimate ───────────── */

export type EstimateInput = {
  segment: Segment;
  /** Monthly bill in ₱ (ignored when monthlyKwh is given). */
  monthlyBill?: number;
  /** Monthly use in kWh, for visitors who know it. */
  monthlyKwh?: number;
  /** Extra kWh/month from appliances the visitor plans to add. */
  addedKwhPerMonth?: number;
  usage?: UsagePeriod[];
  roof?: RoofType;
  region?: Region;
  /** System size in kWp (normally from a package). */
  systemKwp: number;
  batteryKwh?: number;
  systemType?: SystemType;
};

export type PriceLine = { key: "system" | "mounting" | "battery" | "netMetering" | "base" | "vat"; amount: number };

export type Estimate = {
  segment: Segment;
  systemKwp: number;
  panels: number;
  roofAreaM2: number;
  batteryKwh: number;
  systemType: SystemType;
  netMetering: boolean;
  /** Usage */
  monthlyKwh: number;
  billBefore: number; // ₱/month incl. planned appliances
  fixedCharges: number; // ₱/month solar can't remove (fixed + demand)
  /** Energy (typical month) */
  monthlyProductionKwh: number;
  selfUseKwh: number;
  batteryKwhUsed: number;
  exportKwh: number;
  importKwh: number;
  selfUseShare: number; // of production
  solarShare: number; // of consumption
  /** Money */
  monthlySavings: number;
  newBill: number;
  surplusCredit: number; // ₱/month of credits beyond what the bill can absorb
  billReduction: number; // 0–1
  priceLines: PriceLine[];
  price: number; // all-in, incl. VAT
  paybackYears: number | null;
  years: number;
  lifetimeSavings: number;
  netSavings: number;
  roi: number | null;
  annualProductionKwh: number;
  lifetimeKwh: number;
  solarCostPerKwh: number;
  cheaperThanGrid: number; // 0–1
  co2TonsPerYear: number;
  treesEquivalent: number;
  /** Cumulative savings minus price at the end of each year (for charts). */
  cumulative: number[];
};

/** Monthly kWh and the ₱ split between energy charges and charges solar can't remove. */
export function usageFromBill(
  input: Pick<EstimateInput, "segment" | "monthlyBill" | "monthlyKwh" | "addedKwhPerMonth">,
  config: CalcConfig,
) {
  const c = withDefaults(config);
  const demandShare =
    input.segment === "commercial"
      ? c.demandShareCommercial
      : input.segment === "industrial"
        ? c.demandShareIndustrial
        : 0;
  let monthlyKwh: number;
  let bill: number;
  if (input.monthlyKwh && input.monthlyKwh > 0) {
    monthlyKwh = input.monthlyKwh;
    const energy = monthlyKwh * c.electricityRate;
    bill = (energy + c.fixedChargeMonthly) / (1 - demandShare);
  } else {
    bill = Math.max(0, input.monthlyBill ?? 0);
    const energy = Math.max(0, bill * (1 - demandShare) - c.fixedChargeMonthly);
    monthlyKwh = energy / c.electricityRate;
  }
  const added = Math.max(0, input.addedKwhPerMonth ?? 0);
  monthlyKwh += added;
  bill += added * c.electricityRate;
  const fixedCharges = bill > 0 ? Math.min(bill, bill - monthlyKwh * c.electricityRate) : 0;
  return { monthlyKwh, bill, fixedCharges: Math.max(0, fixedCharges) };
}

export function estimate(input: EstimateInput, config: CalcConfig): Estimate {
  const c = withDefaults(config);
  const { monthlyKwh, bill, fixedCharges } = usageFromBill(input, c);
  const panels = Math.max(1, Math.round((input.systemKwp * 1000) / c.panelWatt));
  const systemKwp = Math.round(((panels * c.panelWatt) / 1000) * 100) / 100;
  const batteryKwh = Math.max(0, input.batteryKwh ?? 0);
  const systemType: SystemType = batteryKwh > 0 ? "hybrid" : (input.systemType ?? "grid-tie");
  const netMetering = systemKwp <= c.netMeteringCapKw;
  const psh = sunHours(input.region, c);

  const dailySolarKwh = systemKwp * psh * c.performanceRatio;
  const day = simulateDay({
    dailyKwh: monthlyKwh / DAYS_PER_MONTH,
    dailySolarKwh,
    periods: input.usage?.length ? input.usage : DEFAULT_USAGE[input.segment],
    batteryKwh,
    usableShare: c.batteryUsableShare,
  });
  const m = (x: number) => x * DAYS_PER_MONTH;
  const monthlyProductionKwh = m(dailySolarKwh);
  const selfUseKwh = m(day.direct + day.fromBattery);
  const exportKwh = m(day.exported);
  const importKwh = m(day.imported);

  // Savings: avoided energy charges + export credits, never below the charges solar can't remove.
  const avoided = selfUseKwh * c.electricityRate;
  const credits = netMetering ? exportKwh * c.exportCreditRate : 0;
  const cap = Math.max(0, bill - fixedCharges);
  const monthlySavings = Math.min(avoided + credits, cap);
  const surplusCredit = Math.max(0, avoided + credits - cap);
  const newBill = bill - monthlySavings;

  // Price (before VAT), then VAT.
  const perKwp = systemType === "hybrid" ? c.costPerKwpHybrid : c.costPerKwpGridTie;
  const roofAdder =
    input.roof === "tile"
      ? c.roofAdderTile
      : input.roof === "shingles"
        ? c.roofAdderShingles
        : input.roof === "concrete"
          ? c.roofAdderConcrete
          : c.roofAdderMetal;
  const lines: PriceLine[] = [
    { key: "system", amount: systemKwp * perKwp },
    { key: "mounting", amount: systemKwp * roofAdder },
    { key: "battery", amount: batteryKwh * c.batteryCostPerKwh },
    { key: "netMetering", amount: netMetering ? c.netMeteringFee : 0 },
    { key: "base", amount: c.basePrice },
  ];
  const subtotal = lines.reduce((a, l) => a + l.amount, 0);
  lines.push({ key: "vat", amount: subtotal * c.vatRate });
  const price = Math.round(subtotal * (1 + c.vatRate));

  // Years: escalation up, degradation down; year 1 loses export credits until net metering starts.
  const years = Math.round(c.analysisYears);
  const annualProductionKwh = monthlyProductionKwh * 12;
  let total = 0;
  let lifetimeKwh = 0;
  let paybackYears: number | null = null;
  const cumulative: number[] = [];
  for (let y = 1; y <= years; y++) {
    const fade = Math.pow(1 - c.degradation, y - 1);
    let yearSavings = monthlySavings * 12 * Math.pow(1 + c.rateEscalation, y - 1) * fade;
    if (y === 1) yearSavings -= Math.min(credits, monthlySavings) * Math.min(12, c.creditDelayMonths);
    if (paybackYears === null && total + yearSavings >= price && yearSavings > 0)
      paybackYears = y - 1 + (price - total) / yearSavings;
    total += yearSavings;
    lifetimeKwh += annualProductionKwh * fade;
    cumulative.push(total - price);
  }
  const solarCostPerKwh = lifetimeKwh > 0 ? price / lifetimeKwh : 0;
  const co2Kg = annualProductionKwh * c.gridEmissionFactor;

  return {
    segment: input.segment,
    systemKwp,
    panels,
    roofAreaM2: panels * c.panelAreaM2,
    batteryKwh,
    systemType,
    netMetering,
    monthlyKwh,
    billBefore: bill,
    fixedCharges,
    monthlyProductionKwh,
    selfUseKwh,
    batteryKwhUsed: m(day.fromBattery),
    exportKwh,
    importKwh,
    selfUseShare: monthlyProductionKwh > 0 ? selfUseKwh / monthlyProductionKwh : 0,
    solarShare: monthlyKwh > 0 ? selfUseKwh / monthlyKwh : 0,
    monthlySavings,
    newBill,
    surplusCredit,
    billReduction: bill > 0 ? Math.min(1, monthlySavings / bill) : 0,
    priceLines: lines,
    price,
    paybackYears,
    years,
    lifetimeSavings: total,
    netSavings: total - price,
    roi: price > 0 ? (total - price) / price : null,
    annualProductionKwh,
    lifetimeKwh,
    solarCostPerKwh,
    cheaperThanGrid: c.electricityRate > 0 ? Math.max(0, 1 - solarCostPerKwh / c.electricityRate) : 0,
    co2TonsPerYear: co2Kg / 1000,
    treesEquivalent: Math.round(co2Kg / c.kgCo2PerTree),
    cumulative,
  };
}

/* ───────────── packages + battery options ───────────── */

export type PackageKey = "essential" | "recommended" | "max";
export type SolarPackage = { key: PackageKey; offset: number; recommended: boolean; estimate: Estimate };

/** Panel count for a share of monthly use. */
function panelsFor(offset: number, monthlyKwh: number, psh: number, c: Required<CalcConfig>) {
  const kwp = (offset * monthlyKwh) / (psh * c.performanceRatio * DAYS_PER_MONTH);
  return Math.max(2, Math.ceil((kwp * 1000) / c.panelWatt));
}

/** Three sized options (≈50 %, 80 % and 105 % of monthly use), one marked recommended. */
export function planPackages(input: Omit<EstimateInput, "systemKwp">, config: CalcConfig): SolarPackage[] {
  const c = withDefaults(config);
  const { monthlyKwh } = usageFromBill(input, c);
  const psh = sunHours(input.region, c);
  const offsets: [PackageKey, number][] = [
    ["essential", 0.5],
    ["recommended", 0.8],
    ["max", 1.05],
  ];
  const seen = new Set<number>();
  const list = offsets.map(([key, offset]) => {
    let p = panelsFor(offset, monthlyKwh, psh, c);
    while (seen.has(p)) p += 1; // keep the options distinct for small bills
    seen.add(p);
    return { key, offset, estimate: estimate({ ...input, systemKwp: (p * c.panelWatt) / 1000 }, c) };
  });
  // Recommend the balanced option unless it pays back more than 10 % slower than the fastest one.
  const paybacks = list.map((p) => p.estimate.paybackYears ?? Infinity);
  const fastest = Math.min(...paybacks);
  const best = paybacks[1] <= fastest * 1.1 ? 1 : paybacks.indexOf(fastest);
  return list.map((p, i) => ({ ...p, recommended: i === best }));
}

export const BATTERY_OPTIONS: Record<Segment, number[]> = {
  residential: [0, 5, 10, 15],
  commercial: [0, 10, 20, 40],
  industrial: [0, 20, 50, 100],
};

/** Hours the battery can run essentials (≈40 % of average use). */
export function backupHours(batteryKwh: number, monthlyKwh: number, config: CalcConfig) {
  const c = withDefaults(config);
  const avgKw = monthlyKwh / DAYS_PER_MONTH / 24;
  return batteryKwh > 0 ? Math.round((batteryKwh * c.batteryUsableShare) / Math.max(avgKw * 0.4, 0.1)) : 0;
}

/* ───────────── planned appliances ───────────── */

export type ApplianceKey = "aircon" | "fridge" | "washer" | "tv" | "ev";
export const APPLIANCES: Record<ApplianceKey, { sizes: { label: string; kw: number }[]; hours: number }> = {
  aircon: {
    sizes: [
      { label: "1.0 HP", kw: 0.75 },
      { label: "1.5 HP", kw: 1.1 },
      { label: "2.0 HP", kw: 1.5 },
      { label: "2.5 HP", kw: 1.9 },
      { label: "3.0 HP", kw: 2.2 },
    ],
    hours: 8,
  },
  fridge: {
    sizes: [
      { label: "Small", kw: 0.06 },
      { label: "Medium", kw: 0.09 },
      { label: "Large", kw: 0.13 },
    ],
    hours: 24,
  },
  washer: {
    sizes: [
      { label: "Top load", kw: 0.4 },
      { label: "Front load", kw: 0.6 },
    ],
    hours: 1,
  },
  tv: {
    sizes: [
      { label: '43"', kw: 0.08 },
      { label: '55"', kw: 0.12 },
      { label: '65"', kw: 0.18 },
    ],
    hours: 5,
  },
  ev: {
    sizes: [
      { label: "3.7 kW", kw: 3.7 },
      { label: "7.4 kW", kw: 7.4 },
    ],
    hours: 2,
  },
};
export type PlannedAppliance = { key: ApplianceKey; size: number; qty: number; hours: number };

export function appliancesKwhPerMonth(list: PlannedAppliance[]) {
  return list.reduce((sum, a) => sum + (APPLIANCES[a.key].sizes[a.size]?.kw ?? 0) * a.qty * a.hours * 30, 0);
}

/* ───────────── compatibility: quick estimate used by the home hero and teaser ───────────── */

export type CalcInput = {
  monthlyBill: number;
  segment: Segment;
  systemType: SystemType;
  /** Fraction of night-time usage the battery should cover (hybrid only). */
  backupFactor?: number;
  /** Available roof area; caps system size when smaller than required. */
  roofAreaM2?: number;
};

export type CalcResult = {
  systemKwp: number;
  panels: number;
  roofAreaM2: number;
  roofLimited: boolean;
  batteryKwh: number;
  annualGenerationKwh: number;
  year1Savings: number;
  monthlySavings: number;
  billReduction: number;
  systemCost: number;
  paybackYears: number | null;
  savings25: number;
  netSavings25: number;
  co2TonsPerYear: number;
  treesEquivalent: number;
  /** Cumulative savings at the end of each year. */
  cumulative: number[];
};

/** Recommended package for a bill (default usage, metal roof, default sun hours). */
export function calculateSolar(input: CalcInput, config: CalcConfig = DEFAULT_CONFIG): CalcResult {
  const c = withDefaults(config);
  const hybrid = input.systemType === "hybrid";
  const { monthlyKwh } = usageFromBill({ segment: input.segment, monthlyBill: input.monthlyBill }, c);
  const nightShare = 1 - (input.segment === "residential" ? 0.6 : input.segment === "commercial" ? 0.75 : 0.85);
  const batteryKwh = hybrid
    ? Math.max(5, Math.ceil(((monthlyKwh / DAYS_PER_MONTH) * nightShare * (input.backupFactor ?? 0.5)) / 5) * 5)
    : 0;
  const base = { segment: input.segment, monthlyBill: input.monthlyBill, systemType: input.systemType, batteryKwh };
  let pick = planPackages(base, c).find((p) => p.recommended)!.estimate;
  let roofLimited = false;
  if (input.roofAreaM2 !== undefined && pick.panels * c.panelAreaM2 > input.roofAreaM2) {
    const panels = Math.max(1, Math.floor(input.roofAreaM2 / c.panelAreaM2));
    pick = estimate({ ...base, systemKwp: (panels * c.panelWatt) / 1000 }, c);
    roofLimited = true;
  }
  return {
    systemKwp: pick.systemKwp,
    panels: pick.panels,
    roofAreaM2: pick.roofAreaM2,
    roofLimited,
    batteryKwh: pick.batteryKwh,
    annualGenerationKwh: pick.annualProductionKwh,
    year1Savings: pick.monthlySavings * 12,
    monthlySavings: pick.monthlySavings,
    billReduction: pick.billReduction,
    systemCost: pick.price,
    paybackYears: pick.paybackYears,
    savings25: pick.lifetimeSavings,
    netSavings25: pick.netSavings,
    co2TonsPerYear: pick.co2TonsPerYear,
    treesEquivalent: pick.treesEquivalent,
    cumulative: pick.cumulative.map((x) => x + pick.price),
  };
}

export const formatPeso = (n: number) => "₱" + Math.round(n).toLocaleString("en-PH", { maximumFractionDigits: 0 });
