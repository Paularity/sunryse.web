/**
 * Hero configurator: shared state + a simple hour-by-hour energy model.
 * Pure TypeScript (no React) so the controls, the 3D scenes and tests all use the same numbers.
 * Values are illustrative: they follow the calculator's sizing, not a full simulation.
 */
import { calculateSolar, type CalcConfig, type CalcResult, type Segment } from "@/lib/solar-calc";

export type HeroState = {
  bill: number;
  segment: Segment;
  battery: boolean;
  /** Hour of day, 5.0 – 22.0 */
  hour: number;
  brownout: boolean;
  playing: boolean;
};

export const HOUR_MIN = 5;
export const HOUR_MAX = 22;

/* ---------- tiny external store (no re-render per animation frame) ---------- */

export type Store = {
  get: () => HeroState;
  set: (patch: Partial<HeroState>) => void;
  subscribe: (fn: () => void) => () => void;
};

export function createStore(initial: HeroState): Store {
  let state = initial;
  const subs = new Set<() => void>();
  return {
    get: () => state,
    set: (patch) => {
      state = { ...state, ...patch };
      subs.forEach((fn) => fn());
    },
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

/* ---------- sizing ---------- */

export function size(state: Pick<HeroState, "bill" | "segment" | "battery">, config: CalcConfig): CalcResult {
  return calculateSolar(
    {
      monthlyBill: Math.max(state.bill, 0),
      segment: state.segment,
      systemType: state.battery ? "hybrid" : "grid-tie",
      backupFactor: 0.6,
    },
    config,
  );
}

/* ---------- hour-by-hour energy ---------- */

/** Sun strength 0–1 (sunrise 6:00, sunset 18:00). */
export const solarFactor = (h: number) => Math.max(0, Math.sin((Math.PI * (h - 6)) / 12));

/** Relative power use through the day (≈1 on average) for each property type. */
export function loadFactor(h: number, segment: Segment) {
  const bump = (c: number, w: number) => Math.exp(-((h - c) ** 2) / (2 * w * w));
  if (segment === "commercial") return 0.35 + 1.5 * (h >= 8 && h <= 18 ? 1 : 0) * (0.85 + 0.15 * bump(13, 3));
  if (segment === "industrial") return 0.6 + 0.9 * (h >= 6 && h <= 22 ? 1 : 0);
  return 0.5 + 0.55 * bump(7, 1) + 1.25 * bump(19.5, 1.6);
}

/** Battery charge 0–1 across the day: drained overnight, charges late morning, discharges in the evening. */
export function batterySoc(h: number) {
  if (h < 8) return 0.3;
  if (h < 14) return 0.3 + (0.7 * (h - 8)) / 6;
  if (h < 17) return 1;
  return Math.max(0.35, 1 - (0.65 * (h - 17)) / 5);
}

export type Energy = {
  solarKw: number;
  loadKw: number;
  toHomeKw: number;
  exportKw: number;
  importKw: number;
  chargeKw: number;
  dischargeKw: number;
  soc: number;
  /** Home has no power (brownout without a battery). */
  dark: boolean;
  daylight: number; // 0 night … 1 noon
};

export function energyAt(state: HeroState, sized: CalcResult, config: CalcConfig): Energy {
  const h = state.hour;
  const dailyKwh = Math.max(state.bill, 0) / config.electricityRate / 30;
  const loadKw = (dailyKwh / 24) * loadFactor(h, state.segment);
  const solarKw = sized.systemKwp * solarFactor(h) * 0.85;
  const soc = state.battery ? batterySoc(h) : 0;

  // Grid-tie inverters switch off when the grid is down (anti-islanding); hybrid systems keep running.
  if (state.brownout && !state.battery) {
    return {
      solarKw: 0,
      loadKw,
      toHomeKw: 0,
      exportKw: 0,
      importKw: 0,
      chargeKw: 0,
      dischargeKw: 0,
      soc,
      dark: true,
      daylight: solarFactor(h),
    };
  }

  const toHomeKw = Math.min(solarKw, loadKw);
  const surplus = solarKw - toHomeKw;
  const deficit = loadKw - toHomeKw;
  const chargeKw = state.battery && soc < 1 ? Math.min(surplus, Math.max(sized.batteryKwh, 1) * 0.5) : 0;
  const dischargeKw = state.battery && soc > 0.36 ? deficit : 0;
  const exportKw = state.brownout ? 0 : Math.max(0, surplus - chargeKw);
  const importKw = state.brownout ? 0 : Math.max(0, deficit - dischargeKw);
  return {
    solarKw,
    loadKw,
    toHomeKw,
    exportKw,
    importKw,
    chargeKw,
    dischargeKw,
    soc,
    dark: false,
    daylight: solarFactor(h),
  };
}

/** Hours the battery can run essentials (≈40% of average use). */
export function backupHours(sized: CalcResult, bill: number, config: CalcConfig) {
  const avgKw = Math.max(bill, 0) / config.electricityRate / 30 / 24;
  return sized.batteryKwh > 0 ? Math.round((sized.batteryKwh * 0.9) / Math.max(avgKw * 0.4, 0.1)) : 0;
}

export function formatHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round(((h - Math.floor(h)) * 60) / 15) * 15;
  const m = mm === 60 ? 0 : mm;
  const H = mm === 60 ? hh + 1 : hh;
  const suffix = H >= 12 && H < 24 ? "PM" : "AM";
  return `${((H + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Sky colours (top, bottom) for the hero backdrop at a given hour. */
export function skyAt(h: number): [string, string] {
  const stops: [number, string, string][] = [
    [5, "#1b2f63", "#ff9e5e"],
    [6.5, "#7fb6ff", "#ffd8a8"],
    [9, "#9fd0ff", "#fff3dc"],
    [15, "#9fd0ff", "#fff3dc"],
    [17.5, "#7fa6e8", "#ffc37a"],
    [18.6, "#3b4f8f", "#ff8a5c"],
    [20, "#0f1e47", "#33407a"],
    [22, "#0a1638", "#1c2a5c"],
  ];
  let i = 0;
  while (i < stops.length - 2 && h > stops[i + 1][0]) i++;
  const [h0, t0, b0] = stops[i];
  const [h1, t1, b1] = stops[i + 1];
  const k = Math.min(1, Math.max(0, (h - h0) / (h1 - h0)));
  return [mix(t0, t1, k), mix(b0, b1, k)];
}

function mix(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}
