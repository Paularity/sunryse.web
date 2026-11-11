"use client";

import { ArrowRight, Check, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type Ref } from "react";

import { Icon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import type { Package, PaymentOption, UiLabels } from "@/lib/content/types";
import { financeEstimate } from "@/lib/financing";
import { closestPackage } from "@/lib/pricing";
import { formatPeso, type CalcConfig, type Estimate } from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

import { fill, type WizardCopy } from "../calculator-wizard";
import { mono, StepHead } from "./parts";

type Answers = Record<string, unknown> & { segment: string; bill?: number; roof?: string; status?: string };

/** Standard packages (for "closest package") and payment options (for monthly payments) from /pricing. */
export type ProposalPricing = {
  packages: Pick<Package, "slug" | "name" | "systemType" | "segment" | "kwp" | "price" | "batteryKwh">[];
  payments: PaymentOption[];
};

/** Monthly payment for an option at its longest term; null for cash or when the term is not set yet. */
function monthlyFor(option: PaymentOption, price: number) {
  if (option.kind === "cash" || !option.termMonths) return null;
  return financeEstimate({
    price,
    months: option.termMonths,
    annualRatePct: option.annualRate,
    downPaymentPct: option.downPaymentPct,
  }).monthly;
}

/** Final step: the all-in proposal. Attaches the answers and estimate to the visitor's lead once. */
export function Proposal({
  copy,
  ui,
  config,
  result,
  contact,
  answers,
  messengerUrl,
  pricing,
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
  pricing?: ProposalPricing;
  headRef: Ref<HTMLHeadingElement>;
  onLeadId: (id: string) => void;
}) {
  const p = copy.proposal;
  const years = ui.years ?? "yrs";
  const [saved, setSaved] = useState(false);
  const [payKind, setPayKind] = useState("");
  const sentKey = useRef("");
  const payments = pricing?.payments ?? [];
  const chosenPayment = payments.find((o) => o.kind === payKind);
  const closest = closestPackage(pricing?.packages ?? [], {
    systemType: result.systemType,
    kwp: result.systemKwp,
    batteryKwh: result.batteryKwh,
    segment: answers.segment as Package["segment"],
  });

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
      closestPackage: closest?.name,
      preferredPayment: chosenPayment?.kind,
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
      ...(chosenPayment ? { preferredPayment: chosenPayment.title } : {}),
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
  }, [answers, result, contact, onLeadId, closest, chosenPayment]);

  const query = [
    `bill=${answers.bill ?? ""}`,
    `segment=${answers.segment}`,
    `type=${result.systemType}`,
    ...(closest ? [`package=${encodeURIComponent(closest.slug)}`] : []),
    ...(chosenPayment ? [`payment=${chosenPayment.kind}`] : []),
  ].join("&");
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

      {/* closest standard package */}
      {closest ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy-900/10 bg-white p-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className={cn(mono, "text-ink-muted")}>{p.closestHeading}</span>
            <b className="font-display text-lg">{closest.name}</b>
            {closest.price !== null ? (
              <span className="text-sm text-ink-muted">
                {fill(p.closestStarts, { price: formatPeso(closest.price) })}
              </span>
            ) : null}
          </div>
          <Link href="/pricing" className={cn(buttonVariants({ variant: "line", size: "xl" }))}>
            {p.closestLink} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : null}

      {/* how you could pay */}
      {payments.length ? (
        <section className="flex flex-col gap-3" aria-labelledby="pay-options-h">
          <div className="flex flex-col gap-1">
            <h3 id="pay-options-h" className="m-0 font-display text-xl font-bold">
              {p.payHeading}
            </h3>
            <p className="m-0 text-sm text-ink-muted">{p.payLead}</p>
            <p className="m-0 text-sm font-semibold text-leaf-600">
              {fill(p.paySaves, { amount: formatPeso(result.monthlySavings) })}
            </p>
          </div>
          <div role="radiogroup" aria-labelledby="pay-options-h" className="flex flex-col gap-2.5">
            {payments.map((o) => {
              const monthly = monthlyFor(o, result.price);
              const on = o.kind === payKind;
              return (
                <button
                  key={o.kind}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPayKind(on ? "" : o.kind)}
                  className={cn(
                    "flex min-h-11 min-w-0 flex-col gap-1 rounded-2xl border-2 px-4 py-3.5 text-left text-navy-900 outline-none focus-visible:ring-3 focus-visible:ring-sky-600/40",
                    on ? "border-sun-500 bg-dawn-50" : "border-navy-900/10 bg-white hover:border-navy-900/30",
                  )}
                >
                  {/* line 1: option + amount; line 2: term + how it compares with the savings (each wraps on phones) */}
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                    <span className="flex items-center gap-2 font-display font-bold">
                      <Icon name={o.icon} className="size-[18px] text-sky-600" /> {o.title}
                    </span>
                    <span className="font-display text-[clamp(18px,1.8vw,22px)] font-bold tracking-[-0.02em] whitespace-nowrap tabular-nums">
                      {o.kind === "cash"
                        ? fill(p.payCash, { amount: formatPeso(result.price) })
                        : monthly !== null
                          ? fill(p.payMonthly, { amount: formatPeso(monthly) })
                          : p.payTerms}
                    </span>
                  </span>
                  {monthly !== null ? (
                    <span className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 text-sm">
                      <span className="text-ink-muted">
                        {fill(p.payOver, { n: o.termMonths ?? 0 })}
                        {o.annualRate !== null ? ` · ${o.annualRate}%` : ""}
                      </span>
                      {monthly <= result.monthlySavings ? (
                        <span className="flex items-center gap-1 font-semibold text-leaf-600">
                          <Check className="size-4" aria-hidden /> {p.payCovered}
                        </span>
                      ) : (
                        <span className="font-semibold text-sun-700">
                          {fill(p.payGap, { amount: formatPeso(monthly - result.monthlySavings) })}
                        </span>
                      )}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="m-0 text-xs text-ink-muted">{p.payNote}</p>
        </section>
      ) : null}

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
