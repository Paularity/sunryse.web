"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type Ref } from "react";

import { RoofArray } from "@/components/three-d/roof-array";
import type { CalculatorConfig, UiLabels } from "@/lib/content/types";
import type { CalculatorPageContent } from "@/lib/content/pages/calculator";
import {
  appliancesKwhPerMonth,
  backupHours,
  BATTERY_OPTIONS,
  estimate,
  formatPeso,
  planPackages,
  withDefaults,
  type EstimateInput,
  type PackageKey,
  type PlannedAppliance,
  type Region,
  type RoofType,
  type Segment,
  type SystemType,
  type UsagePeriod,
} from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

import { Proposal } from "./wizard/proposal";
import { AppliancesEditor, Choices, focusRing, mono, NavButtons, StepHead } from "./wizard/parts";

export type WizardCopy = CalculatorPageContent["wizard"];
export const fill = (s: string, v: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));

type Contact = { name: string; phone: string; email: string; city: string; leadId: string | null };
type StepId =
  | "contact"
  | "property"
  | "status"
  | "bill"
  | "appliances"
  | "usage"
  | "roof"
  | "location"
  | "packages"
  | "battery"
  | "proposal";

const STORE = "sunryse.calc.contact";
const PHONE = /^(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function loadContact(): Contact | null {
  try {
    const raw = window.localStorage.getItem(STORE);
    const c = raw ? (JSON.parse(raw) as Contact & { at?: number }) : null;
    // Remember the visitor for 30 days.
    return c && c.name && c.phone && (!c.at || Date.now() - c.at < 30 * 864e5) ? c : null;
  } catch {
    return null;
  }
}
function saveContact(c: Contact | null) {
  try {
    if (c) window.localStorage.setItem(STORE, JSON.stringify({ ...c, at: Date.now() }));
    else window.localStorage.removeItem(STORE);
  } catch {}
}

export type WizardProps = {
  config: CalculatorConfig;
  copy: WizardCopy;
  ui: UiLabels;
  messengerUrl?: string;
  initialBill?: number;
  initialSegment?: Segment;
  initialSystem?: SystemType;
};

export function CalculatorWizard({
  config,
  copy,
  ui,
  messengerUrl,
  initialBill,
  initialSegment,
  initialSystem,
}: WizardProps) {
  const c = useMemo(() => withDefaults(config), [config]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [step, setStep] = useState<StepId>("contact");
  const [segment, setSegment] = useState<Segment | undefined>(initialSegment);
  const [status, setStatus] = useState<"existing" | "construction" | undefined>();
  const [billMode, setBillMode] = useState<"peso" | "kwh">("peso");
  const [bill, setBill] = useState<number>(initialBill ?? 0);
  const [kwh, setKwh] = useState<number>(0);
  const [noBill, setNoBill] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [appliances, setAppliances] = useState<PlannedAppliance[]>([]);
  const [usage, setUsage] = useState<UsagePeriod[]>([]);
  const [roof, setRoof] = useState<RoofType | undefined>();
  const [region, setRegion] = useState<Region | undefined>();
  const [pkg, setPkg] = useState<PackageKey | null>(null);
  const [battery, setBattery] = useState<number>(initialSystem === "hybrid" ? 10 : 0);
  const head = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);

  // Returning visitors skip the contact step.
  useEffect(() => {
    const saved = loadContact();
    if (!saved) return;
    const id = requestAnimationFrame(() => {
      setContact(saved);
      setStep("property");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Move focus to the new question (not on first load).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    head.current?.focus();
    head.current?.closest("section")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);

  const noUsageBill = status === "construction" || noBill;
  const steps: StepId[] = [
    "contact",
    "property",
    "status",
    noUsageBill ? "appliances" : "bill",
    "usage",
    "roof",
    "location",
    "packages",
    ...(segment === "residential" ? (["battery"] as StepId[]) : []),
    "proposal",
  ];
  const index = Math.max(0, steps.indexOf(step));
  const go = (d: 1 | -1) => setStep(steps[Math.min(steps.length - 1, Math.max(0, index + d))]);

  /* ---------- numbers ---------- */
  const plannedKwh = appliancesKwhPerMonth(appliances);
  const base = useMemo<Omit<EstimateInput, "systemKwp"> | null>(
    () =>
      segment
        ? {
            segment,
            ...(noUsageBill
              ? { monthlyKwh: Math.max(60, plannedKwh + 60) } // lights & small loads + planned appliances
              : billMode === "kwh"
                ? { monthlyKwh: kwh, addedKwhPerMonth: plannedKwh }
                : { monthlyBill: bill, addedKwhPerMonth: plannedKwh }),
            usage,
            roof,
            region,
            batteryKwh: battery,
            systemType: battery > 0 ? "hybrid" : (initialSystem ?? "grid-tie"),
          }
        : null,
    [segment, noUsageBill, plannedKwh, billMode, kwh, bill, usage, roof, region, battery, initialSystem],
  );
  const packages = useMemo(() => (base ? planPackages(base, c) : []), [base, c]);
  const chosen = packages.find((p) => p.key === pkg) ?? packages.find((p) => p.recommended) ?? packages[0];
  const result = chosen?.estimate ?? null;
  const chosenKwp = chosen?.estimate.systemKwp;
  const batteryChoices = useMemo(
    () =>
      base && chosenKwp
        ? BATTERY_OPTIONS[base.segment].map((b) => ({
            kwh: b,
            e: estimate({ ...base, batteryKwh: b, systemType: b > 0 ? "hybrid" : "grid-tie", systemKwp: chosenKwp }, c),
          }))
        : [],
    [base, chosenKwp, c],
  );

  /* ---------- validation per step ---------- */
  const valid: Partial<Record<StepId, boolean>> = {
    property: !!segment,
    status: !!status,
    bill: noBill || (billMode === "peso" ? bill >= 500 : kwh >= 30),
    appliances: appliances.length > 0,
    usage: usage.length > 0,
    roof: !!roof,
    location: !!region,
    packages: !!chosen,
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid[step] === false) return;
    go(1);
  };
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const nav = (
    <NavButtons
      onBack={index > 1 ? () => go(-1) : undefined}
      onNext={() => {}}
      nextDisabled={valid[step] === false}
      backLabel={copy.back}
      nextLabel={copy.next}
    />
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <section
        aria-labelledby="calc-step"
        className="min-w-0 scroll-mt-[calc(var(--site-top)+16px)] rounded-[28px] p-5 glass-card sm:p-8"
      >
        {/* progress */}
        {step !== "contact" ? (
          <div className="mb-6 flex flex-col gap-2">
            <div className={cn(mono, "flex flex-wrap items-center justify-between gap-2 text-ink-muted")}>
              <span>{fill(copy.stepOf, { n: index, total: steps.length - 1 })}</span>
              {contact ? (
                <span className="tracking-normal normal-case">
                  {fill(copy.contact.returning, { name: contact.name.split(" ")[0] })} ·{" "}
                  <button
                    type="button"
                    className={cn("min-h-11 font-semibold text-sky-600 underline-offset-4 hover:underline", focusRing)}
                    onClick={() => {
                      saveContact(null);
                      setContact(null);
                      setStep("contact");
                    }}
                  >
                    {copy.contact.notYou}
                  </button>
                </span>
              ) : null}
            </div>
            <div
              className="h-2 rounded-full bg-day-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={steps.length - 1}
              aria-valuenow={index}
              aria-label={fill(copy.stepOf, { n: index, total: steps.length - 1 })}
            >
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-sun-300),var(--color-sun-500),var(--color-sun-600))] transition-[width] duration-500"
                style={{ width: `${(index / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {step === "contact" ? (
          <ContactStep
            copy={copy}
            prefill={{ segment, bill: bill || undefined }}
            headRef={head}
            onDone={(ct) => {
              setContact(ct);
              saveContact(ct);
              setStep("property");
            }}
          />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
            {step === "property" ? (
              <>
                <StepHead ref={head} title={copy.property.title} lead={copy.property.lead} />
                <Choices
                  cols={3}
                  label={copy.property.title}
                  options={copy.property.options}
                  value={segment ? [segment] : []}
                  onPick={(v) => setSegment(v as Segment)}
                />
              </>
            ) : null}

            {step === "status" ? (
              <>
                <StepHead ref={head} title={copy.status.title} lead={copy.status.lead} />
                <Choices
                  label={copy.status.title}
                  options={copy.status.options}
                  value={status ? [status] : []}
                  onPick={(v) => setStatus(v as "existing" | "construction")}
                />
              </>
            ) : null}

            {step === "bill" ? (
              <>
                <StepHead ref={head} title={copy.bill.title} lead={copy.bill.lead} />
                <label className="flex max-w-[420px] flex-col gap-2">
                  <span className={cn(mono, "text-ink-muted")}>
                    {billMode === "peso" ? copy.bill.peso : copy.bill.kwh}
                  </span>
                  <span className="flex min-h-16 items-center gap-2 rounded-2xl border-2 border-navy-900 bg-white px-4 focus-within:ring-2 focus-within:ring-sky-600 focus-within:ring-offset-2">
                    {billMode === "peso" ? (
                      <span aria-hidden className="font-display text-2xl font-bold text-ink-muted">
                        ₱
                      </span>
                    ) : null}
                    <input
                      inputMode="numeric"
                      autoComplete="off"
                      value={
                        (billMode === "peso" ? bill : kwh)
                          ? (billMode === "peso" ? bill : kwh).toLocaleString("en-PH")
                          : ""
                      }
                      onChange={(e) => {
                        const n = Math.min(10_000_000, Number(e.target.value.replace(/[^\d]/g, "")) || 0);
                        if (billMode === "peso") setBill(n);
                        else setKwh(n);
                      }}
                      className="min-h-14 w-full border-0 bg-transparent font-display text-3xl font-bold text-navy-900 outline-none"
                    />
                    <span className={cn(mono, "text-ink-muted")}>
                      {billMode === "peso" ? copy.bill.perMonth : "kWh"}
                    </span>
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {config.presets.slice(0, 4).map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={billMode === "peso" && bill === p}
                      onClick={() => (setBillMode("peso"), setBill(p))}
                      className={cn(
                        mono,
                        "min-h-11 rounded-full border px-4 text-xs text-navy-900",
                        focusRing,
                        billMode === "peso" && bill === p ? "border-sun-500 bg-dawn-50" : "border-navy-900/15 bg-white",
                      )}
                    >
                      {p >= 1000 ? `₱${p / 1000}k` : `₱${p}`}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  <LinkButton onClick={() => setBillMode(billMode === "peso" ? "kwh" : "peso")}>
                    {billMode === "peso" ? copy.bill.useKwh : copy.bill.usePeso}
                  </LinkButton>
                  <LinkButton
                    onClick={() => {
                      setNoBill(true);
                      setStep("appliances");
                    }}
                  >
                    {copy.bill.noBill}
                  </LinkButton>
                  <LinkButton onClick={() => setPlanning(!planning)} aria-expanded={planning}>
                    {copy.bill.addPlanned}
                  </LinkButton>
                </div>
                {planning ? (
                  <div className="rounded-2xl border border-navy-900/10 bg-day-50 p-4">
                    <AppliancesEditor
                      list={appliances}
                      onChange={setAppliances}
                      copy={copy.appliances}
                      rate={c.electricityRate}
                      template={fill}
                    />
                  </div>
                ) : null}
              </>
            ) : null}

            {step === "appliances" ? (
              <>
                <StepHead
                  ref={head}
                  title={noUsageBill ? copy.appliances.titleNoBill : copy.appliances.title}
                  lead={copy.appliances.lead}
                />
                <AppliancesEditor
                  list={appliances}
                  onChange={setAppliances}
                  copy={copy.appliances}
                  rate={c.electricityRate}
                  template={fill}
                />
                {noBill && status !== "construction" ? (
                  <LinkButton
                    onClick={() => {
                      setNoBill(false);
                      setStep("bill");
                    }}
                  >
                    ← {copy.bill.title}
                  </LinkButton>
                ) : null}
              </>
            ) : null}

            {step === "usage" ? (
              <>
                <StepHead ref={head} title={copy.usage.title} lead={copy.usage.lead} />
                <Choices
                  multi
                  cols={4}
                  label={copy.usage.title}
                  options={copy.usage.options}
                  value={usage}
                  onPick={(v) => setUsage(toggle(usage, v as UsagePeriod))}
                />
              </>
            ) : null}

            {step === "roof" ? (
              <>
                <StepHead ref={head} title={copy.roof.title} lead={copy.roof.lead} />
                <Choices
                  cols={4}
                  label={copy.roof.title}
                  options={copy.roof.options}
                  value={roof ? [roof] : []}
                  onPick={(v) => setRoof(v as RoofType)}
                />
              </>
            ) : null}

            {step === "location" ? (
              <>
                <StepHead ref={head} title={copy.location.title} lead={copy.location.lead} />
                <Choices
                  cols={4}
                  label={copy.location.title}
                  options={copy.location.options}
                  value={region ? [region] : []}
                  onPick={(v) => setRegion(v as Region)}
                />
              </>
            ) : null}

            {step === "packages" && result ? (
              <>
                <StepHead ref={head} title={copy.packages.title} lead={copy.packages.lead} />
                <div role="radiogroup" aria-label={copy.packages.title} className="grid gap-3 md:grid-cols-3">
                  {packages.map((p) => {
                    const on = chosen?.key === p.key;
                    const e = p.estimate;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setPkg(p.key)}
                        className={cn(
                          "relative flex flex-col gap-3 rounded-2xl border-2 p-4 pt-5 text-left transition-[border-color,box-shadow]",
                          focusRing,
                          on
                            ? "border-sun-500 bg-dawn-50 shadow-[0_14px_30px_-18px_rgb(255_138_0/0.9)]"
                            : "border-navy-900/10 bg-white hover:border-navy-900/30",
                        )}
                      >
                        {p.recommended ? (
                          <span
                            className={cn(
                              mono,
                              "absolute -top-3 left-4 rounded-full bg-navy-900 px-2.5 py-1 text-white",
                            )}
                          >
                            {copy.packages.recommended}
                          </span>
                        ) : null}
                        <span className="font-display text-lg font-bold">{copy.packages.names[p.key]}</span>
                        <span className="font-display text-[28px] leading-none font-bold tracking-[-0.03em] text-navy-900">
                          {formatPeso(e.price)}
                        </span>
                        <span className="text-sm text-ink-muted">
                          {e.systemKwp} kWp · {e.panels} × {c.panelWatt} W
                          <br />
                          {fill(copy.packages.covers, {
                            pct: Math.round(Math.min(1, e.solarShare + e.exportKwh / Math.max(e.monthlyKwh, 1)) * 100),
                          })}
                        </span>
                        <dl className="m-0 grid grid-cols-3 gap-2 border-t border-navy-900/10 pt-3">
                          {[
                            [copy.packages.savings, formatPeso(e.monthlySavings), "text-leaf-600"],
                            [copy.packages.newBill, formatPeso(e.newBill), "text-navy-900"],
                            [
                              copy.packages.payback,
                              e.paybackYears == null ? "—" : `${e.paybackYears.toFixed(1)} ${ui.years ?? "yrs"}`,
                              "text-sun-700",
                            ],
                          ].map(([k, v, cls]) => (
                            <div key={k} className="min-w-0">
                              <dt className={cn(mono, "text-ink-muted")}>{k}</dt>
                              <dd className={cn("m-0 font-display text-[15px] font-bold", cls)}>{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {step === "battery" && result ? (
              <>
                <StepHead ref={head} title={copy.battery.title} lead={copy.battery.lead} />
                <div
                  role="radiogroup"
                  aria-label={copy.battery.title}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                >
                  {batteryChoices.map(({ kwh: b, e }) => {
                    const on = battery === b;
                    const suggest = b === 10 && usage.some((u) => u === "evening" || u === "night");
                    return (
                      <button
                        key={b}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setBattery(b)}
                        className={cn(
                          "flex min-h-[132px] flex-col items-start gap-1.5 rounded-2xl border-2 p-4 text-left",
                          focusRing,
                          on
                            ? "border-leaf-500 bg-[color-mix(in_srgb,var(--color-leaf-500)_8%,white)]"
                            : "border-navy-900/10 bg-white hover:border-navy-900/30",
                        )}
                      >
                        <span className="font-display text-lg font-bold">{b ? `${b} kWh` : copy.battery.none}</span>
                        <span className="text-sm text-ink-muted">
                          {b ? fill(copy.battery.backup, { h: backupHours(b, e.monthlyKwh, c) }) : copy.battery.noneSub}
                        </span>
                        <span className="mt-auto font-display font-bold text-navy-900">
                          {b
                            ? fill(copy.battery.adds, { price: formatPeso(e.price - batteryChoices[0].e.price) })
                            : formatPeso(e.price)}
                        </span>
                        {suggest ? <span className={cn(mono, "text-leaf-600")}>{copy.battery.suggest}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {step === "proposal" && result && contact ? (
              <Proposal
                headRef={head}
                copy={copy}
                ui={ui}
                config={c}
                result={result}
                contact={contact}
                messengerUrl={messengerUrl}
                answers={{
                  segment: segment!,
                  status,
                  bill: noUsageBill ? undefined : billMode === "peso" ? bill : undefined,
                  kwh: billMode === "kwh" ? kwh : undefined,
                  appliances,
                  usage,
                  roof,
                  region,
                  package: chosen.key,
                }}
                onLeadId={(id) => {
                  const next = { ...contact, leadId: id };
                  setContact(next);
                  saveContact(next);
                }}
              />
            ) : null}

            {step !== "proposal" ? nav : <NavButtons onBack={() => go(-1)} backLabel={copy.edit} nextLabel="" />}
          </form>
        )}
      </section>

      {/* live preview of the roof (desktop) */}
      <aside
        className="hidden flex-col gap-3 lg:sticky lg:top-[calc(var(--site-top)+16px)] lg:flex"
        aria-hidden={!result}
      >
        {result && step !== "contact" ? (
          <>
            <RoofArray
              sun
              count={result.panels}
              label={`${result.systemKwp} kWp · ${result.panels} × ${c.panelWatt} W`}
              ariaLabel={fill(ui.roofPreviewAria ?? "{n}", { n: result.panels })}
              className="h-[260px] rounded-[22px] border border-navy-900/8 bg-[linear-gradient(180deg,#cfe6ff,#eef5ff_60%,#fff3dc)]"
              scale="[--d3-s:0.7]"
            />
            <dl className="m-0 grid grid-cols-2 gap-3 rounded-2xl p-4 glass-card">
              {[
                [copy.proposal.price, formatPeso(result.price), "text-navy-900"],
                [copy.proposal.savings, formatPeso(result.monthlySavings), "text-leaf-600"],
                [copy.proposal.newBill, formatPeso(result.newBill), "text-navy-900"],
                [
                  copy.proposal.payback,
                  result.paybackYears == null ? "—" : `${result.paybackYears.toFixed(1)} ${ui.years ?? "yrs"}`,
                  "text-sun-700",
                ],
              ].map(([k, v, cls]) => (
                <div key={k} className="min-w-0">
                  <dt className={cn(mono, "text-ink-muted")}>{k}</dt>
                  <dd className={cn("m-0 font-display text-xl font-bold tabular-nums", cls)}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className={cn(mono, "m-0 text-xs leading-relaxed tracking-normal text-ink-muted normal-case")}>
              {config.disclaimer}
            </p>
          </>
        ) : null}
      </aside>
    </div>
  );
}

function LinkButton({
  children,
  onClick,
  ...rest
}: {
  children: ReactNode;
  onClick: () => void;
  "aria-expanded"?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className={cn(
        "min-h-11 text-left text-sm font-semibold text-sky-600 underline-offset-4 hover:underline",
        focusRing,
      )}
    >
      {children}
    </button>
  );
}

/* ---------- step 0: contact details ---------- */

function ContactStep({
  copy,
  prefill,
  onDone,
  headRef,
}: {
  copy: WizardCopy;
  prefill: { segment?: Segment; bill?: number };
  onDone: (c: Contact) => void;
  headRef: Ref<HTMLHeadingElement>;
}) {
  const k = copy.contact;
  const [f, setF] = useState({ name: "", phone: "", email: "", city: "", consent: false });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof f, string>>>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const check = () => {
    const e: typeof errors = {};
    if (f.name.trim().length < 2) e.name = k.errName;
    if (!PHONE.test(f.phone.trim())) e.phone = k.errPhone;
    if (f.email.trim() && !EMAIL.test(f.email.trim())) e.email = k.errEmail;
    if (f.city.trim().length < 2) e.city = k.errCity;
    if (!f.consent) e.consent = k.errConsent;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!check()) return;
    setBusy(true);
    const contact = { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim(), city: f.city.trim() };
    let leadId: string | null = null;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          consent: true,
          source: "calculator",
          stage: "calculator-started",
          segment: prefill.segment,
          monthlyBill: prefill.bill,
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; id?: string | null } | null;
      if (json?.ok) leadId = json.id ?? null;
    } catch {}
    setBusy(false);
    // Saving failed: show the note once; the next press continues (the full lead is sent with the estimate).
    if (!leadId && !failed) {
      setFailed(true);
      return;
    }
    onDone({ ...contact, leadId });
  };

  const field = (
    name: "name" | "phone" | "email" | "city",
    label: string,
    type: string,
    auto: string,
    hint?: string,
  ) => (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className={cn(mono, "text-ink-muted")}>{label}</span>
      <input
        type={type}
        autoComplete={auto}
        inputMode={name === "phone" ? "tel" : undefined}
        placeholder={hint}
        value={f[name]}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `err-${name}` : undefined}
        onChange={(e) => setF({ ...f, [name]: e.target.value })}
        className={cn(
          "min-h-12 rounded-xl border bg-white px-4 text-base text-navy-900",
          focusRing,
          errors[name] ? "border-sun-600" : "border-navy-900/15",
        )}
      />
      {errors[name] ? (
        <span id={`err-${name}`} className="text-sm font-semibold text-sun-700">
          {errors[name]}
        </span>
      ) : null}
    </label>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <StepHead ref={headRef} eyebrow={k.eyebrow} title={k.title} lead={k.lead} />
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", k.name, "text", "name")}
        {field("phone", k.phone, "tel", "tel", k.phoneHint)}
        {field("email", k.email, "email", "email")}
        {field("city", k.city, "text", "address-level2")}
      </div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={f.consent}
          onChange={(e) => setF({ ...f, consent: e.target.checked })}
          aria-invalid={!!errors.consent}
          aria-describedby={errors.consent ? "err-consent" : undefined}
          className="mt-1 size-5 flex-none accent-sun-500"
        />
        <span className="text-sm leading-relaxed text-ink-muted">{k.consent}</span>
      </label>
      {errors.consent ? (
        <span id="err-consent" className="-mt-4 text-sm font-semibold text-sun-700">
          {errors.consent}
        </span>
      ) : null}
      {failed ? <p className="m-0 rounded-xl bg-dawn-50 px-4 py-3 text-sm text-sun-800">{k.error}</p> : null}
      <NavButtons onNext={() => {}} busy={busy} backLabel="" nextLabel={busy ? k.saving : k.submit} />
    </form>
  );
}
