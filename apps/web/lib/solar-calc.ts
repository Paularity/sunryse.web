/**
 * SunRyse solar savings calculator — pure functions, no React.
 * Spec: .claude/skills/solar-calculator/SKILL.md. Defaults are placeholders until SunRyse
 * confirms them; at runtime they come from Strapi `calculator-config`.
 */

export type Segment = "residential" | "commercial" | "industrial";
export type SystemType = "grid-tie" | "hybrid";

export type CalcConfig = {
  electricityRate: number; // ₱/kWh
  peakSunHours: number;
  performanceRatio: number;
  panelWatt: number;
  panelAreaM2: number;
  costPerKwpGridTie: number;
  costPerKwpHybrid: number;
  batteryCostPerKwh: number;
  exportCreditRate: number; // ₱/kWh credited for exported energy
  rateEscalation: number; // per year, e.g. 0.03
  degradation: number; // per year, e.g. 0.005
  gridEmissionFactor: number; // kg CO2 per kWh
  kgCo2PerTree: number; // kg CO2 absorbed per tree per year
};

export const DEFAULT_CONFIG: CalcConfig = {
  electricityRate: 12.5,
  peakSunHours: 4.5,
  performanceRatio: 0.8,
  panelWatt: 620,
  panelAreaM2: 2.6,
  costPerKwpGridTie: 60_000,
  costPerKwpHybrid: 75_000,
  batteryCostPerKwh: 28_000,
  exportCreditRate: 6,
  rateEscalation: 0.03,
  degradation: 0.005,
  gridEmissionFactor: 0.71,
  kgCo2PerTree: 21,
};

export const DAYTIME_SHARE: Record<Segment, number> = {
  residential: 0.6,
  commercial: 0.75,
  industrial: 0.85,
};

export type CalcInput = {
  monthlyBill: number;
  segment: Segment;
  systemType: SystemType;
  /** Override the segment's default daytime usage share (0.3–0.9). */
  daytimeUsageShare?: number;
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
  billReduction: number; // 0–1
  systemCost: number;
  paybackYears: number | null; // null when not reached within 25 years
  savings25: number;
  netSavings25: number;
  co2TonsPerYear: number;
  treesEquivalent: number;
  /** Cumulative savings at the end of years 1..25. */
  cumulative: number[];
};

const YEARS = 25;
const SELF_USE_HEADROOM = 1.15;

const roundUpToHalf = (n: number) => Math.ceil(n * 2) / 2;

export function calculateSolar(input: CalcInput, config: CalcConfig = DEFAULT_CONFIG): CalcResult {
  const c = config;
  const bill = Math.max(0, input.monthlyBill);
  const share = clamp(input.daytimeUsageShare ?? DAYTIME_SHARE[input.segment], 0.3, 0.9);
  const hybrid = input.systemType === "hybrid";

  const monthlyKwh = bill / c.electricityRate;
  const dailyKwh = monthlyKwh / 30;
  const yieldPerKwpPerDay = c.peakSunHours * c.performanceRatio;

  let systemKwp = Math.max(1, roundUpToHalf((dailyKwh * share) / yieldPerKwpPerDay));
  let panels = Math.ceil((systemKwp * 1000) / c.panelWatt);
  let roofLimited = false;

  if (input.roofAreaM2 !== undefined && panels * c.panelAreaM2 > input.roofAreaM2) {
    panels = Math.max(1, Math.floor(input.roofAreaM2 / c.panelAreaM2));
    systemKwp = Math.floor(((panels * c.panelWatt) / 1000) * 2) / 2 || 0.5;
    roofLimited = true;
  }

  const annualGenerationKwh = systemKwp * yieldPerKwpPerDay * 365;
  const selfUsed = Math.min(annualGenerationKwh, monthlyKwh * 12 * share * SELF_USE_HEADROOM);
  const exported = annualGenerationKwh - selfUsed;
  const year1Savings = selfUsed * c.electricityRate + exported * c.exportCreditRate;

  const batteryKwh = hybrid ? Math.ceil(dailyKwh * (1 - share) * (input.backupFactor ?? 0.5)) : 0;
  const systemCost =
    systemKwp * (hybrid ? c.costPerKwpHybrid : c.costPerKwpGridTie) + batteryKwh * c.batteryCostPerKwh;

  let total = 0;
  let paybackYears: number | null = null;
  const cumulative: number[] = [];
  for (let year = 1; year <= YEARS; year++) {
    const growth = Math.pow(1 + c.rateEscalation, year - 1) * Math.pow(1 - c.degradation, year - 1);
    const yearSavings = year1Savings * growth;
    if (paybackYears === null && total + yearSavings >= systemCost) {
      paybackYears = year - 1 + (systemCost - total) / yearSavings;
    }
    total += yearSavings;
    cumulative.push(total);
  }

  const co2Kg = annualGenerationKwh * c.gridEmissionFactor;

  return {
    systemKwp,
    panels,
    roofAreaM2: panels * c.panelAreaM2,
    roofLimited,
    batteryKwh,
    annualGenerationKwh,
    year1Savings,
    monthlySavings: year1Savings / 12,
    billReduction: bill > 0 ? Math.min(1, year1Savings / (bill * 12)) : 0,
    systemCost,
    paybackYears,
    savings25: total,
    netSavings25: total - systemCost,
    co2TonsPerYear: co2Kg / 1000,
    treesEquivalent: Math.round(co2Kg / c.kgCo2PerTree),
    cumulative,
  };
}

export const formatPeso = (n: number) =>
  "₱" + Math.round(n).toLocaleString("en-PH", { maximumFractionDigits: 0 });

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
