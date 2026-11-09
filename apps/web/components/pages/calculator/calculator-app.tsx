"use client";

import { ArrowRight, Minus, Plus } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Hud } from "@/components/fx";
import { Button } from "@/components/ui/button";
import type { CalculatorConfig } from "@/lib/content/types";
import { calculateSolar, formatPeso, type Segment, type SystemType } from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

export type CalculatorUiContent = {
  billLabel: string;
  billTip: string;
  propertyLabel: string;
  properties: { value: string; label: string }[];
  systemLabel: string;
  systems: { value: string; label: string; sub: string }[];
  howLabel: string;
  chartChip: string;
  ctaText: string;
  ctaLabel: string;
};

export type CalculatorAppProps = {
  config: CalculatorConfig;
  content: CalculatorUiContent;
  initialBill?: number;
  initialSegment?: Segment;
  initialSystem?: SystemType;
};

const SLIDER_MIN = 2000;
const SLIDER_MAX = 200000;
const MAX_BILL = 10_000_000;

const labelCls = "font-label text-xs text-ink-muted";
const monoTile = "font-label text-[11px] uppercase tracking-[0.12em]";
const focusRing = "outline-none focus-visible:ring-3 focus-visible:ring-sky-600/40";

const rangeCls = cn(
  "my-1 h-11 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none",
  "[&::-webkit-slider-runnable-track]:h-2.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(90deg,var(--color-sun-300),var(--color-sun-600))] [&::-webkit-slider-runnable-track]:shadow-[0_0_14px_rgb(255_138_0/0.55)]",
  "[&::-moz-range-track]:h-2.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[linear-gradient(90deg,var(--color-sun-300),var(--color-sun-600))]",
  "[&::-webkit-slider-thumb]:-mt-[11px] [&::-webkit-slider-thumb]:size-8 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-navy-900 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_6px_rgb(255_138_0/0.18),0_6px_16px_-4px_rgb(11_31_77/0.5)]",
  "[&::-moz-range-thumb]:size-[26px] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-navy-900 [&::-moz-range-thumb]:bg-white",
  "focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_5px_rgb(21_83_199/0.4)] focus-visible:[&::-moz-range-thumb]:shadow-[0_0_0_5px_rgb(21_83_199/0.4)]",
);

const pct = (n: number) => +(n * 100).toFixed(1);
const presetLabel = (v: number) => (v >= 1000 ? `₱${v / 1000}k` : `₱${v}`);

export function CalculatorApp({ config, content, initialBill, initialSegment, initialSystem }: CalculatorAppProps) {
  const uid = useId();
  const [bill, setBill] = useState(initialBill ?? 10000);
  const [segment, setSegment] = useState<Segment>(initialSegment ?? "residential");
  const [system, setSystem] = useState<SystemType>(initialSystem ?? "grid-tie");
  const [howOpen, setHowOpen] = useState(false);

  const r = useMemo(
    () => calculateSolar({ monthlyBill: bill, segment, systemType: system }, config),
    [bill, segment, system, config],
  );
  const hybrid = system === "hybrid";
  const payback = r.paybackYears === null ? "25+" : r.paybackYears.toFixed(1);
  const kwp = `${r.systemKwp.toFixed(1)} kWp`;
  const quoteHref = `/contact?bill=${Math.round(bill)}&segment=${segment}&type=${system}`;

  const max = Math.max(r.savings25, r.systemCost, 1);
  const costPos = `${((r.systemCost / max) * 100).toFixed(1)}%`;

  const specs = [
    { l: "System size", v: kwp },
    { l: "Panels", v: `${r.panels} × ${config.panelWatt}W` },
    { l: "Roof area", v: `≈ ${Math.round(r.roofAreaM2)} m²` },
    hybrid ? { l: "Battery", v: `${r.batteryKwh} kWh` } : { l: "Est. price", v: formatPeso(r.systemCost) },
    { l: "CO₂ avoided", v: `${r.co2TonsPerYear.toFixed(1)} t/yr` },
  ];

  const assumptions = [
    `Grid rate ₱${config.electricityRate.toFixed(2)}/kWh · ${config.peakSunHours} peak sun hours · ${pct(config.performanceRatio)}% system performance`,
    `${config.panelWatt} W panels (${config.panelAreaM2} m² each) · panels lose ${pct(config.degradation)}%/yr`,
    `Grid rates rise ${pct(config.rateEscalation)}%/yr · exported power credited at ₱${config.exportCreditRate}/kWh`,
    `Grid-tie ${formatPeso(config.costPerKwpGridTie)}/kWp · hybrid ${formatPeso(config.costPerKwpHybrid)}/kWp + battery ${formatPeso(config.batteryCostPerKwh)}/kWh`,
    config.disclaimer,
  ];

  return (
    <div className="relative">
      <div className="grid items-start gap-7 lg:grid-cols-[420px_minmax(0,1fr)]">
        {/* INPUTS */}
        <div className="glass-card flex min-w-0 flex-col gap-6 rounded-3xl p-5 sm:p-[26px] lg:sticky lg:top-[calc(var(--site-top)+16px)]">
          <div className="flex flex-col gap-2.5">
            <label htmlFor={`${uid}-bill`} className={labelCls}>
              {content.billLabel}
            </label>
            <span className="flex min-h-[60px] items-center gap-2 rounded-[14px] border-2 border-navy-900 bg-white px-3.5 focus-within:ring-3 focus-within:ring-sky-600/40">
              <span className="font-display text-[26px] font-bold text-ink-muted" aria-hidden>
                ₱
              </span>
              <input
                id={`${uid}-bill`}
                inputMode="numeric"
                autoComplete="off"
                value={bill ? bill.toLocaleString("en-PH") : ""}
                placeholder="0"
                aria-describedby={`${uid}-tip`}
                onChange={(e) => setBill(Math.min(Number(e.target.value.replace(/\D/g, "")), MAX_BILL))}
                className="w-full min-w-0 bg-transparent font-display text-[30px] font-bold text-navy-900 outline-none"
              />
            </span>
            <input
              type="range"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step={500}
              value={Math.min(Math.max(bill, SLIDER_MIN), SLIDER_MAX)}
              onChange={(e) => setBill(Number(e.target.value))}
              aria-label="Adjust monthly bill"
              aria-valuetext={formatPeso(bill)}
              className={rangeCls}
            />
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 font-label text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {config.presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={bill === p}
                  onClick={() => setBill(p)}
                  className={cn(
                    "min-h-11 flex-none rounded-full border px-[15px] tracking-[0.12em] text-navy-900 uppercase",
                    focusRing,
                    bill === p ? "border-sun-500 bg-dawn-50" : "border-navy-900/20 bg-white hover:border-navy-900/40",
                  )}
                >
                  {presetLabel(p)}
                </button>
              ))}
            </div>
            <span id={`${uid}-tip`} className="text-[13px] text-ink-muted">
              {content.billTip}
            </span>
          </div>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className={cn(labelCls, "mb-2.5")}>{content.propertyLabel}</legend>
            <div className="grid grid-cols-3 gap-1.5 rounded-[14px] bg-day-100 p-1.5">
              {content.properties.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={segment === o.value}
                  onClick={() => setSegment(o.value as Segment)}
                  className={cn(
                    "min-h-11 rounded-[10px] font-display text-sm font-bold",
                    focusRing,
                    segment === o.value ? "bg-navy-900 text-white" : "text-navy-900 hover:bg-white/70",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className={cn(labelCls, "mb-2.5")}>{content.systemLabel}</legend>
            <div className="grid grid-cols-2 gap-2">
              {content.systems.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={system === o.value}
                  onClick={() => setSystem(o.value as SystemType)}
                  className={cn(
                    "flex min-h-[72px] flex-col gap-1 rounded-[14px] border-2 p-3.5 text-left text-navy-900",
                    focusRing,
                    system === o.value ? "border-sun-500 bg-dawn-50" : "border-navy-900/10 bg-white hover:border-navy-900/30",
                  )}
                >
                  <span className="font-display text-[15px] font-bold">{o.label}</span>
                  <span className="text-[13px] text-ink-muted">{o.sub}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="border-t border-navy-900/10 pt-1.5">
            <button
              type="button"
              aria-expanded={howOpen}
              aria-controls={`${uid}-how`}
              onClick={() => setHowOpen((o) => !o)}
              className={cn("flex min-h-12 w-full items-center justify-between font-display text-[15px] font-bold text-navy-900", focusRing)}
            >
              {content.howLabel}
              {howOpen ? <Minus className="size-5 text-sun-700" aria-hidden /> : <Plus className="size-5 text-sun-700" aria-hidden />}
            </button>
            {howOpen ? (
              <ul id={`${uid}-how`} className="m-0 list-disc pb-1 pl-[18px] text-sm leading-[1.7] text-ink-muted">
                {assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {/* RESULTS */}
        <div className="flex min-w-0 flex-col gap-3.5">
          <p className="sr-only" role="status" aria-live="polite">
            {`Estimated system ${kwp}, saving ${formatPeso(r.monthlySavings)} per month, payback ${payback} years, 25-year savings ${formatPeso(r.savings25)}.`}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-[20px] bg-[linear-gradient(150deg,var(--color-leaf-500),var(--color-leaf-600))] p-[22px] text-white shadow-[0_16px_32px_-16px_rgb(30_138_58/0.7)]">
              <span className={cn(monoTile, "block")}>Monthly savings</span>
              <span className="font-display text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.02em]">{formatPeso(r.monthlySavings)}</span>
              <span className={cn(monoTile, "mt-1 block")}>−{Math.round(r.billReduction * 100)}% on your bill</span>
            </div>
            <div className="rounded-[20px] bg-[linear-gradient(150deg,var(--color-sun-300),var(--color-sun-500))] p-[22px] text-navy-900 shadow-[0_16px_32px_-16px_rgb(255_138_0/0.7)]">
              <span className={cn(monoTile, "block")}>Payback</span>
              <span className="font-display text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.02em]">{payback}</span>
              <span className={cn(monoTile, "mt-1 block")}>years</span>
            </div>
            <div className="col-span-2 rounded-[20px] bg-navy-900 p-[22px] text-white sm:col-span-1">
              <span className={cn(monoTile, "block text-ink-glow")}>25-year savings</span>
              <span className="font-display text-[clamp(28px,3vw,40px)] font-bold tracking-[-0.02em]">{formatPeso(r.savings25)}</span>
              <span className={cn(monoTile, "mt-1 block text-ink-glow")}>net of system cost: {formatPeso(r.netSavings25)}</span>
            </div>
          </div>

          <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {specs.map((s, i) => (
              <div key={s.l} className={cn("glass-card min-w-0 rounded-2xl p-4", i === 4 && "col-span-2 sm:col-span-1")}>
                <dt className={cn(monoTile, "block text-ink-muted")}>{s.l}</dt>
                <dd className="m-0 font-display text-[21px] font-bold">{s.v}</dd>
              </div>
            ))}
          </dl>

          <div className="fx-screen flex flex-col gap-3 rounded-[20px] p-[22px]">
            <div className="flex flex-wrap items-center justify-between gap-2.5 font-label text-[11px] uppercase tracking-[0.12em]">
              <Hud dot="green">{content.chartChip}</Hud>
              <span className="inline-flex items-center gap-3 text-ink-soft">
                <span className="inline-flex items-center gap-1.5">
                  <i className="block h-0 w-3.5 border-t-2 border-dashed border-glow-flame" aria-hidden />
                  cost {formatPeso(r.systemCost)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="block size-2.5 rounded-[3px] bg-glow-leaf" aria-hidden />
                  paid off
                </span>
              </span>
            </div>
            <div
              className="relative flex h-[200px] items-end gap-[3px] border-b border-white/15"
              role="img"
              aria-label={`Bar chart of cumulative savings over 25 years compared with a system cost of ${formatPeso(r.systemCost)}`}
            >
              {r.cumulative.map((c, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-t bg-current shadow-[0_0_12px_-2px_currentColor] transition-[height] duration-300 motion-reduce:transition-none",
                    c >= r.systemCost ? "text-glow-leaf" : "text-glow-sky",
                  )}
                  style={{ height: `${((c / max) * 100).toFixed(1)}%` }}
                />
              ))}
              <div
                className="absolute inset-x-0 border-t-2 border-dashed border-glow-flame drop-shadow-[0_0_4px_var(--color-glow-flame)]"
                style={{ bottom: costPos }}
                aria-hidden
              />
            </div>
            <div className="flex justify-between font-label text-[11px] uppercase tracking-[0.12em] text-ink-soft">
              <span>Yr 1</span>
              <span>Yr 13</span>
              <span>Yr 25</span>
            </div>
          </div>

          <div className="fx-dark flex flex-wrap items-center justify-between gap-3.5 rounded-[20px] px-[22px] py-5">
            <span className="max-w-[520px] text-[15px] leading-normal text-ink-glow">{content.ctaText}</span>
            <Button asChild variant="sun" size="xl">
              <a href={quoteHref}>
                {content.ctaLabel} <ArrowRight aria-hidden />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky results bar (tablet + phone). Sticks inside this wrapper so it never covers the footer. */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-8 grid grid-cols-[1fr_auto] items-center gap-2.5 border-t border-navy-900/10 bg-white/95 px-3.5 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_-12px_rgb(11_31_77/0.3)] backdrop-blur-md sm:-mx-6 lg:hidden">
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            {kwp} · payback {payback} yrs
          </span>
          <span className="font-display text-[22px] font-bold text-leaf-600">
            {formatPeso(r.monthlySavings)}
            <span className="text-[13px] font-normal text-ink-muted">/mo saved</span>
          </span>
        </span>
        <Button asChild variant="sun" size="xl" className="px-4">
          <a href={quoteHref}>Get quote</a>
        </Button>
      </div>
    </div>
  );
}
