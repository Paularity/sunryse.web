"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { useId, useState } from "react";

import { Icon, TONE } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { PricingPage } from "@/lib/content/pages/pricing";
import type { PaymentOption } from "@/lib/content/types";
import { financeEstimate, termChoices } from "@/lib/financing";
import { fill } from "@/lib/pricing";
import { formatPeso } from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

/** Packages with a price, for the estimate's package picker. */
export type PricedPackage = { slug: string; name: string; price: number; featured: boolean };

const MONO = "font-label uppercase tracking-[0.12em]";
const LABEL = cn(MONO, "text-[11px] text-ink-muted");

/** "Check eligibility": what you need, a monthly estimate for a chosen package, and a link to ask about the option. */
export function EligibilityPanel({
  option,
  copy,
  packages,
}: {
  option: PaymentOption;
  copy: PricingPage["payments"];
  packages: PricedPackage[];
}) {
  const uid = useId();
  const terms = termChoices(option.termMonths);
  const [slug, setSlug] = useState((packages.find((p) => p.featured) ?? packages[0])?.slug ?? "");
  const [months, setMonths] = useState(terms[terms.length - 1] ?? 0);
  const chosen = packages.find((p) => p.slug === slug);
  const cta = option.ctaLabel || copy.ctaLabel;
  const estimate =
    chosen && months
      ? financeEstimate({
          price: chosen.price,
          months,
          annualRatePct: option.annualRate,
          downPaymentPct: option.downPaymentPct,
        })
      : null;
  const contactHref = `/contact?payment=${option.kind}${chosen ? `&package=${encodeURIComponent(chosen.slug)}` : ""}`;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="line" size="xl" className="mt-auto w-full" aria-label={`${cta}: ${option.title}`}>
          {cta}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        data-lenis-prevent
        className="gap-0 overflow-y-auto bg-[linear-gradient(180deg,var(--color-day-100),var(--color-day-50)_35%)] p-0 text-base data-[side=right]:w-full data-[side=right]:sm:max-w-[440px]"
      >
        {/* 44 px close target (the stock one is 28 px) */}
        <SheetClose className="absolute top-3 right-3 grid size-11 place-items-center rounded-xl bg-white/80 text-navy-900 outline-none hover:bg-white focus-visible:ring-3 focus-visible:ring-ring/50">
          <X className="size-5" aria-hidden />
          <span className="sr-only">Close</span>
        </SheetClose>
        <div className="flex flex-col gap-5 px-6 pt-14 pb-8">
          <span className="glow-tile size-12 rounded-xl" style={{ ["--c" as string]: TONE[option.tone] }}>
            <Icon name={option.icon} />
          </span>
          <div className="flex flex-col gap-2">
            <SheetTitle className="font-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-navy-900">
              {option.title}
            </SheetTitle>
            {option.highlight ? <span className={cn(MONO, "text-[12px] text-sun-700")}>{option.highlight}</span> : null}
            <SheetDescription className="text-[15px] leading-[1.6] text-ink-muted">
              {option.description}
            </SheetDescription>
          </div>

          {option.requirements.length ? (
            <section className="flex flex-col gap-2.5 rounded-2xl p-5 glass-card">
              <h3 className={LABEL}>{copy.requirementsLabel}</h3>
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[15px]">
                {option.requirements.map((r) => (
                  <li key={r} className="flex gap-2.5">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-leaf-600" strokeWidth={2.5} />
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {packages.length ? (
            <section className="flex flex-col gap-4 rounded-2xl p-5 glass-card" aria-labelledby={`${uid}-est`}>
              <h3 id={`${uid}-est`} className="font-display text-[19px] font-bold text-navy-900">
                {copy.estimateHeading}
              </h3>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${uid}-pkg`} className={LABEL}>
                  {copy.packageLabel}
                </label>
                <select
                  id={`${uid}-pkg`}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="min-h-[52px] w-full rounded-xl border border-navy-900/[.18] bg-white px-3 text-[16px] text-navy-900 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {packages.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} · {formatPeso(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              {option.kind === "cash" && chosen ? (
                <p className="m-0 text-[15px] leading-[1.6]">
                  {fill(copy.cashNote, { amount: formatPeso(chosen.price) })}
                </p>
              ) : estimate ? (
                <>
                  {terms.length > 1 ? (
                    <div role="radiogroup" aria-label={copy.termLabel} className="flex flex-col gap-1.5">
                      <span className={LABEL} aria-hidden>
                        {copy.termLabel}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {terms.map((m) => (
                          <button
                            key={m}
                            type="button"
                            role="radio"
                            aria-checked={months === m}
                            onClick={() => setMonths(m)}
                            className={cn(
                              "min-h-11 rounded-xl border-2 px-3.5 text-sm font-semibold text-navy-900 outline-none focus-visible:ring-3 focus-visible:ring-sky-600/40",
                              months === m
                                ? "border-sun-500 bg-dawn-50"
                                : "border-navy-900/10 bg-white hover:border-navy-900/30",
                            )}
                          >
                            {fill(copy.monthsLabel, { n: m })}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div aria-live="polite" className="flex flex-col gap-1 border-t border-line pt-4">
                    <b className="font-display text-[30px] leading-tight font-bold tracking-[-0.03em] text-navy-900">
                      {fill(copy.monthlyLabel, { amount: formatPeso(estimate.monthly) })}
                    </b>
                    <span className="text-sm text-ink-muted">{fill(copy.monthsLabel, { n: months })}</span>
                    {estimate.downPayment > 0 ? (
                      <span className="text-sm">
                        {fill(copy.downPaymentLabel, { pct: option.downPaymentPct ?? 0 })}:{" "}
                        <b>{formatPeso(estimate.downPayment)}</b>
                      </span>
                    ) : null}
                    <span className="text-sm text-ink-muted">
                      {option.annualRate === null ? copy.noRateNote : fill(copy.rateNote, { rate: option.annualRate })}
                    </span>
                  </div>
                </>
              ) : (
                <p className="m-0 text-[15px] text-ink-muted">{copy.noTermNote}</p>
              )}
            </section>
          ) : null}

          {copy.disclaimer ? <p className="m-0 text-xs leading-[1.6] text-ink-muted">{copy.disclaimer}</p> : null}
          <Button asChild variant="sun" size="xl" className="w-full">
            <Link href={contactHref}>{copy.applyLabel}</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
