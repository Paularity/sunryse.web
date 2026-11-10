import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { RichText } from "@/components/fx";
import { CalculatorWizard } from "@/components/pages/calculator/calculator-wizard";
import { CalculatorFromQuery } from "@/components/pages/calculator/calculator-loader";
import { getCalculatorConfig, getSite } from "@/lib/content";
import { getCalculatorPage } from "@/lib/content/pages/calculator";
import { t } from "@/lib/content/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getCalculatorPage();
  return { title: meta.title, description: meta.description, alternates: { canonical: "/calculator" } };
}

export default async function CalculatorPage() {
  const [page, config, site] = await Promise.all([getCalculatorPage(), getCalculatorConfig(), getSite()]);
  const { ui } = site;
  const wizard = { config, copy: page.wizard, ui, messengerUrl: site.messengerUrl };

  return (
    <div className="relative isolate bg-[linear-gradient(180deg,var(--color-sky-200),var(--color-day-50)_30%,var(--color-dawn-50))] pt-[calc(var(--site-top)+4px)] pb-16 leading-[normal]">
      <div
        aria-hidden
        className="fx-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-full max-h-[900px] [mask-image:radial-gradient(90%_75%_at_50%_20%,black,transparent_80%)]"
      />
      <div className="container-site flex flex-col gap-[30px]">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex flex-col gap-3">
            <nav aria-label={t(ui, "breadcrumb")} className="font-label text-[12px] uppercase tracking-[0.12em] text-ink-muted">
              <Link href="/" className="hover:text-navy-900">
                {t(ui, "home")}
              </Link>{" "}
              / <span aria-current="page" className="text-sun-700">{page.breadcrumb}</span>
            </nav>
            <h1 className="m-0 font-display text-[clamp(34px,4.6vw,64px)] leading-[1.02] font-bold tracking-[-0.045em]">
              <RichText text={page.heading} />
            </h1>
          </div>
          <p className="m-0 max-w-[400px] text-[16px] leading-[1.6] text-ink-muted">{page.lead}</p>
        </header>

        <Suspense fallback={<CalculatorWizard {...wizard} />}>
          <CalculatorFromQuery {...wizard} />
        </Suspense>
      </div>
    </div>
  );
}
