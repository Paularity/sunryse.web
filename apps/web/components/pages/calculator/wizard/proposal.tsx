"use client";

import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type Ref } from "react";

import { buttonVariants } from "@/components/ui/button";
import type { UiLabels } from "@/lib/content/types";
import { formatPeso, type CalcConfig, type Estimate } from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

import { fill, type WizardCopy } from "../calculator-wizard";
import { mono, StepHead } from "./parts";

type Answers = Record<string, unknown> & { segment: string; bill?: number; roof?: string; status?: string };

/** Final step: the all-in proposal. Attaches the answers and estimate to the visitor's lead once. */
export function Proposal({
  copy,
  ui,
  config,
  result,
  contact,
  answers,
  messengerUrl,
  headRef,
  onLeadId,
}: {
  copy: WizardCopy;
  ui: UiLabels;
  config: Required<CalcConfig>;
  result: Estimate;
  contact: { name: string; phone: string; email: string; city: string; leadId: string | null };
  answers: Answers;
  messengerUrl?: string;
  headRef: Ref<HTMLHeadingElement>;
  onLeadId: (id: string) => void;
}) {
  const p = copy.proposal;
  const years = ui.years ?? "yrs";
  const [saved, setSaved] = useState(false);
  const sentKey = useRef("");

  // Save the estimate to the lead (once per distinct estimate).
  useEffect(() => {
    const snapshot = {
      answers,
      systemKwp: result.systemKwp,
      panels: result.panels,
      batteryKwh: result.batteryKwh,
      systemType: result.systemType,
      price: result.price,
      priceLines: result.priceLines,
      monthlySavings: Math.round(result.monthlySavings),
      newBill: Math.round(result.newBill),
      paybackYears: result.paybackYears,
      lifetimeSavings: Math.round(result.lifetimeSavings),
      solarCostPerKwh: Number(result.solarCostPerKwh.toFixed(2)),
    };
    const key = JSON.stringify(snapshot);
    if (sentKey.current === key) return;
    sentKey.current = key;
    const fields = {
      segment: answers.segment,
      monthlyBill: answers.bill,
      roofType: answers.roof,
      propertyStatus: answers.status,
      stage: "estimate-ready",
      calcSnapshot: snapshot,
    };
    const send = contact.leadId
      ? fetch(`/api/leads/${contact.leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        })
      : fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            city: contact.city,
            consent: true,
            source: "calculator",
            ...fields,
          }),
        });
    send
      .then((r) => r.json())
      .then((j: { ok?: boolean; id?: string | null }) => {
        if (j?.ok) {
          setSaved(true);
          if (!contact.leadId && j.id) onLeadId(j.id);
        }
      })
      .catch(() => {});
  }, [answers, result, contact, onLeadId]);

  const query = `bill=${answers.bill ?? ""}&segment=${answers.segment}&type=${result.systemType}`;
  const max = Math.max(...result.cumulative.map(Math.abs), 1);
  const stats: [string, string, string][] = [
    [p.savings, formatPeso(result.monthlySavings), "text-leaf-600"],
    [p.newBill, formatPeso(result.newBill), "text-navy-900"],
    [p.payback, result.paybackYears == null ? "—" : `${result.paybackYears.toFixed(1)} ${years}`, "text-sun-700"],
    [fill(p.lifetime, { years: result.years }), formatPeso(result.lifetimeSavings), "text-navy-900"],
  ];
  const energy: [string, number, string][] = [
    [p.selfUse, result.selfUseKwh - result.batteryKwhUsed, "bg-sun-500"],
    [p.fromBattery, result.batteryKwhUsed, "bg-leaf-500"],
    [p.exported, result.exportKwh, "bg-sky-500"],
    [p.fromGrid, result.importKwh, "bg-navy-900/25"],
  ];
  const energyTotal = energy.reduce((a, [, v]) => a + v, 0) || 1;

  return (
    <div className="flex flex-col gap-7">
      <StepHead ref={headRef} eyebrow={p.eyebrow} title={p.title} />

      {/* price + headline numbers */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="flex flex-col justify-between gap-3 rounded-3xl bg-navy-900 p-6 text-white">
          <span className={cn(mono, "text-ink-glow")}>{p.price}</span>
          <span className="font-display text-[clamp(36px,4.4vw,52px)] leading-none font-bold tracking-[-0.04em]">
            {formatPeso(result.price)}
          </span>
          <span className={cn(mono, "text-ink-glow")}>{p.priceNote}</span>
          <span className="mt-2 border-t border-white/15 pt-3 text-sm text-ink-light">
            {p.solarCost}:{" "}
            <b className="text-sun-300">
              ₱{result.solarCostPerKwh.toFixed(2)}
              {p.perKwh}
            </b>
            <br />
            {fill(p.cheaper, {
              pct: Math.round(result.cheaperThanGrid * 100),
              grid: `₱${config.electricityRate.toFixed(2)}`,
            })}
          </span>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-3">
          {stats.map(([k, v, cls]) => (
            <div key={k} className="min-w-0 rounded-2xl p-4 glass-card">
              <dt className={cn(mono, "text-ink-muted")}>{k}</dt>
              <dd
                className={cn(
                  "m-0 mt-1 font-display text-[clamp(22px,2.4vw,30px)] font-bold tracking-[-0.02em] tabular-nums",
                  cls,
                )}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {result.surplusCredit > 1 ? (
        <p className="m-0 -mt-3 text-sm text-ink-muted">
          {fill(p.surplus, { amount: formatPeso(result.surplusCredit) })}
        </p>
      ) : null}
      {!result.netMetering ? (
        <p className="m-0 -mt-3 text-sm text-ink-muted">{fill(p.noNetMetering, { cap: config.netMeteringCapKw })}</p>
      ) : null}

      {/* system */}
      <dl className="m-0 grid gap-3 sm:grid-cols-3">
        {[
          [p.system, `${result.systemKwp} kWp`, fill(p.panels, { n: result.panels, w: config.panelWatt })],
          [p.inverter, result.systemType === "hybrid" ? p.hybrid : p.gridTie, ""],
          [p.battery, result.batteryKwh ? `${result.batteryKwh} kWh` : p.noBattery, ""],
        ].map(([k, v, sub]) => (
          <div key={k} className="rounded-2xl border border-navy-900/10 bg-white p-4">
            <dt className={cn(mono, "text-ink-muted")}>{k}</dt>
            <dd className="m-0 mt-1 font-display text-lg font-bold">{v}</dd>
            {sub ? <dd className="m-0 text-sm text-ink-muted">{sub}</dd> : null}
          </div>
        ))}
      </dl>

      {/* typical month */}
      <div className="flex flex-col gap-3">
        <span className={cn(mono, "text-ink-muted")}>{p.energy}</span>
        <div className="flex h-4 overflow-hidden rounded-full" aria-hidden>
          {energy.map(([k, v, cls]) =>
            v > 0.5 ? <span key={k} className={cls} style={{ width: `${(v / energyTotal) * 100}%` }} /> : null,
          )}
        </div>
        <ul className="m-0 grid list-none gap-2 p-0 text-sm sm:grid-cols-4">
          {energy.map(([k, v, cls]) => (
            <li key={k} className="flex items-center gap-2">
              <span aria-hidden className={cn("size-3 flex-none rounded-full", cls)} />
              <span>
                {k}: <b className="tabular-nums">{Math.round(v)} kWh</b>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* price breakdown */}
      <details className="group rounded-2xl border border-navy-900/10 bg-white p-4 open:pb-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-display font-bold">
          {p.breakdown} <span className="text-sun-700 transition-transform group-open:rotate-45">+</span>
        </summary>
        <dl className="m-0 mt-2">
          {result.priceLines
            .filter((l) => l.amount > 0)
            .map((l) => (
              <div key={l.key} className="flex justify-between gap-3 border-t border-navy-900/8 py-2.5 text-sm">
                <dt>{p.lines[l.key]}</dt>
                <dd className="m-0 font-semibold tabular-nums">{formatPeso(l.amount)}</dd>
              </div>
            ))}
          <div className="flex justify-between gap-3 border-t-2 border-navy-900/15 py-2.5 font-display font-bold">
            <dt>{p.price}</dt>
            <dd className="m-0 tabular-nums">{formatPeso(result.price)}</dd>
          </div>
        </dl>
      </details>

      {/* cumulative chart */}
      <div className="fx-screen flex flex-col gap-3 rounded-2xl p-5">
        <span className={cn(mono, "text-ink-glow")}>{p.chart}</span>
        <div
          className="relative flex h-40 items-center gap-[3px]"
          role="img"
          aria-label={`${p.chart}: ${p.payback} ${result.paybackYears?.toFixed(1) ?? "—"} ${years}`}
        >
          <span aria-hidden className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/30" />
          {result.cumulative.map((v, i) => (
            <span key={i} className="flex h-full flex-1 flex-col justify-center">
              <span
                className={cn(
                  "block w-full rounded-[3px]",
                  v >= 0 ? "self-end bg-glow-leaf shadow-[0_0_10px_-2px_var(--color-glow-leaf)]" : "bg-glow-flame/80",
                )}
                style={{
                  height: `${(Math.abs(v) / max) * 50}%`,
                  marginTop: v >= 0 ? "auto" : "50%",
                  marginBottom: v >= 0 ? "50%" : 0,
                }}
              />
            </span>
          ))}
        </div>
        <div className={cn(mono, "flex justify-between text-ink-soft")}>
          <span>{ui.yr1 ?? "Yr 1"}</span>
          <span>{`Yr ${result.years}`}</span>
        </div>
      </div>

      {/* next steps */}
      <div className="flex flex-col gap-3 rounded-2xl bg-dawn-50 p-5">
        {saved ? (
          <p className="m-0 text-sm font-semibold text-leaf-600">{fill(p.sent, { phone: contact.phone })}</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Link href={`/contact?${query}`} className={cn(buttonVariants({ variant: "sun", size: "xl" }))}>
            {p.book} <ArrowRight className="size-4" aria-hidden />
          </Link>
          {messengerUrl ? (
            <a
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "line", size: "xl" }))}
            >
              <MessageCircle className="size-4" aria-hidden /> {p.advisor}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
