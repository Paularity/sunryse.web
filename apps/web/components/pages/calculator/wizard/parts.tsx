"use client";

import { Check, Minus, Plus, X } from "lucide-react";
import { forwardRef, type ReactNode } from "react";

import {
  APPLIANCES,
  appliancesKwhPerMonth,
  formatPeso,
  type ApplianceKey,
  type PlannedAppliance,
} from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

export const mono = "font-label text-[11px] uppercase tracking-[0.12em]";
export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600";

/** Step title + lead; the title takes focus when the step changes (screen readers hear the new question). */
export const StepHead = forwardRef<HTMLHeadingElement, { title: string; lead?: string; eyebrow?: string }>(
  function StepHead({ title, lead, eyebrow }, ref) {
    return (
      <div className="flex flex-col gap-2">
        {eyebrow ? <span className={cn(mono, "text-sun-700")}>{eyebrow}</span> : null}
        <h2
          ref={ref}
          tabIndex={-1}
          className="m-0 font-display text-[clamp(24px,2.6vw,34px)] leading-[1.1] font-bold tracking-[-0.03em] text-navy-900 outline-none"
        >
          {title}
        </h2>
        {lead ? <p className="m-0 max-w-[620px] text-[16px] leading-[1.55] text-ink-muted">{lead}</p> : null}
      </div>
    );
  },
);

/** Big tappable answer cards (single or multi choice). */
export function Choices<T extends string>({
  options,
  value,
  onPick,
  multi,
  cols = 2,
  label,
  badge,
}: {
  options: { value: string; label: string; sub?: string }[];
  value: T[];
  onPick: (v: T) => void;
  multi?: boolean;
  cols?: 2 | 3 | 4;
  label: string;
  badge?: (v: T) => ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "grid gap-3",
        cols === 2 ? "sm:grid-cols-2" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4",
      )}
    >
      {options.map((o) => {
        const on = value.includes(o.value as T);
        return (
          <button
            key={o.value}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={on}
            onClick={() => onPick(o.value as T)}
            className={cn(
              "relative flex min-h-[88px] flex-col items-start justify-center gap-1 rounded-2xl border-2 p-4 pr-11 text-left transition-[border-color,background,box-shadow] duration-200",
              focusRing,
              on
                ? "border-sun-500 bg-dawn-50 shadow-[0_12px_28px_-18px_rgb(255_138_0/0.9)]"
                : "border-navy-900/10 bg-white hover:border-navy-900/30",
            )}
          >
            <span className="font-display text-lg font-bold text-navy-900">{o.label}</span>
            {o.sub ? <span className="text-sm text-ink-muted">{o.sub}</span> : null}
            {badge ? badge(o.value as T) : null}
            <span
              aria-hidden
              className={cn(
                "absolute top-4 right-4 grid size-6 place-items-center rounded-full border-2",
                on ? "border-sun-500 bg-sun-500 text-white" : "border-navy-900/20 bg-white",
                multi ? "rounded-md" : "rounded-full",
              )}
            >
              {on ? <Check className="size-3.5" strokeWidth={3} /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  backLabel,
  nextLabel,
  busy,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  backLabel: string;
  nextLabel: string;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy-900/10 pt-5">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className={cn(mono, "min-h-12 rounded-xl px-4 text-xs text-navy-900 hover:bg-day-100", focusRing)}
        >
          ← {backLabel}
        </button>
      ) : (
        <span />
      )}
      {onNext ? (
        <button
          type="submit"
          disabled={nextDisabled || busy}
          className={cn(
            mono,
            "inline-flex min-h-12 items-center gap-2 rounded-xl bg-navy-900 px-6 text-xs text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
            focusRing,
          )}
        >
          {nextLabel} →
        </button>
      ) : null}
    </div>
  );
}

type AppliancesCopy = {
  appliance: string;
  size: string;
  qty: string;
  hours: string;
  remove: string;
  total: string;
  names: Record<ApplianceKey, string>;
};

/** Planned-appliance table: pick appliances, then size, quantity and hours per day. */
export function AppliancesEditor({
  list,
  onChange,
  copy,
  rate,
  template,
}: {
  list: PlannedAppliance[];
  onChange: (l: PlannedAppliance[]) => void;
  copy: AppliancesCopy;
  rate: number;
  template: (s: string, v: Record<string, string | number>) => string;
}) {
  const keys = Object.keys(APPLIANCES) as ApplianceKey[];
  const kwh = appliancesKwhPerMonth(list);
  const set = (i: number, patch: Partial<PlannedAppliance>) =>
    onChange(list.map((a, k) => (k === i ? { ...a, ...patch } : a)));
  const step = (i: number, field: "qty" | "hours", d: number, max: number) =>
    set(i, { [field]: Math.min(max, Math.max(1, list[i][field] + d)) });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange([...list, { key: k, size: 0, qty: 1, hours: APPLIANCES[k].hours }])}
            className={cn(
              mono,
              "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-navy-900/15 bg-white px-4 text-xs text-navy-900 hover:border-navy-900/35",
              focusRing,
            )}
          >
            <Plus className="size-3.5" aria-hidden /> {copy.names[k]}
          </button>
        ))}
      </div>
      {list.length ? (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {list.map((a, i) => (
            <li
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-2xl border border-navy-900/10 bg-white p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto_auto]"
            >
              <span className="font-display font-bold text-navy-900">{copy.names[a.key]}</span>
              <button
                type="button"
                onClick={() => onChange(list.filter((_, k) => k !== i))}
                aria-label={`${copy.remove} ${copy.names[a.key]}`}
                className={cn(
                  "grid size-11 place-items-center justify-self-end rounded-xl text-ink-muted hover:bg-day-100 sm:order-last",
                  focusRing,
                )}
              >
                <X className="size-4" aria-hidden />
              </button>
              <label className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                <span className={cn(mono, "text-ink-muted")}>{copy.size}</span>
                <select
                  value={a.size}
                  onChange={(e) => set(i, { size: Number(e.target.value) })}
                  className={cn(
                    "min-h-11 rounded-xl border border-navy-900/15 bg-white px-3 text-base text-navy-900",
                    focusRing,
                  )}
                >
                  {APPLIANCES[a.key].sizes.map((s, k) => (
                    <option key={s.label} value={k}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              {(
                [
                  ["qty", copy.qty, 20],
                  ["hours", copy.hours, 24],
                ] as const
              ).map(([field, lbl, max]) => (
                <div key={field} className="flex flex-col gap-1">
                  <span className={cn(mono, "text-ink-muted")}>{lbl}</span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`${lbl} −`}
                      onClick={() => step(i, field, -1, max)}
                      className={cn(
                        "grid size-11 place-items-center rounded-xl border border-navy-900/15 bg-white",
                        focusRing,
                      )}
                    >
                      <Minus className="size-4" aria-hidden />
                    </button>
                    <span className="w-8 text-center font-display text-lg font-bold tabular-nums" aria-live="polite">
                      {a[field]}
                    </span>
                    <button
                      type="button"
                      aria-label={`${lbl} +`}
                      onClick={() => step(i, field, 1, max)}
                      className={cn(
                        "grid size-11 place-items-center rounded-xl border border-navy-900/15 bg-white",
                        focusRing,
                      )}
                    >
                      <Plus className="size-4" aria-hidden />
                    </button>
                  </span>
                </div>
              ))}
            </li>
          ))}
        </ul>
      ) : null}
      {list.length ? (
        <p className="m-0 rounded-xl bg-day-100 px-4 py-3 text-sm font-semibold text-navy-900">
          {template(copy.total, { kwh: Math.round(kwh), cost: formatPeso(kwh * rate) })}
        </p>
      ) : null}
    </div>
  );
}
