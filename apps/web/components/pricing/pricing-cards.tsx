import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Icon, TONE } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { PricingPage } from "@/lib/content/pages/pricing";
import type { AddOn, Package, PaymentOption } from "@/lib/content/types";
import { fill } from "@/lib/pricing";
import { formatPeso } from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

const MONO = "font-label uppercase tracking-[0.12em]";
const CARD = "flex min-w-0 flex-col gap-4 rounded-[22px] p-6 glass-card sm:p-7";
const FEATURED = "border-sun-500! bg-[linear-gradient(170deg,var(--color-dawn-50),white_55%)]!";
type Heading = "h3" | "h4";

const kwpText = (kwp: number) => `${Number(kwp.toFixed(2))} kWp`;
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Price block: "Starts at ₱817,000", or "Ask for price" when the CMS leaves it empty. */
function Price({ label, price, ask, unit }: { label: string; price: number | null; ask: string; unit?: string }) {
  if (price === null) return <b className="font-display text-[22px] font-bold text-navy-900">{ask}</b>;
  return (
    <span className="flex min-w-0 flex-col">
      {label ? <span className={cn(MONO, "text-[11px] text-ink-muted")}>{label}</span> : null}
      <b className="font-display text-[clamp(26px,2.4vw,32px)] leading-tight font-bold tracking-[-0.03em] text-navy-900">
        {formatPeso(price)}
        {unit ? (
          <span className="ml-1.5 font-body text-sm font-medium tracking-normal text-ink-muted">{unit}</span>
        ) : null}
      </b>
    </span>
  );
}

export function PackageCard({
  pkg,
  copy,
  as: H = "h3",
}: {
  pkg: Package;
  copy: PricingPage["packages"];
  as?: Heading;
}) {
  const spec = [
    fill(copy.panelsLabel, { count: pkg.panelCount, watt: pkg.panelWatt }),
    kwpText(pkg.kwp),
    ...(pkg.batteryKwh ? [fill(copy.batteryLabel, { kwh: pkg.batteryKwh })] : []),
  ];
  return (
    <article className={cn(CARD, "fx-ring", pkg.featured && FEATURED)}>
      {pkg.badge ? (
        <span className={cn(MONO, "self-start rounded-full bg-sun px-3 py-1.5 text-[11px] text-navy-900")}>
          {pkg.badge}
        </span>
      ) : null}
      <H className="m-0 font-display text-[22px] leading-tight font-bold tracking-[-0.02em]">{pkg.name}</H>
      <div className="flex flex-col gap-1">
        <p className={"m-0 font-label text-[12.5px] leading-[1.6] tracking-[0.02em] text-ink-muted"}>
          {spec.join(" · ")}
        </p>
        {pkg.batterySpec ? <p className="m-0 text-sm text-ink-muted">{pkg.batterySpec}</p> : null}
        {pkg.expandableTo ? (
          <p className="m-0 text-sm text-sky-600">{fill(copy.expandableLabel, { n: pkg.expandableTo })}</p>
        ) : null}
      </div>
      {pkg.bestFor ? <p className="m-0 leading-[1.55]">{pkg.bestFor}</p> : null}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5">
        <Price label={copy.priceLabel} price={pkg.price} ask={copy.askPriceLabel} />
        <Button asChild variant={pkg.featured ? "sun" : "line"} size="xl">
          <Link href={`/contact?package=${encodeURIComponent(pkg.slug)}`} aria-label={`${copy.ctaLabel}: ${pkg.name}`}>
            {copy.ctaLabel}
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function AddOnCard({ item, copy, ask }: { item: AddOn; copy: PricingPage["addOns"]; ask: string }) {
  return (
    <article className={CARD}>
      <h3 className="m-0 font-display text-[20px] font-bold tracking-[-0.02em]">{item.name}</h3>
      {item.spec ? (
        <p className={"m-0 font-label text-[12.5px] leading-[1.6] tracking-[0.02em] text-ink-muted"}>{item.spec}</p>
      ) : null}
      {item.description ? <p className="m-0 leading-[1.55]">{item.description}</p> : null}
      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5">
        <Price label={item.priceFrom ? copy.fromLabel : ""} price={item.price} ask={ask} unit={item.unit} />
        <Button asChild variant="line" size="xl">
          <Link href={`/contact?addons=${slugify(item.name)}`} aria-label={`${copy.ctaLabel}: ${item.name}`}>
            {copy.ctaLabel}
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function PaymentCard({ option, copy }: { option: PaymentOption; copy: PricingPage["payments"] }) {
  return (
    <article className={cn(CARD, "fx-ring")}>
      <span className="glow-tile size-12 rounded-xl" style={{ ["--c" as string]: TONE[option.tone] }}>
        <Icon name={option.icon} />
      </span>
      <h3 className="m-0 font-display text-[22px] font-bold tracking-[-0.02em]">{option.title}</h3>
      {option.description ? <p className="m-0 leading-[1.55] text-ink-muted">{option.description}</p> : null}
      {option.highlight ? <span className={cn(MONO, "text-[12px] text-sun-700")}>{option.highlight}</span> : null}
      {option.requirements.length ? (
        <details className="group border-t border-line pt-4">
          <summary
            className={cn(
              MONO,
              "flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-[11px] text-navy-900 [&::-webkit-details-marker]:hidden",
            )}
          >
            {copy.requirementsLabel}
            <ArrowRight aria-hidden className="size-4 transition-transform group-open:rotate-90" />
          </summary>
          <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0 text-sm">
            {option.requirements.map((r) => (
              <li key={r} className="flex gap-2">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-leaf-600" />
                {r}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <Button asChild variant="line" size="xl" className="mt-auto w-full">
        <Link
          href={`/contact?payment=${option.kind}`}
          aria-label={`${option.ctaLabel || copy.ctaLabel}: ${option.title}`}
        >
          {option.ctaLabel || copy.ctaLabel}
        </Link>
      </Button>
    </article>
  );
}
