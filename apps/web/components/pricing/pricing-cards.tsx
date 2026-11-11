import Link from "next/link";

import { Icon, TONE } from "@/components/icons";
import { EligibilityPanel, type PricedPackage } from "@/components/pricing/eligibility-panel";
import { Button } from "@/components/ui/button";
import type { PricingPage } from "@/lib/content/pages/pricing";
import type { AddOn, Package, PaymentOption } from "@/lib/content/types";
import { fill, slugify } from "@/lib/pricing";
import { formatPeso } from "@/lib/solar-calc";
import { cn } from "@/lib/utils";

const MONO = "font-label uppercase tracking-[0.12em]";
const CARD = "flex min-w-0 flex-col gap-4 rounded-[22px] p-6 glass-card sm:p-7";
const FEATURED = "border-sun-500! bg-[linear-gradient(170deg,var(--color-dawn-50),white_55%)]!";
type Heading = "h3" | "h4";

const kwpText = (kwp: number) => `${Number(kwp.toFixed(2))} kWp`;

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

export function PaymentCard({
  option,
  copy,
  packages,
}: {
  option: PaymentOption;
  copy: PricingPage["payments"];
  packages: PricedPackage[];
}) {
  return (
    <article className={cn(CARD, "fx-ring")}>
      <span className="glow-tile size-12 rounded-xl" style={{ ["--c" as string]: TONE[option.tone] }}>
        <Icon name={option.icon} />
      </span>
      <h3 className="m-0 font-display text-[22px] font-bold tracking-[-0.02em]">{option.title}</h3>
      {option.description ? <p className="m-0 leading-[1.55] text-ink-muted">{option.description}</p> : null}
      {option.highlight ? <span className={cn(MONO, "text-[12px] text-sun-700")}>{option.highlight}</span> : null}
      <EligibilityPanel option={option} copy={copy} packages={packages} />
    </article>
  );
}

/** Packages that have a price, for payment estimates (featured first in the picker's default). */
export const pricedPackages = (list: Package[]): PricedPackage[] =>
  list.flatMap((p) => (p.price === null ? [] : [{ slug: p.slug, name: p.name, price: p.price, featured: p.featured }]));
