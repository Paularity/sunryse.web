"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { Hud, Meter } from "@/components/fx";
import { Button } from "@/components/ui/button";
import type { CalculatorConfig } from "@/lib/content/types";
import { calculateSolar, formatPeso } from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

const MAX_BILL = 1_000_000;
const fmtPreset = (n: number) => (n >= 1000 ? `₱${n / 1000}k` : `₱${n}`);

export function CalculatorConsole({ config, ctaLabel }: { config: CalculatorConfig; ctaLabel: string }) {
  const presets = config.presets.slice(0, 4);
  const [bill, setBill] = useState<number>(presets[2] ?? presets[0] ?? 10000);
  const inputId = useId();

  const r = useMemo(
    () => calculateSolar({ monthlyBill: Math.max(bill, 0), segment: "residential", systemType: "grid-tie" }, config),
    [bill, config],
  );

  const has = bill > 0;
  const tiles: { label: string; value: string; meter: number; tone: "sun" | "leaf" | "sky"; text: string }[] = [
    { label: "System size", value: has ? `${r.systemKwp} kWp` : "—", meter: Math.min(100, (r.systemKwp / 20) * 100), tone: "sky", text: "text-sky-600" },
    { label: "Panels", value: has ? `${r.panels}` : "—", meter: Math.min(100, (r.panels / 40) * 100), tone: "sun", text: "text-navy-900" },
    { label: "Monthly savings", value: has ? formatPeso(r.monthlySavings) : "—", meter: r.billReduction * 100, tone: "leaf", text: "text-leaf-600" },
    {
      label: "Payback",
      value: has ? (r.paybackYears === null ? "25+ yrs" : `${r.paybackYears.toFixed(1)} yrs`) : "—",
      meter: r.paybackYears === null ? 0 : Math.max(0, 100 - (r.paybackYears / 12) * 100),
      tone: "sun",
      text: "text-sun-700",
    },
  ];

  return (
    <div className="glass-card flex flex-col gap-[18px] rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <Hud>Live estimate</Hud>
        <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">Residential · Grid-tie</span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Monthly bill
        </label>
        <span className="flex min-h-14 items-center gap-2 rounded-[14px] border-2 border-navy-900 bg-white px-3.5 shadow-[0_0_0_4px_rgb(30_111_232/0.12)] focus-within:ring-2 focus-within:ring-sky-600 focus-within:ring-offset-2">
          <span aria-hidden className="font-display text-2xl font-bold text-ink-muted">₱</span>
          <input
            id={inputId}
            inputMode="numeric"
            autoComplete="off"
            aria-label="Monthly bill in pesos"
            value={bill ? bill.toLocaleString("en-PH") : ""}
            onChange={(e) => {
              const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
              setBill(Number.isFinite(n) ? Math.min(n, MAX_BILL) : 0);
            }}
            className="min-h-[52px] w-full border-0 bg-transparent font-display text-[26px] font-bold text-navy-900 outline-none"
          />
        </span>
      </div>

      <div className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex gap-1.5 overflow-x-auto font-label text-xs" role="group" aria-label="Quick bill amounts">
        {presets.map((p) => {
          const on = p === bill;
          return (
            <button
              key={p}
              type="button"
              aria-pressed={on}
              onClick={() => setBill(p)}
              className={cn(
                "min-h-11 flex-none rounded-full border px-4 text-navy-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
                on ? "border-sun-500 bg-sun-300/40" : "border-navy-900/15 bg-white hover:border-navy-900/40",
              )}
            >
              {fmtPreset(p)}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5" aria-live="polite">
        {tiles.map((t) => (
          <div key={t.label} className="flex min-w-0 flex-col gap-1.5 rounded-[14px] border border-navy-900/8 bg-white/75 p-3.5">
            <span className="font-label text-[11px] uppercase tracking-[0.12em] text-ink-muted">{t.label}</span>
            <span className={cn("font-display text-2xl font-bold leading-tight tracking-[-0.02em]", t.text)}>{t.value}</span>
            <Meter value={t.meter} tone={t.tone} />
          </div>
        ))}
      </div>

      <Button asChild variant="navy" size="xl" className="w-full">
        <Link href={`/calculator?bill=${bill || ""}`}>
          {ctaLabel} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
