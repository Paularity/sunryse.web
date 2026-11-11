import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Section, SectionHeader } from "@/components/fx";
import { PackageCard, PaymentCard } from "@/components/pricing/pricing-cards";
import { Button } from "@/components/ui/button";
import type { PricingPage } from "@/lib/content/pages/pricing";
import type { Package, PaymentOption } from "@/lib/content/types";
import { pickPackages, unnumbered } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** Grid that fills the row: 1 column on phones, up to 3 on desktop, never a lone card on a wide row. */
export const CARD_GRID =
  "grid gap-4 [perspective:1400px] sm:grid-cols-2 lg:grid-cols-3 sm:max-lg:[&>*:last-child:nth-child(odd)]:col-span-2";

/** Homepage teaser: the featured package and its neighbours, with a link to /pricing. */
export function PackagesTeaser({
  copy,
  packages,
  heading,
  lead,
}: {
  copy: PricingPage["packages"];
  packages: Package[];
  heading?: string;
  lead?: string;
}) {
  const shown = pickPackages(packages, 3);
  if (!shown.length) return null;
  return (
    <Section tone="light" labelledBy="pkg-h">
      <SectionHeader
        id="pkg-h"
        eyebrow={unnumbered(copy.eyebrow)}
        heading={heading ?? copy.heading}
        lead={lead ?? copy.lead}
        aside={
          <Button asChild variant="line" size="xl">
            <Link href="/pricing">
              {copy.seeAllLabel} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />
      <div className={CARD_GRID}>
        {shown.map((p) => (
          <PackageCard key={p.slug} pkg={p} copy={copy} />
        ))}
      </div>
      {copy.note ? <p className="mt-6 max-w-[760px] text-sm leading-[1.6] text-ink-muted">{copy.note}</p> : null}
    </Section>
  );
}

/** Payment options; on /pricing it keeps its section number, on the homepage it drops it. */
export function PaymentsSection({
  copy,
  options,
  id,
  numbered = false,
  className,
}: {
  copy: PricingPage["payments"];
  options: PaymentOption[];
  id?: string;
  numbered?: boolean;
  className?: string;
}) {
  if (!options.length) return null;
  return (
    <Section id={id} tone="tint" labelledBy="pay-h" className={cn("scroll-mt-[calc(var(--site-top)+16px)]", className)}>
      <SectionHeader
        id="pay-h"
        eyebrow={numbered ? copy.eyebrow : unnumbered(copy.eyebrow)}
        heading={copy.heading}
        lead={copy.lead}
      />
      <div className={CARD_GRID}>
        {options.map((o) => (
          <PaymentCard key={o.title} option={o} copy={copy} />
        ))}
      </div>
      <div className="mt-6 flex max-w-[760px] flex-col gap-2 text-sm leading-[1.6] text-ink-muted">
        {copy.tip ? <p className="m-0">{copy.tip}</p> : null}
        {copy.disclaimer ? <p className="m-0 text-xs">{copy.disclaimer}</p> : null}
      </div>
    </Section>
  );
}
