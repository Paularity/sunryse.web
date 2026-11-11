import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { RichText, Section, SectionHeader } from "@/components/fx";
import { AddOnCard, PackageCard } from "@/components/pricing/pricing-cards";
import { CARD_GRID, PaymentsSection } from "@/components/pricing/pricing-sections";
import { getAddOns, getPackages, getPaymentOptions, getSite } from "@/lib/content";
import { getPricingPage } from "@/lib/content/pages/pricing";
import type { PackageSystemType } from "@/lib/content/types";
import { t } from "@/lib/content/ui";
import { groupPackages } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const MONO = "font-label uppercase tracking-[0.12em]";
const CHIP = cn(
  MONO,
  "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[11px] text-navy-900 glass hover:text-sun-700",
);
const ANCHOR = "scroll-mt-[calc(var(--site-top)+16px)]";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getPricingPage();
  return { title: meta.title, description: meta.description, alternates: { canonical: "/pricing" } };
}

export default async function PricingPage() {
  const [page, packages, addOns, options, { ui }] = await Promise.all([
    getPricingPage(),
    getPackages(),
    getAddOns(),
    getPaymentOptions(),
    getSite(),
  ]);
  const { hero, packages: copy, addOns: addOnCopy, payments, cta } = page;
  const groups = groupPackages(packages);
  const groupLabel: Record<PackageSystemType, string> = {
    hybrid: copy.hybridLabel,
    "grid-tie": copy.gridTieLabel,
    "off-grid": copy.offGridLabel,
  };

  return (
    <div className="[line-height:normal]">
      {/* HERO: the layout's fixed header stack (--site-top) sits above it */}
      <section
        className="relative isolate bg-[linear-gradient(180deg,var(--color-day-100),var(--color-day-50))] pb-12"
        style={{ paddingTop: "calc(var(--site-top) + 8px)" }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full fx-grid [mask-image:radial-gradient(90%_75%_at_50%_20%,black,transparent_80%)] opacity-60"
          aria-hidden
        />
        <div className="container-site flex flex-col gap-5">
          <nav aria-label={t(ui, "breadcrumb")} className={cn(MONO, "text-[11px] text-ink-muted")}>
            <Link href="/" className="hover:text-sun-700">
              {t(ui, "home")}
            </Link>{" "}
            /{" "}
            <span aria-current="page" className="text-sun-700">
              {hero.eyebrow}
            </span>
          </nav>
          <h1 className="m-0 max-w-[900px] font-display text-[clamp(40px,5.6vw,80px)] leading-[0.98] font-bold tracking-[-0.045em]">
            <RichText text={hero.heading} />
          </h1>
          {hero.lead ? <p className="m-0 max-w-[620px] text-[18px] leading-[1.6] text-ink-muted">{hero.lead}</p> : null}
          <nav aria-label={hero.eyebrow} className="flex flex-wrap gap-2.5 pt-2">
            {groups.map((g) => (
              <a key={g.type} href={`#${g.type}`} className={CHIP}>
                {groupLabel[g.type]} <span className="text-ink-muted">{g.items.length}</span>
              </a>
            ))}
            {addOns.length ? (
              <a href="#add-ons" className={CHIP}>
                {addOnCopy.heading}
              </a>
            ) : null}
            {options.length ? (
              <a href="#payments" className={CHIP}>
                {payments.heading}
              </a>
            ) : null}
          </nav>
        </div>
      </section>

      {/* PACKAGES, grouped by system type */}
      {groups.length ? (
        <Section tone="light" labelledBy="pkg-h" className="pt-12!">
          <SectionHeader id="pkg-h" eyebrow={copy.eyebrow} heading={copy.heading} lead={copy.lead} />
          {copy.includes.length ? (
            <ul className="m-0 -mt-3 mb-10 flex list-none flex-wrap gap-x-5 gap-y-2.5 p-0">
              {copy.includes.map((i) => (
                <li key={i} className="flex items-center gap-2 text-[15px]">
                  <Check aria-hidden className="size-4 text-leaf-600" strokeWidth={2.5} />
                  {i}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-col gap-14">
            {groups.map((g) => (
              <div key={g.type} id={g.type} className={ANCHOR}>
                <h3 className="m-0 mb-5 font-display text-[26px] font-bold tracking-[-0.03em]">
                  {groupLabel[g.type]} <span className="text-ink-muted">({g.items.length})</span>
                </h3>
                <div className={CARD_GRID}>
                  {g.items.map((p) => (
                    <PackageCard key={p.slug} pkg={p} copy={copy} as="h4" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {copy.note ? <p className="mt-8 max-w-[760px] text-sm leading-[1.6] text-ink-muted">{copy.note}</p> : null}
        </Section>
      ) : null}

      {/* ADD-ONS */}
      {addOns.length ? (
        <Section id="add-ons" tone="white" labelledBy="addons-h" className={ANCHOR}>
          <SectionHeader id="addons-h" eyebrow={addOnCopy.eyebrow} heading={addOnCopy.heading} lead={addOnCopy.lead} />
          <div className={CARD_GRID}>
            {addOns.map((a) => (
              <AddOnCard key={a.name} item={a} copy={addOnCopy} ask={copy.askPriceLabel} />
            ))}
          </div>
        </Section>
      ) : null}

      {/* WAYS TO PAY */}
      <PaymentsSection id="payments" copy={payments} options={options} packages={packages} numbered />

      {/* CTA band */}
      <section className="bg-[linear-gradient(120deg,var(--color-sun-300),var(--color-sun-500)_45%,var(--color-sun-600))]">
        <div className="container-site flex flex-wrap items-center justify-between gap-6 py-[60px]">
          <h2 className="m-0 max-w-[640px] font-display text-[clamp(30px,4vw,52px)] leading-none font-extrabold tracking-[-0.045em]">
            <RichText text={cta.heading} />
          </h2>
          <Link
            href={cta.href}
            className={cn(
              MONO,
              "inline-flex min-h-11 items-center rounded-[14px] bg-navy-900 px-[26px] py-[19px] text-[13px] text-white",
            )}
          >
            {cta.label} »
          </Link>
        </div>
      </section>
    </div>
  );
}
